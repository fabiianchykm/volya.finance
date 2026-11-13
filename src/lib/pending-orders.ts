import { sql, ensureSchema } from "./db";

// Контекст фіналізації замовлення після оплати. Зберігається при declare, зчитується
// на /payment-success (через /api/finalize), щоб укласти договір для БУДЬ-ЯКОГО
// продукту й зберегти поліс — навіть якщо клієнта редіректнуло з модалки оплати.
export type PendingProduct = "osago" | "tourism" | "greencard" | "housing" | "pets" | "mini-kasko" | "accident";

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

export interface UnfinalizedOrder extends PendingOrder {
  createdAt: string;
  alertedAt: string | null;
  paidSeenAt: string | null;
}

// Неукладені замовлення для safety-net sweep. minAgeMinutes — пропускаємо зовсім
// свіжі (щоб не перетинатись із живим /payment-success finalize); maxAgeHours —
// беремо лише недавні (старіші вже або оброблені вручну, або протухли) — КРІМ тих,
// де вже бачили оплату (paid_seen_at): вони лишаються у вибірці, поки не укладені
// (жорстка межа PAID_MAX_AGE_DAYS, щоб не крутити вічно те, що вирішили вручну).
export async function listUnfinalizedOrders(opts: { minAgeMinutes?: number; maxAgeHours?: number; limit?: number } = {}): Promise<UnfinalizedOrder[]> {
  if (!sql) return [];
  await ensureSchema();
  const minAge = opts.minAgeMinutes ?? 2;
  const maxAge = opts.maxAgeHours ?? 72;
  const limit = opts.limit ?? 100;
  const rows = await sql`
    SELECT order_id, product, order_payload, meta, finalized, created_at, alerted_at, paid_seen_at
    FROM pending_orders
    WHERE finalized = false
      AND created_at <= now() - (${minAge} * interval '1 minute')
      AND (
        created_at >= now() - (${maxAge} * interval '1 hour')
        OR (paid_seen_at IS NOT NULL AND created_at >= now() - (${PAID_MAX_AGE_DAYS} * interval '1 day'))
      )
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  return rows.map((r) => ({
    orderId: r.order_id,
    product: r.product,
    orderPayload: r.order_payload ?? null,
    meta: r.meta ?? null,
    finalized: !!r.finalized,
    createdAt: String(r.created_at),
    alertedAt: r.alerted_at ? String(r.alerted_at) : null,
    paidSeenAt: r.paid_seen_at ? String(r.paid_seen_at) : null,
  }));
}

const PAID_MAX_AGE_DAYS = 60;

/** Sweep побачив оплату — замовлення не має випасти з вибірки, поки не укладене. */
export async function markPendingPaidSeen(orderId: string): Promise<void> {
  if (!sql) return;
  await sql`UPDATE pending_orders SET paid_seen_at = COALESCE(paid_seen_at, now()) WHERE order_id = ${orderId}`;
}

export async function markPendingAlerted(orderId: string): Promise<void> {
  if (!sql) return;
  await sql`UPDATE pending_orders SET alerted_at = now() WHERE order_id = ${orderId}`;
}
