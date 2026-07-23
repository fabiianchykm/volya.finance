import { NextRequest, NextResponse } from "next/server";
import { guardRequest } from "@/lib/api-guard";
import { ukaskoService } from "@/services/ukasko";
import { notifyDevError } from "@/lib/telegram";
import type { GreenCardParams } from "@/types/api";

// Калькулятор «Зелена карта»: параметри поїздки → реальні пропозиції з цінами
// (Ukasko POST /insurance/greencard/calculator).

export async function POST(req: NextRequest) {
  const blocked = guardRequest(req, { name: "greencard", limit: 30, windowMs: 10 * 60 * 1000 });
  if (blocked) return blocked;

  let params: GreenCardParams;
  try {
    const body = await req.json();
    params = {
      country: Number(body?.country),
      userType: Number(body?.userType ?? 1),
      startDate: String(body?.startDate ?? ""),      // YYYY-MM-DD
      periodOption: Number(body?.periodOption),
      carType: String(body?.carType ?? ""),
      carNumber: body?.carNumber ? String(body.carNumber) : undefined,
    };
  } catch {
    return NextResponse.json({ success: false, error: "Некоректний запит" }, { status: 400 });
  }

  if (!params.country || !params.periodOption || !params.carType || !/^\d{4}-\d{2}-\d{2}$/.test(params.startDate)) {
    return NextResponse.json({ success: false, error: "Заповніть усі поля" }, { status: 400 });
  }

  try {
    const offers = await ukaskoService.getGreenCardOffers(params);
    return NextResponse.json({ success: true, offers });
  } catch (e) {
    console.error("[greencard] calc error:", e instanceof Error ? e.message : e);
    await notifyDevError("greencard calculator", e);
    return NextResponse.json(
      { success: false, error: "Не вдалося отримати пропозиції. Спробуйте пізніше." },
      { status: 500 }
    );
  }
}
