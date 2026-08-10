import { NextRequest, NextResponse } from "next/server";
import { ukaskoService } from "@/services/ukasko";
import { guardRequest } from "@/lib/api-guard";
import { notifyDevError } from "@/lib/telegram";

// Калькулятор міні-КАСКО: {start_date, city_id} → пропозиції по СК (покриття
// 400k/800k/1.2M). Флоу далі: /api/mini-kasko/order (declare/otp/confirm/download).
export async function POST(req: NextRequest) {
  try {
    const blocked = guardRequest(req, { name: "mini-kasko", limit: 30, windowMs: 10 * 60 * 1000 });
    if (blocked) return blocked;

    const body = await req.json();
    const start_date = String(body?.start_date ?? "");
    const city_id = Number(body?.city_id);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start_date) || !city_id) {
      return NextResponse.json({ success: false, error: "Оберіть місто та дату початку" }, { status: 400 });
    }

    const offers = await ukaskoService.getMiniKaskoOffers({ start_date, city_id });
    return NextResponse.json({ success: true, offers });
  } catch (e) {
    console.error("[mini-kasko] error →", e instanceof Error ? e.message : e);
    await notifyDevError("mini-kasko calculator", e);
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Помилка розрахунку" }, { status: 500 });
  }
}
