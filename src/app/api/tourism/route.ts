import { NextRequest, NextResponse } from "next/server";
import { guardRequest } from "@/lib/api-guard";
import { ukaskoService } from "@/services/ukasko";
import { notifyDevError } from "@/lib/telegram";
import type { TourismParams } from "@/types/api";

// Калькулятор туристичного страхування: параметри подорожі → реальні пропозиції.

export async function POST(req: NextRequest) {
  const blocked = guardRequest(req, { name: "tourism", limit: 30, windowMs: 10 * 60 * 1000 });
  if (blocked) return blocked;

  let params: TourismParams;
  try {
    const body = await req.json();
    params = {
      birthDates: Array.isArray(body?.birthDates) ? body.birthDates.map(String) : [],
      country: { id: Number(body?.country?.id), name: String(body?.country?.name ?? "") },
      date: String(body?.date ?? ""),      // d.m.Y
      days: Number(body?.days),
      multiVisa: !!body?.multiVisa,
      tourists: Number(body?.tourists),
    };
  } catch {
    return NextResponse.json({ success: false, error: "Некоректний запит" }, { status: 400 });
  }

  if (!params.country.id || !params.days || !params.tourists || !params.birthDates.length || !/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(params.date)) {
    return NextResponse.json({ success: false, error: "Заповніть усі поля" }, { status: 400 });
  }

  try {
    const offers = await ukaskoService.getTourismOffers(params);
    return NextResponse.json({ success: true, offers });
  } catch (e) {
    console.error("[tourism] calc error:", e instanceof Error ? e.message : e);
    await notifyDevError("tourism calculator", e);
    return NextResponse.json({ success: false, error: "Не вдалося отримати пропозиції. Спробуйте пізніше." }, { status: 500 });
  }
}
