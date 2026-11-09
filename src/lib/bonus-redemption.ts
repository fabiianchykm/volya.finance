import { sql } from "./db";
import { getBonusBreakdownMulti } from "./bonus";
import { resolveIdentities } from "./identity";

// Списання бонусів у рахунок знижки на поліс (Ukasko v2 discountPercent — знижка
// коштом нашої комісії, стеля maxDiscount у кожній пропозиції).
//
// Життєвий цикл одного списання (рядок bonus_redemptions, ключ — orderId):
//   held     — заявку створено зі знижкою; сума ЗАРЕЗЕРВОВАНА (не входить у доступний
//              залишок), але з рахунку ще не знята — клієнт може не оплатити;
//   applied  — поліс оплачено й видано → у bonus_entries зʼявляється відʼємний запис
//              redeem:{orderId}, баланс зменшується назавжди;
//   released — заявку так і не оплатили (резерв старший за HOLD_TTL_HOURS) → резерв
//              знято, бонуси знову доступні. Якщо її все ж оплатять пізніше —
//              apply спрацює й так (рядок лишається, знижка в заявці вже зафіксована).

export const HOLD_TTL_HOURS = 24;

export interface BonusAvailability {
  emails: string[];   // усі повʼязані email-и людини (рівноправна звʼязка акаунтів)
  total: number;      // залишок на рахунку (нараховано − списано)
  held: number;       // активні резерви за неоплаченими заявками
  available: number;  // можна списати зараз = total − held
}

let schemaPromise: Promise<void> | null = null;
function ensureRedemptionSchema(): Promise<void> {
  if (!sql) return Promise.resolve();
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS bonus_redemptions (
          order_id    text PRIMARY KEY,
          email       text NOT NULL,
          product     text NOT NULL,
          amount      numeric NOT NULL,
          status      text NOT NULL DEFAULT 'held',   -- held | applied | released
          created_at  timestamptz NOT NULL DEFAULT now(),
          updated_at  timestamptz NOT NULL DEFAULT now()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS bonus_redemptions_email_idx ON bonus_redemptions (lower(email), status)`;
    })().catch((e) => {
      schemaPromise = null;
      throw e;
    });
  }
  return schemaPromise;
}

const norm = (email: string) => email.trim().toLowerCase();

/** Скільки бонусів людина може списати прямо зараз (з урахуванням резервів). */
export async function getBonusAvailability(email: string): Promise<BonusAvailability> {
  const e = norm(email);
  const empty = { emails: e ? [e] : [], total: 0, held: 0, available: 0 };
  if (!sql || !e) return empty;
  await ensureRedemptionSchema();
  const ids = await resolveIdentities({ email: e }).catch(() => ({ emails: [e], phones: [] as string[] }));
  const emails = [...new Set([e, ...ids.emails.map(norm)].filter(Boolean))];
  const breakdown = await getBonusBreakdownMulti(emails);
  const [row] = await sql<{ held: string }[]>`
    SELECT COALESCE(SUM(amount), 0) AS held
    FROM bonus_redemptions
    WHERE status = 'held'
      AND lower(email) = ANY(${emails})
      AND created_at > now() - (${HOLD_TTL_HOURS} * interval '1 hour')
  `;
  const held = Number(row?.held ?? 0) || 0;
  return { emails, total: breakdown.total, held, available: Math.max(0, Math.floor(breakdown.total - held)) };
}

/** Резервує списання під створену заявку (ідемпотентно за orderId). */
export async function holdBonusRedemption(input: { orderId: string; email: string; product: string; amount: number }): Promise<void> {
  if (!sql) return;
  const amount = Math.round(input.amount);
  if (!input.orderId || amount <= 0) return;
  await ensureRedemptionSchema();
  await sql`
    INSERT INTO bonus_redemptions (order_id, email, product, amount)
    VALUES (${input.orderId}, ${norm(input.email)}, ${input.product}, ${amount})
    ON CONFLICT (order_id) DO NOTHING
  `;
}

export interface BonusRedemption { orderId: string; email: string; product: string; amount: number; status: "held" | "applied" | "released" }

export async function getBonusRedemption(orderId: string): Promise<BonusRedemption | null> {
  if (!sql || !orderId) return null;
  await ensureRedemptionSchema();
  const [r] = await sql`SELECT order_id, email, product, amount, status FROM bonus_redemptions WHERE order_id = ${orderId} LIMIT 1`;
  if (!r) return null;
  return { orderId: r.order_id, email: r.email, product: r.product, amount: Number(r.amount) || 0, status: r.status };
}

/**
 * Поліс за заявкою оплачено й видано → списуємо резерв з рахунку назавжди.
 * Ідемпотентно: повторні виклики (клієнтський /api/policies + серверний finalize +
 * sweep) не подвоюють списання. Повертає списану суму (0 — списання не було).
 */
export async function applyBonusRedemption(orderId: string): Promise<number> {
  if (!sql || !orderId) return 0;
  const r = await getBonusRedemption(orderId);
  if (!r || r.amount <= 0) return 0;
  await sql`
    INSERT INTO bonus_entries (id, email, kind, amount, policy_id)
    VALUES (${`redeem:${orderId}`}, ${r.email}, ${"redeem"}, ${-r.amount}, ${orderId})
    ON CONFLICT (id) DO NOTHING
  `;
  await sql`UPDATE bonus_redemptions SET status = 'applied', updated_at = now() WHERE order_id = ${orderId} AND status <> 'applied'`;
  return r.amount;
}

/** Знімає резерви за заявками, які так і не оплатили (старші за HOLD_TTL_HOURS). */
export async function releaseStaleBonusHolds(): Promise<number> {
  if (!sql) return 0;
  await ensureRedemptionSchema();
  const rows = await sql`
    UPDATE bonus_redemptions SET status = 'released', updated_at = now()
    WHERE status = 'held' AND created_at <= now() - (${HOLD_TTL_HOURS} * interval '1 hour')
    RETURNING order_id
  `;
  return rows.length;
}
