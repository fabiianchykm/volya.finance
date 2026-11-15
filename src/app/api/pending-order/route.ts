import { NextRequest, NextResponse } from "next/server";
import { withJourney } from "@/lib/journey";
import { guardRequest } from "@/lib/api-guard";
import { savePendingOrder, type PendingProduct, type PendingMeta } from "@/lib/pending-orders";

// Реєстрація контексту фіналізації одразу після declare. Дозволяє укласти договір
// на /payment-success для будь-якого продукту (не лише ОСЦПВ). Best-effort: якщо БД
// не налаштована або запис не вдався — не блокуємо оформлення.
const PRODUCTS: PendingProduct[] = ["osago", "tourism", "greencard", "housing", "pets", "mini-kasko", "accident"];

async function handlePost(req: NextRequest) {
  try {
    const blocked = guardRequest(req, { name: "pending-order", limit: 30, windowMs: 10 * 60 * 1000 });
    if (blocked) return blocked;

    const body = await req.json();
    const orderId = String(body?.orderId ?? "");
    const product = String(body?.product ?? "") as PendingProduct;
    if (!orderId || !PRODUCTS.includes(product)) {
      return NextResponse.json({ success: false, error: "orderId/product required" }, { status: 400 });
    }
    // Реферальний код фіксуємо ТУТ (із cookie клієнта): якщо поліс потім укладе
    // sweep або ручний finalize, cookie вже не буде, а 5% реферу мають нарахуватись.
    const refCookie = req.cookies.get("ref")?.value ?? null;
    const refCode = refCookie && /^[a-z0-9]{4,16}$/i.test(refCookie) ? refCookie.toLowerCase() : null;
    const meta = (body?.meta as PendingMeta | undefined) ?? null;
    await savePendingOrder({
      orderId,
      product,
      orderPayload: (body?.order as Record<string, unknown> | undefined) ?? null,
      meta: meta || refCode ? { ...(meta ?? {}), ...(refCode ? { refCode } : {}) } : null,
    });
    return NextResponse.json({ success: true });
  } catch {
    // Ніколи не валимо оформлення через збій реєстрації — фіналізація має fallback.
    return NextResponse.json({ success: true, stored: false });
  }
}

export const POST = withJourney("pending-order", handlePost);
