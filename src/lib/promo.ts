import { sql } from "./db";

// Промокоди volya.finance — наша маркетингова знижка, яка доставляється в поліс тим
// самим механізмом, що й бонуси: Ukasko v2 `discountPercent` коштом нашої комісії
// (стеля maxDiscount по пропозиції). Промокоди Ukasko (їхній `promoCode`) доступні
// лише landing-акаунтам і не поєднуються з discountPercent, тому не використовуємо.
//
// promo_codes — довідник (адмінка /api/admin/promo); promo_uses — факт застосування
// до заявки (held при заявленні → applied при видачі поліса; used_count рахує
// лише applied).

export type PromoKind = "percent" | "amount";
export type PromoProduct = "all" | "osago" | "tourism" | "greencard";

export interface PromoCode {
  code: string;
  kind: PromoKind;
  value: number;             // відсоток (percent) або гривні (amount)
  product: PromoProduct;
  maxDiscount: number | null; // стеля знижки в грн для percent-коду (null — без стелі)
  validFrom: string | null;
  validUntil: string | null;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
  note: string | null;
  createdAt: string;
}

let schemaPromise: Promise<void> | null = null;
function ensurePromoSchema(): Promise<void> {
  if (!sql) return Promise.resolve();
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS promo_codes (
          code         text PRIMARY KEY,             -- у верхньому регістрі
          kind         text NOT NULL,                -- percent | amount
          value        numeric NOT NULL,
          product      text NOT NULL DEFAULT 'all',  -- all | osago | tourism | greencard
          max_discount numeric,
          valid_from   timestamptz,
          valid_until  timestamptz,
          max_uses     integer,
          used_count   integer NOT NULL DEFAULT 0,
          active       boolean NOT NULL DEFAULT true,
          note         text,
          created_at   timestamptz NOT NULL DEFAULT now()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS promo_uses (
          order_id    text PRIMARY KEY,
          code        text NOT NULL,
          email       text,
          product     text NOT NULL,
          amount      numeric NOT NULL,
          status      text NOT NULL DEFAULT 'held',  -- held | applied
          created_at  timestamptz NOT NULL DEFAULT now(),
          updated_at  timestamptz NOT NULL DEFAULT now()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS promo_uses_code_idx ON promo_uses (code, status)`;
    })().catch((e) => {
      schemaPromise = null;
      throw e;
    });
  }
  return schemaPromise;
}

export const normalizePromoCode = (raw: string): string => raw.trim().toUpperCase().replace(/\s+/g, "").slice(0, 32);

function rowToPromo(r: Record<string, unknown>): PromoCode {
  const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : v ? String(v) : null);
  return {
    code: String(r.code),
    kind: r.kind === "amount" ? "amount" : "percent",
    value: Number(r.value) || 0,
    product: (["all", "osago", "tourism", "greencard"].includes(String(r.product)) ? String(r.product) : "all") as PromoProduct,
    maxDiscount: r.max_discount === null || r.max_discount === undefined ? null : Number(r.max_discount),
    validFrom: iso(r.valid_from),
    validUntil: iso(r.valid_until),
    maxUses: r.max_uses === null || r.max_uses === undefined ? null : Number(r.max_uses),
    usedCount: Number(r.used_count) || 0,
    active: r.active !== false,
    note: r.note ? String(r.note) : null,
    createdAt: iso(r.created_at) ?? "",
  };
}

export async function getPromoCode(code: string): Promise<PromoCode | null> {
  if (!sql) return null;
  const c = normalizePromoCode(code);
  if (!c) return null;
  await ensurePromoSchema();
  const [r] = await sql`SELECT * FROM promo_codes WHERE code = ${c} LIMIT 1`;
  return r ? rowToPromo(r) : null;
}

export type PromoCheck =
  | { ok: true; promo: PromoCode; discount: number }
  | { ok: false; reason: "unknown" | "inactive" | "expired" | "not-started" | "exhausted" | "wrong-product" | "zero"; message: string };

/** Перевіряє код і рахує знижку в грн для цієї ціни (ще БЕЗ стелі Ukasko maxDiscount). */
export async function checkPromoCode(code: string, product: Exclude<PromoProduct, "all">, price: number): Promise<PromoCheck> {
  const promo = await getPromoCode(code);
  if (!promo) return { ok: false, reason: "unknown", message: "Такого промокоду немає. Перевірте написання." };
  if (!promo.active) return { ok: false, reason: "inactive", message: "Цей промокод більше не діє." };
  const now = Date.now();
  if (promo.validFrom && new Date(promo.validFrom).getTime() > now) return { ok: false, reason: "not-started", message: "Цей промокод ще не почав діяти." };
  if (promo.validUntil && new Date(promo.validUntil).getTime() < now) return { ok: false, reason: "expired", message: "Термін дії промокоду закінчився." };
  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) return { ok: false, reason: "exhausted", message: "Ліміт використань цього промокоду вичерпано." };
  if (promo.product !== "all" && promo.product !== product) return { ok: false, reason: "wrong-product", message: "Цей промокод діє на інший вид страхування." };
  let discount = promo.kind === "percent" ? (price * promo.value) / 100 : promo.value;
  if (promo.maxDiscount !== null) discount = Math.min(discount, promo.maxDiscount);
  discount = Math.floor(Math.max(0, Math.min(discount, price)));
  if (discount < 1) return { ok: false, reason: "zero", message: "Для цієї ціни промокод не дає знижки." };
  return { ok: true, promo, discount };
}

/** Фіксує застосування коду до заявки (ідемпотентно за orderId). */
export async function holdPromoUse(input: { orderId: string; code: string; email?: string | null; product: string; amount: number }): Promise<void> {
  if (!sql) return;
  const amount = Math.round(input.amount);
  if (!input.orderId || amount <= 0) return;
  await ensurePromoSchema();
  await sql`
    INSERT INTO promo_uses (order_id, code, email, product, amount)
    VALUES (${input.orderId}, ${normalizePromoCode(input.code)}, ${input.email ? input.email.trim().toLowerCase() : null}, ${input.product}, ${amount})
    ON CONFLICT (order_id) DO NOTHING
  `;
}

/** Поліс видано → використання зараховується в used_count (один раз на заявку). */
export async function applyPromoUse(orderId: string): Promise<void> {
  if (!sql || !orderId) return;
  await ensurePromoSchema();
  const rows = await sql`
    UPDATE promo_uses SET status = 'applied', updated_at = now()
    WHERE order_id = ${orderId} AND status = 'held'
    RETURNING code
  `;
  const code = rows[0]?.code as string | undefined;
  if (code) await sql`UPDATE promo_codes SET used_count = used_count + 1 WHERE code = ${code}`;
}

// ---- адмінка ----

export async function listPromoCodes(): Promise<PromoCode[]> {
  if (!sql) return [];
  await ensurePromoSchema();
  const rows = await sql`SELECT * FROM promo_codes ORDER BY created_at DESC LIMIT 200`;
  return rows.map((r) => rowToPromo(r as Record<string, unknown>));
}

export async function upsertPromoCode(p: {
  code: string; kind: PromoKind; value: number; product?: PromoProduct; maxDiscount?: number | null;
  validFrom?: string | null; validUntil?: string | null; maxUses?: number | null; active?: boolean; note?: string | null;
}): Promise<PromoCode | null> {
  if (!sql) return null;
  const code = normalizePromoCode(p.code);
  if (!code || !(p.value > 0)) throw new Error("Код і значення знижки обовʼязкові.");
  if (p.kind === "percent" && p.value > 100) throw new Error("Відсоток знижки не може перевищувати 100.");
  await ensurePromoSchema();
  await sql`
    INSERT INTO promo_codes (code, kind, value, product, max_discount, valid_from, valid_until, max_uses, active, note)
    VALUES (${code}, ${p.kind}, ${p.value}, ${p.product ?? "all"}, ${p.maxDiscount ?? null}, ${p.validFrom ?? null}, ${p.validUntil ?? null}, ${p.maxUses ?? null}, ${p.active ?? true}, ${p.note ?? null})
    ON CONFLICT (code) DO UPDATE SET
      kind = EXCLUDED.kind, value = EXCLUDED.value, product = EXCLUDED.product, max_discount = EXCLUDED.max_discount,
      valid_from = EXCLUDED.valid_from, valid_until = EXCLUDED.valid_until, max_uses = EXCLUDED.max_uses,
      active = EXCLUDED.active, note = EXCLUDED.note
  `;
  return getPromoCode(code);
}

export async function setPromoActive(code: string, active: boolean): Promise<void> {
  if (!sql) return;
  await ensurePromoSchema();
  await sql`UPDATE promo_codes SET active = ${active} WHERE code = ${normalizePromoCode(code)}`;
}
