import { NextRequest, NextResponse } from "next/server";
import { guardRequest } from "@/lib/api-guard";
import { savePendingOrder, type PendingProduct, type PendingMeta } from "@/lib/pending-orders";

// Реєстрація контексту фіналізації одразу після declare. Дозволяє укласти договір
// на /payment-success для будь-якого продукту (не лише ОСЦПВ). Best-effort: якщо БД
// не налаштована або запис не вдався — не блокуємо оформлення.
const PRODUCTS: PendingProduct[] = ["osago", "tourism", "greencard", "housing", "pets", "mini-kasko"];

export async function POST(req: NextRequest) {
  try {
    const blocked = guardRequest(req, { name: "pending-order", limit: 30, windowMs: 10 * 60 * 1000 });
    if (blocked) return blocked;

    const body = await req.json();
    const orderId = String(body?.orderId ?? "");
    const product = String(body?.product ?? "") as PendingProduct;
    if (!orderId || !PRODUCTS.includes(product)) {
      return NextResponse.json({ success: false, error: "orderId/product required" }, { status: 400 });
    }
    await savePendingOrder({
      orderId,
      product,
      orderPayload: (body?.order as Record<string, unknown> | undefined) ?? null,
      meta: (body?.meta as PendingMeta | undefined) ?? null,
    });
    return NextResponse.json({ success: true });
  } catch {
    // Ніколи не валимо оформлення через збій реєстрації — фіналізація має fallback.
    return NextResponse.json({ success: true, stored: false });
  }
}
