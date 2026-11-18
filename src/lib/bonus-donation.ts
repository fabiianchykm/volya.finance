import { randomUUID } from "node:crypto";
import { sql } from "./db";
import { getBonusAvailability } from "./bonus-redemption";
import { resolveBonusIdentities, primaryKey, type IdentitySeed } from "./identity";

// Пожертва бонусів на благодійність. Клієнт обирає фонд і суму в кабінеті →
// з рахунку списується відʼємний запис kind='donation' (bonus_entries) і
// створюється заявка в bonus_donations (status pending). Менеджер переказує
// гроші фонду і ставить paid в адмінці / за повідомленням у Telegram.
// Один бонус = одна гривня, як і при списанні на знижку.

export const DONATION_MIN = 10;

export const DONATION_FUNDS: { id: string; name: string; url: string }[] = [
  { id: "comebackalive", name: "Повернись живим", url: "https://savelife.in.ua" },
  { id: "prytula", name: "Фонд Сергія Притули", url: "https://prytulafoundation.org" },
  { id: "united24", name: "UNITED24", url: "https://u24.gov.ua" },
  { id: "tabletochki", name: "Таблеточки", url: "https://tabletochki.org" },
];

export interface BonusDonation {
  id: string;
  email: string;
  amount: number;
  fund: string;
  status: "pending" | "paid";
  createdAt: string;
}

let schemaPromise: Promise<void> | null = null;
function ensureSchema(): Promise<void> {
  if (!sql) return Promise.resolve();
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS bonus_donations (
          id          text PRIMARY KEY,
          entry_id    text NOT NULL,              -- bonus_entries.id (donation:<uuid>)
          email       text NOT NULL,              -- головний ключ рахунку
          amount      numeric NOT NULL,
          fund_id     text NOT NULL,
          fund        text NOT NULL,
          status      text NOT NULL DEFAULT 'pending',  -- pending | paid
          created_at  timestamptz NOT NULL DEFAULT now(),
          paid_at     timestamptz
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS bonus_donations_email_idx ON bonus_donations (lower(email))`;
    })().catch((e) => { schemaPromise = null; throw e; });
  }
  return schemaPromise;
}

export function getDonationFund(id: string) {
  return DONATION_FUNDS.find((f) => f.id === id);
}

/** Списує бонуси й створює заявку на пожертву. Кидає Error з текстом для клієнта. */
export async function donateBonus(seed: IdentitySeed, amountRaw: number, fundId: string): Promise<BonusDonation> {
  if (!sql) throw new Error("База даних недоступна");
  const fund = getDonationFund(fundId);
  if (!fund) throw new Error("Оберіть фонд зі списку");
  const amount = Math.floor(Number(amountRaw) || 0);
  if (amount < DONATION_MIN) throw new Error(`Мінімальна пожертва — ${DONATION_MIN} ₴`);

  await ensureSchema();
  const avail = await getBonusAvailability(seed);
  if (amount > avail.available) throw new Error(`Доступно лише ${avail.available} ₴ бонусів`);

  const ids = await resolveBonusIdentities(seed);
  const email = primaryKey(ids, seed);
  if (!email) throw new Error("Не вдалося визначити рахунок");

  const id = randomUUID();
  const entryId = `donation:${id}`;
  // Списання + заявка однією транзакцією.
  await sql.begin(async (tx) => {
    await tx`
      INSERT INTO bonus_entries (id, email, kind, amount, policy_id)
      VALUES (${entryId}, ${email}, ${"donation"}, ${-amount}, ${null})
    `;
    await tx`
      INSERT INTO bonus_donations (id, entry_id, email, amount, fund_id, fund)
      VALUES (${id}, ${entryId}, ${email}, ${amount}, ${fund.id}, ${fund.name})
    `;
  });
  return { id, email, amount, fund: fund.name, status: "pending", createdAt: new Date().toISOString() };
}

export async function listDonations(limit = 200): Promise<(BonusDonation & { fundId: string; paidAt: string | null })[]> {
  if (!sql) return [];
  await ensureSchema();
  const rows = await sql`
    SELECT id, email, amount, fund_id, fund, status, created_at, paid_at
    FROM bonus_donations ORDER BY created_at DESC LIMIT ${limit}
  `;
  return rows.map((r) => ({
    id: r.id as string, email: r.email as string, amount: Number(r.amount) || 0, fundId: r.fund_id as string, fund: r.fund as string,
    status: (r.status as "pending" | "paid") ?? "pending",
    createdAt: (r.created_at as Date).toISOString?.() ?? String(r.created_at),
    paidAt: r.paid_at ? ((r.paid_at as Date).toISOString?.() ?? String(r.paid_at)) : null,
  }));
}

export async function markDonationPaid(id: string, paid: boolean): Promise<boolean> {
  if (!sql) return false;
  await ensureSchema();
  const res = paid
    ? await sql`UPDATE bonus_donations SET status = 'paid', paid_at = now() WHERE id = ${id}`
    : await sql`UPDATE bonus_donations SET status = 'pending', paid_at = NULL WHERE id = ${id}`;
  return (res.count ?? 0) > 0;
}
