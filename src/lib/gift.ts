import { randomInt } from "crypto";
import { sql } from "./db";

// Подарункові сертифікати на страхування. Покупець залишає заявку на /gift (сума,
// контакти, кому й привітання) → менеджеру летить Telegram, заявка зʼявляється в
// /admin/gifts. Оплата — переказом на рахунок (реквізити нижче), власного еквайрингу
// немає. Після надходження грошей менеджер ставить «Оплачено» — сертифікат стає
// активним (12 місяців). Погашення теж через менеджера: одержувач називає код,
// менеджер оформлює поліс і ставить «Використано». Сторінка сертифіката —
// /gift/<код> (код невгадуваний, 8 символів без схожих літер).

export type GiftStatus = "requested" | "paid" | "redeemed" | "cancelled";

export { GIFT_PRESETS, GIFT_MIN, GIFT_MAX, GIFT_VALID_MONTHS, GIFT_PAYEE } from "./gift-constants";
import { GIFT_VALID_MONTHS } from "./gift-constants";

export interface GiftCertificate {
  code: string;
  amount: number;
  status: GiftStatus;
  buyerName: string;
  buyerPhone: string;        // +380…
  buyerEmail: string | null;
  recipientName: string | null;
  message: string | null;
  note: string | null;       // службова примітка менеджера (поліс, яким погашено, тощо)
  createdAt: string;
  paidAt: string | null;
  validUntil: string | null;
  redeemedAt: string | null;
}

let schemaPromise: Promise<void> | null = null;
function ensureGiftSchema(): Promise<void> {
  if (!sql) return Promise.resolve();
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS gift_certificates (
          code            text PRIMARY KEY,
          amount          numeric NOT NULL,
          status          text NOT NULL DEFAULT 'requested',   -- requested | paid | redeemed | cancelled
          buyer_name      text NOT NULL,
          buyer_phone     text NOT NULL,
          buyer_email     text,
          recipient_name  text,
          message         text,
          note            text,
          created_at      timestamptz NOT NULL DEFAULT now(),
          paid_at         timestamptz,
          valid_until     timestamptz,
          redeemed_at     timestamptz
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS gift_certificates_status_idx ON gift_certificates (status, created_at DESC)`;
    })().catch((e) => { schemaPromise = null; throw e; });
  }
  return schemaPromise;
}

// Без 0/O/1/I/L — код диктують по телефону.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export function generateGiftCode(): string {
  const part = (n: number) => Array.from({ length: n }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
  return `VF-${part(4)}-${part(4)}`;
}

/** Нормалізує код із форми/URL: регістр, пробіли, дефіси; порожній рядок, якщо не схоже на код. */
export function normalizeGiftCode(raw: string): string {
  const s = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const body = s.startsWith("VF") ? s.slice(2) : s;
  return body.length === 8 ? `VF-${body.slice(0, 4)}-${body.slice(4)}` : "";
}

function mapRow(r: Record<string, unknown>): GiftCertificate {
  const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : v ? String(v) : null);
  return {
    code: String(r.code),
    amount: Number(r.amount),
    status: (r.status as GiftStatus) ?? "requested",
    buyerName: String(r.buyer_name ?? ""),
    buyerPhone: String(r.buyer_phone ?? ""),
    buyerEmail: (r.buyer_email as string) ?? null,
    recipientName: (r.recipient_name as string) ?? null,
    message: (r.message as string) ?? null,
    note: (r.note as string) ?? null,
    createdAt: iso(r.created_at) ?? "",
    paidAt: iso(r.paid_at),
    validUntil: iso(r.valid_until),
    redeemedAt: iso(r.redeemed_at),
  };
}

export async function createGiftRequest(input: {
  amount: number; buyerName: string; buyerPhone: string; buyerEmail?: string | null;
  recipientName?: string | null; message?: string | null;
}): Promise<GiftCertificate | null> {
  if (!sql) return null;
  await ensureGiftSchema();
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateGiftCode();
    try {
      const [row] = await sql<Record<string, unknown>[]>`
        INSERT INTO gift_certificates (code, amount, buyer_name, buyer_phone, buyer_email, recipient_name, message)
        VALUES (${code}, ${input.amount}, ${input.buyerName}, ${input.buyerPhone}, ${input.buyerEmail ?? null},
                ${input.recipientName ?? null}, ${input.message ?? null})
        RETURNING *
      `;
      return mapRow(row);
    } catch (e) {
      // Колізія коду (малоймовірно) — ще спроба; інша помилка — назовні.
      if (!(e instanceof Error && /duplicate key/i.test(e.message))) throw e;
    }
  }
  return null;
}

export async function getGift(code: string): Promise<GiftCertificate | null> {
  if (!sql) return null;
  const c = normalizeGiftCode(code);
  if (!c) return null;
  await ensureGiftSchema();
  const rows = await sql<Record<string, unknown>[]>`SELECT * FROM gift_certificates WHERE code = ${c} LIMIT 1`;
  return rows.length ? mapRow(rows[0]) : null;
}

export async function listGifts(limit = 200): Promise<GiftCertificate[]> {
  if (!sql) return [];
  await ensureGiftSchema();
  const rows = await sql<Record<string, unknown>[]>`SELECT * FROM gift_certificates ORDER BY created_at DESC LIMIT ${limit}`;
  return rows.map(mapRow);
}

/** Зміна статусу менеджером. paid → фіксує дату оплати й строк дії; redeemed → дату погашення. */
export async function setGiftStatus(code: string, status: GiftStatus, note?: string | null): Promise<GiftCertificate | null> {
  if (!sql) return null;
  const c = normalizeGiftCode(code);
  if (!c) return null;
  await ensureGiftSchema();
  const validUntil = new Date(); validUntil.setMonth(validUntil.getMonth() + GIFT_VALID_MONTHS);
  const rows = await sql<Record<string, unknown>[]>`
    UPDATE gift_certificates SET
      status      = ${status},
      note        = COALESCE(${note ?? null}, note),
      paid_at     = CASE WHEN ${status} = 'paid' THEN COALESCE(paid_at, now()) ELSE paid_at END,
      valid_until = CASE WHEN ${status} = 'paid' THEN COALESCE(valid_until, ${validUntil}) ELSE valid_until END,
      redeemed_at = CASE WHEN ${status} = 'redeemed' THEN COALESCE(redeemed_at, now()) ELSE redeemed_at END
    WHERE code = ${c}
    RETURNING *
  `;
  return rows.length ? mapRow(rows[0]) : null;
}

/** Чи дійсний сертифікат (оплачений і строк не минув). */
export function isGiftActive(g: GiftCertificate, now = new Date()): boolean {
  return g.status === "paid" && (!g.validUntil || new Date(g.validUntil) >= now);
}
