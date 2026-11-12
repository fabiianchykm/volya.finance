import { NextRequest, NextResponse } from "next/server";
import { guardRequest } from "@/lib/api-guard";
import { checkPromoCode, normalizePromoCode } from "@/lib/promo";

// Перевірка промокоду на чекауті: { code, product, price } → знижка в грн для цієї
// ціни (стеля страхової maxDiscount застосовується вже при заявленні). Ліміт
// запитів — щоб коди не перебирали.
export async function POST(req: NextRequest) {
  const blocked = guardRequest(req, { name: "promo", limit: 20, windowMs: 10 * 60 * 1000 });
  if (blocked) return blocked;
  try {
    const body = await req.json().catch(() => ({}));
    const code = normalizePromoCode(String(body?.code ?? ""));
    const product = body?.product === "tourism" || body?.product === "greencard" ? body.product : "osago";
    const price = Number(body?.price) || 0;
    if (!code) return NextResponse.json({ success: true, valid: false, message: "Введіть промокод." });
    const r = await checkPromoCode(code, product, price);
    if (!r.ok) return NextResponse.json({ success: true, valid: false, reason: r.reason, message: r.message });
    return NextResponse.json({
      success: true, valid: true, code: r.promo.code, kind: r.promo.kind, value: r.promo.value, discount: r.discount,
      message: r.promo.kind === "percent" ? `Промокод ${r.promo.code}: −${r.promo.value}%` : `Промокод ${r.promo.code}: −${r.discount} ₴`,
    });
  } catch (e) {
    console.error("[promo] check error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ success: false, error: "Не вдалося перевірити промокод. Спробуйте ще раз." }, { status: 500 });
  }
}
