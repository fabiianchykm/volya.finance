import { NextRequest, NextResponse } from "next/server";
import { guardRequest } from "@/lib/api-guard";
import { ukaskoService } from "@/services/ukasko";
import { notifyDevError } from "@/lib/telegram";
import type { PetsParams } from "@/types/api";

// Комісія агента (тариф). Має бути серед доступних /insurance/pets/tariffs.
const PETS_EARNINGS = 15;

// Калькулятор страхування тварин: дата початку + строк → реальні пропозиції.
export async function POST(req: NextRequest) {
  const blocked = guardRequest(req, { name: "pets", limit: 30, windowMs: 10 * 60 * 1000 });
  if (blocked) return blocked;

  let params: PetsParams;
  try {
    const body = await req.json();
    const period = String(body?.insurancePeriod);
    params = {
      startFrom: String(body?.startFrom ?? ""),                 // d.m.Y
      insurancePeriod: (["6m", "9m", "12m"].includes(period) ? period : "12m") as PetsParams["insurancePeriod"],
      earnings: PETS_EARNINGS,
    };
  } catch {
    return NextResponse.json({ success: false, error: "Некоректний запит" }, { status: 400 });
  }

  if (!/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(params.startFrom)) {
    return NextResponse.json({ success: false, error: "Вкажіть дату початку" }, { status: 400 });
  }

  try {
    const offers = await ukaskoService.getPetsOffers(params);
    return NextResponse.json({ success: true, offers });
  } catch (e) {
    console.error("[pets] calc error:", e instanceof Error ? e.message : e);
    await notifyDevError("pets calculator", e);
    return NextResponse.json({ success: false, error: "Не вдалося отримати пропозиції. Спробуйте пізніше." }, { status: 500 });
  }
}
