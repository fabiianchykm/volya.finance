import { NextRequest, NextResponse } from "next/server";
import { guardRequest } from "@/lib/api-guard";
import { ukaskoService } from "@/services/ukasko";
import { notifyDevError } from "@/lib/telegram";
import type { PetsParams } from "@/types/api";

// Калькулятор страхування тварин: дата початку + строк → реальні пропозиції.
export async function POST(req: NextRequest) {
  const blocked = guardRequest(req, { name: "pets", limit: 30, windowMs: 10 * 60 * 1000 });
  if (blocked) return blocked;

  let startFrom: string;
  let insurancePeriod: PetsParams["insurancePeriod"];
  try {
    const body = await req.json();
    const period = String(body?.insurancePeriod);
    startFrom = String(body?.startFrom ?? "");                  // d.m.Y
    insurancePeriod = (["6m", "9m", "12m"].includes(period) ? period : "12m") as PetsParams["insurancePeriod"];
  } catch {
    return NextResponse.json({ success: false, error: "Некоректний запит" }, { status: 400 });
  }

  if (!/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(startFrom)) {
    return NextResponse.json({ success: false, error: "Вкажіть дату початку" }, { status: 400 });
  }

  try {
    // Комісія (earnings) залежить від тарифів страховика. Беремо доступні тарифи
    // й перебираємо їх (за зростанням), повертаючи перший, що дає пропозиції —
    // так не залежимо від конкретного значення (на dev 15, на проді може інше).
    let tariffs = await ukaskoService.getPetsTariffs();
    if (!tariffs.length) tariffs = [15, 20, 30, 40];
    tariffs = [...new Set(tariffs)].sort((a, b) => a - b);

    for (const earnings of tariffs) {
      const offers = await ukaskoService.getPetsOffers({ startFrom, insurancePeriod, earnings });
      if (offers.length) return NextResponse.json({ success: true, offers, earnings });
    }
    return NextResponse.json({ success: true, offers: [] });
  } catch (e) {
    console.error("[pets] calc error:", e instanceof Error ? e.message : e);
    await notifyDevError("pets calculator", e);
    return NextResponse.json({ success: false, error: "Не вдалося отримати пропозиції. Спробуйте пізніше." }, { status: 500 });
  }
}
