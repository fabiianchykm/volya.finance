import { sql } from "./db";

// Єдиний бонусний рахунок користувача. Сюди зводяться ВСІ нарахування:
// - 'purchase' — 1% від власної покупки полісу;
// - 'referral' — 5% від покупки запрошеного друга.
// Баланс = сума всіх записів. Дедуплікація за id = `${kind}:${policyId}` —
// один поліс дає максимум один запис кожного типу.

export type BonusKind = "purchase" | "referral";

let schemaPromise: Promise<void> | null = null;
function ensureBonusSchema(): Promise<void> {
  if (!sql) return Promise.resolve();
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS bonus_entries (
          id          text PRIMARY KEY,          -- kind:policyId (дедуп)
          email       text NOT NULL,
          kind        text NOT NULL,             -- purchase | referral
          amount      numeric NOT NULL DEFAULT 0,
          policy_id   text,
          created_at  timestamptz NOT NULL DEFAULT now()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS bonus_entries_email_idx ON bonus_entries (lower(email))`;
    })().catch((e) => {
      schemaPromise = null;
      throw e;
    });
  }
  return schemaPromise;
}

const norm = (email: string) => email.trim().toLowerCase();

/** Нараховує бонус на рахунок (ідемпотентно за kind+policyId). */
export async function creditBonus(input: {
  email: string;
  kind: BonusKind;
  policyId: string;
  amount: number;
}): Promise<void> {
  if (!sql) return;
  const email = norm(input.email);
  const amount = Math.max(0, Math.round(input.amount));
  if (!email || !input.policyId || amount <= 0) return;
  await ensureBonusSchema();
  await sql`
    INSERT INTO bonus_entries (id, email, kind, amount, policy_id)
    VALUES (${`${input.kind}:${input.policyId}`}, ${email}, ${input.kind}, ${amount}, ${input.policyId})
    ON CONFLICT (id) DO NOTHING
  `;
}

export interface BonusBreakdown {
  total: number;
  purchase: number;
  referral: number;
}

/** Баланс бонусного рахунку з розбивкою за типом. */
export async function getBonusBreakdown(email: string): Promise<BonusBreakdown> {
  const empty = { total: 0, purchase: 0, referral: 0 };
  if (!sql) return empty;
  await ensureBonusSchema();
  const rows = await sql<{ kind: string; sum: string }[]>`
    SELECT kind, COALESCE(SUM(amount), 0) AS sum
    FROM bonus_entries WHERE lower(email) = ${norm(email)}
    GROUP BY kind
  `;
  const out = { ...empty };
  for (const r of rows) {
    const v = Number(r.sum) || 0;
    if (r.kind === "purchase") out.purchase = v;
    else if (r.kind === "referral") out.referral = v;
  }
  out.total = out.purchase + out.referral;
  return out;
}

/** Баланс за НАБОРОМ email-ів (рівноправна звʼязка акаунтів). */
export async function getBonusBreakdownMulti(emails: string[]): Promise<BonusBreakdown> {
  const empty = { total: 0, purchase: 0, referral: 0 };
  const list = [...new Set(emails.map((e) => norm(e)).filter(Boolean))];
  if (!sql || !list.length) return empty;
  await ensureBonusSchema();
  const rows = await sql<{ kind: string; sum: string }[]>`
    SELECT kind, COALESCE(SUM(amount), 0) AS sum
    FROM bonus_entries WHERE lower(email) = ANY(${list})
    GROUP BY kind
  `;
  const out = { ...empty };
  for (const r of rows) {
    const v = Number(r.sum) || 0;
    if (r.kind === "purchase") out.purchase = v;
    else if (r.kind === "referral") out.referral = v;
  }
  out.total = out.purchase + out.referral;
  return out;
}
