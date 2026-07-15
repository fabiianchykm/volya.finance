import { ulid } from "ulid";
import { sql } from "./db";
import { SITE_URL } from "./seo";

// Реферальна програма. Кожен залогінений користувач (email) має унікальний код
// і посилання ?ref=КОД. Коли друг за цим посиланням оформлює поліс, тому, хто
// запросив, нараховується БОНУС = 5% від ціни поліса друга (знижка на наступний
// поліс; застосування наразі вручну менеджером). Прив'язка — за email рефера.
//
// Дедуплікація: referrals.id = id поліса → один бонус на один поліс.

export const BONUS_RATE = 0.05; // 5%

// Ідемпотентне створення таблиць (кешуємо проміс на процес, як у db.ts).
let schemaPromise: Promise<void> | null = null;
function ensureReferralSchema(): Promise<void> {
  if (!sql) return Promise.resolve();
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS referral_codes (
          email       text PRIMARY KEY,
          code        text NOT NULL UNIQUE,
          created_at  timestamptz NOT NULL DEFAULT now()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS referrals (
          id             text PRIMARY KEY,           -- id поліса друга (дедуп)
          referrer_email text NOT NULL,
          referred_email text,
          policy_price   numeric,
          bonus_amount   numeric NOT NULL DEFAULT 0,
          created_at     timestamptz NOT NULL DEFAULT now()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS referrals_referrer_idx ON referrals (lower(referrer_email))`;
    })().catch((e) => {
      schemaPromise = null;
      throw e;
    });
  }
  return schemaPromise;
}

function norm(email: string): string {
  return email.trim().toLowerCase();
}

/** Повертає (створюючи за потреби) реферальний код користувача. */
export async function getOrCreateReferralCode(email: string): Promise<string | null> {
  if (!sql) return null;
  await ensureReferralSchema();
  const e = norm(email);

  const existing = await sql<{ code: string }[]>`SELECT code FROM referral_codes WHERE email = ${e}`;
  if (existing.length) return existing[0].code;

  // Кілька спроб на випадок (малоймовірної) колізії коду.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = ulid().slice(-8).toLowerCase();
    try {
      await sql`INSERT INTO referral_codes (email, code) VALUES (${e}, ${code})`;
      return code;
    } catch {
      // конфлікт email (гонка) → читаємо існуючий; конфлікт code → нова спроба
      const row = await sql<{ code: string }[]>`SELECT code FROM referral_codes WHERE email = ${e}`;
      if (row.length) return row[0].code;
    }
  }
  return null;
}

/** email рефера за кодом, або null. */
export async function resolveReferrerByCode(code: string): Promise<string | null> {
  if (!sql || !code) return null;
  await ensureReferralSchema();
  const rows = await sql<{ email: string }[]>`
    SELECT email FROM referral_codes WHERE code = ${code.trim().toLowerCase()} LIMIT 1
  `;
  return rows.length ? rows[0].email : null;
}

/**
 * Фіксує конверсію: друг (referredEmail) оформив поліс policyId ціною price за
 * посиланням рефера (referrerEmail). Нараховує бонус 5%. Ідемпотентно за policyId.
 * Самореферал (referrer == referred) ігнорується.
 */
export async function recordReferralConversion(input: {
  referrerEmail: string;
  referredEmail: string;
  policyId: string;
  price: number | null;
}): Promise<void> {
  if (!sql) return;
  const referrer = norm(input.referrerEmail);
  const referred = norm(input.referredEmail);
  if (!referrer || referrer === referred) return; // не можна запросити сам себе
  await ensureReferralSchema();
  const price = typeof input.price === "number" && input.price > 0 ? input.price : 0;
  const bonus = Math.round(price * BONUS_RATE);
  await sql`
    INSERT INTO referrals (id, referrer_email, referred_email, policy_price, bonus_amount)
    VALUES (${input.policyId}, ${referrer}, ${referred}, ${price || null}, ${bonus})
    ON CONFLICT (id) DO NOTHING
  `;
}

export interface ReferralItem {
  bonusAmount: number;
  policyPrice: number | null;
  createdAt: string;
}

export interface ReferralSummary {
  code: string;
  link: string;
  invitedCount: number;
  bonusTotal: number;
  items: ReferralItem[];
}

/** Зведення для кабінету: код, посилання, к-сть запрошених, сумарний бонус, історія. */
export async function getReferralSummary(email: string): Promise<ReferralSummary | null> {
  if (!sql) return null;
  const code = await getOrCreateReferralCode(email);
  if (!code) return null;
  const e = norm(email);

  const [agg] = await sql<{ invited: string; total: string | null }[]>`
    SELECT COUNT(*)::int AS invited, COALESCE(SUM(bonus_amount), 0) AS total
    FROM referrals WHERE lower(referrer_email) = ${e}
  `;
  const items = await sql<{ bonus_amount: string; policy_price: string | null; created_at: Date }[]>`
    SELECT bonus_amount, policy_price, created_at
    FROM referrals WHERE lower(referrer_email) = ${e}
    ORDER BY created_at DESC LIMIT 20
  `;

  return {
    code,
    link: `${SITE_URL}/?ref=${code}`,
    invitedCount: Number(agg?.invited ?? 0),
    bonusTotal: Number(agg?.total ?? 0),
    items: items.map((r) => ({
      bonusAmount: Number(r.bonus_amount),
      policyPrice: r.policy_price !== null ? Number(r.policy_price) : null,
      createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
    })),
  };
}
