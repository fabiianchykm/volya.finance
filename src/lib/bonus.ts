import { sql } from "./db";

// Єдиний бонусний рахунок користувача. Сюди зводяться ВСІ нарахування:
// - 'purchase' — 1% від власної покупки полісу;
// - 'referral' — 5% від покупки запрошеного друга;
// - 'redeem'   — списання бонусів у рахунок знижки на поліс (відʼємна сума, див.
//                bonus-redemption.ts).
// Баланс = сума всіх записів. Дедуплікація за id = `${kind}:${policyId}` —
// один поліс дає максимум один запис кожного типу.

export type BonusKind = "purchase" | "referral" | "redeem";

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
  total: number;      // доступний залишок = нараховано − списано
  purchase: number;
  referral: number;
  redeemed: number;   // скільки вже списано на знижки (додатне число)
}

/** Баланс бонусного рахунку з розбивкою за типом. */
export async function getBonusBreakdown(email: string): Promise<BonusBreakdown> {
  const empty = { total: 0, purchase: 0, referral: 0, redeemed: 0 };
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
    else if (r.kind === "redeem") out.redeemed = Math.abs(v);
  }
  out.total = Math.max(0, out.purchase + out.referral - out.redeemed);
  return out;
}

/** Баланс за НАБОРОМ email-ів (рівноправна звʼязка акаунтів). */
export async function getBonusBreakdownMulti(emails: string[]): Promise<BonusBreakdown> {
  const empty = { total: 0, purchase: 0, referral: 0, redeemed: 0 };
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
    else if (r.kind === "redeem") out.redeemed = Math.abs(v);
  }
  out.total = Math.max(0, out.purchase + out.referral - out.redeemed);
  return out;
}

// ── Історія бонусного рахунку (кабінет) ─────────────────────────────────────

export interface BonusHistoryItem {
  id: string;
  kind: BonusKind | "held";
  /** Знак уже врахований: нарахування > 0, списання/резерв < 0. */
  amount: number;
  createdAt: string;
  /** Контекст поліса, якщо знайшли його в policies (для purchase/redeem/held). */
  policy: { company: string | null; product: string | null; plate: string | null; customerName: string | null } | null;
  /** Для referral — замаскований email запрошеного друга. */
  friend: string | null;
}

const maskEmail = (e: string | null | undefined): string | null => {
  if (!e) return null;
  const [user, domain] = e.split("@");
  if (!domain) return e;
  const head = user.slice(0, 2);
  return `${head}${"*".repeat(Math.max(1, Math.min(6, user.length - 2)))}@${domain}`;
};

/** Рух по бонусному рахунку за набором email-ів, найновіше першим. Крім проведених
 *  записів додає активні резерви (bonus_redemptions.status='held') — бонуси, які вже
 *  «зайняті» заявкою, що чекає на оплату. */
export async function getBonusHistory(emails: string[], limit = 50): Promise<BonusHistoryItem[]> {
  const list = [...new Set(emails.map((e) => norm(e)).filter(Boolean))];
  if (!sql || !list.length) return [];
  await ensureBonusSchema();
  type Row = {
    id: string; kind: string; amount: string; policy_id: string | null; created_at: Date;
    company: string | null; product: string | null; vehicle: { plate?: string } | null; customer_name: string | null;
    referred_email: string | null;
  };
  // policies шукаємо і за id (contractId / orderId при збереженні), і за order_id
  // (redeem зберігає orderId заявки). referrals — за id поліса запрошеного.
  const rows = await sql<Row[]>`
    SELECT b.id, b.kind, b.amount, b.policy_id, b.created_at,
           p.company, p.product, p.vehicle, p.customer_name,
           r.referred_email
    FROM bonus_entries b
    LEFT JOIN LATERAL (
      SELECT company, product, vehicle, customer_name FROM policies
      WHERE id = b.policy_id OR order_id = b.policy_id OR contract_id = b.policy_id
      ORDER BY created_at DESC LIMIT 1
    ) p ON true
    LEFT JOIN referrals r ON b.kind = 'referral' AND r.id = b.policy_id
    WHERE lower(b.email) = ANY(${list})
    ORDER BY b.created_at DESC
    LIMIT ${limit}
  `;
  const items: BonusHistoryItem[] = rows.map((r) => ({
    id: r.id,
    kind: (r.kind as BonusKind) ?? "purchase",
    amount: Number(r.amount) || 0,
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
    policy: r.company || r.product || r.customer_name
      ? { company: r.company, product: r.product, plate: r.vehicle?.plate ?? null, customerName: r.customer_name }
      : null,
    friend: r.kind === "referral" ? maskEmail(r.referred_email) : null,
  }));
  // Активні резерви (ще не проведені списання).
  try {
    type Hold = { order_id: string; amount: string; created_at: Date; company: string | null; product: string | null };
    const holds = await sql<Hold[]>`
      SELECT h.order_id, h.amount, h.created_at, po.meta->>'company' AS company, po.product
      FROM bonus_redemptions h
      LEFT JOIN pending_orders po ON po.order_id = h.order_id
      WHERE lower(h.email) = ANY(${list}) AND h.status = 'held'
      ORDER BY h.created_at DESC LIMIT 10
    `;
    for (const h of holds) {
      items.push({
        id: `held:${h.order_id}`,
        kind: "held",
        amount: -Math.abs(Number(h.amount) || 0),
        createdAt: h.created_at instanceof Date ? h.created_at.toISOString() : String(h.created_at),
        policy: h.company || h.product ? { company: h.company, product: h.product, plate: null, customerName: null } : null,
        friend: null,
      });
    }
  } catch {
    // таблиці резервів може ще не бути — історія без них
  }
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
}
