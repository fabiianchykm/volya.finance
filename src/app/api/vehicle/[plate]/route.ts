import { NextRequest, NextResponse } from "next/server";
import { ukaskoService } from "@/services/ukasko";
import { guardRequest } from "@/lib/api-guard";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ plate: string }> }
) {
  try {
    // Пошук авто за номером віддає персональні дані — захищаємо від перебору.
    const blocked = guardRequest(req, { name: "vehicle", limit: 20, windowMs: 10 * 60 * 1000 });
    if (blocked) return blocked;

    const { plate } = await params;
    const decoded = decodeURIComponent(plate).toUpperCase().replace(/\s/g, "");
    const data = await ukaskoService.getCarByPlate(decoded);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const raw = error instanceof Error ? error.message : "Unknown error";
    console.error("[vehicle API]", raw);
    const transient = /\b50[234]\b|gateway time-?out|timeout/i.test(raw);
    const message = transient
      ? "Реєстр тимчасово недоступний. Спробуйте ще раз або введіть дані авто вручну."
      : "Авто не знайдено в реєстрі";
    return NextResponse.json({ success: false, error: message }, { status: transient ? 503 : 500 });
  }
}
