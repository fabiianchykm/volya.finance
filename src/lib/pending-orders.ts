import { sql, ensureSchema } from "./db";

// Контекст фіналізації замовлення після оплати. Зберігається при declare, зчитується
// на /payment-success (через /api/finalize), щоб укласти договір для БУДЬ-ЯКОГО
// продукту й зберегти поліс — навіть якщо клієнта редіректнуло з модалки оплати.
export type PendingProduct = "osago" | "tourism" | "greencard" | "housing" | "pets" | "mini-kasko";

export interface PendingMeta {
  email?: string | null;
  phone?: string | null;
  customerName?: string | null;
  customer?: Record<string, unknown> | null;
  company?: string | null;
  price?: number | null;
  vehicle?: Record<string, unknown> | null;
  startDate?: string | null;
  endDate?: string | null;
  productLabel?: string | null; // людська назва для карток/бота
}

export interface PendingOrder {
  orderId: string;
  product: PendingProduct;
  orderPayload: Record<string, unknown> | null; // повний order (потрібен лише туризму)
  meta: PendingMeta | null;
  finalized: boolean;
}

const json = (v: unknown) => sql!.json(JSON.parse(JSON.stringify(v ?? null)));

export async function savePendingOrder(p: {
  orderId: string;
  product: PendingProduct;
  orderPayload?: Record<string, unknown> | null;
  meta?: PendingMeta | null;
}): Promise<void> {
  if (!sql) return;
  await ensureSchema();
  await sql`
    INSERT INTO pending_orders (order_id, product, order_payload, meta)
    VALUES (${p.orderId}, ${p.product}, ${json(p.orderPayload)}, ${json(p.meta)})
    ON CONFLICT (order_id) DO UPDATE SET
      product = EXCLUDED.product,
      order_payload = COALESCE(EXCLUDED.order_payload, pending_orders.order_payload),
      meta = COALESCE(EXCLUDED.meta, pending_orders.meta)
  `;
}

export async function getPendingOrder(orderId: string): Promise<PendingOrder | null> {
  if (!sql) return null;
  await ensureSchema();
  const rows = await sql`SELECT order_id, product, order_payload, meta, finalized FROM pending_orders WHERE order_id = ${orderId} LIMIT 1`;
  const r = rows[0];
  if (!r) return null;
  return {
    orderId: r.order_id,
    product: r.product,
    orderPayload: r.order_payload ?? null,
    meta: r.meta ?? null,
    finalized: !!r.finalized,
  };
}

export async function markPendingFinalized(orderId: string): Promise<void> {
  if (!sql) return;
  await sql`UPDATE pending_orders SET finalized = true WHERE order_id = ${orderId}`;
}
