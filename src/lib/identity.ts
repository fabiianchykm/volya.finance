import { sql, ensureSchema } from "./db";
import { normPhone } from "./policies";

export interface IdentitySet {
  emails: string[];
  phones: string[];
}

export type IdentitySeed = { email?: string | null; phone?: string | null };

// Рівноправна звʼязка акаунтів: за одним входом (email АБО телефон) збираємо ВСІ
// повʼязані ідентичності людини. Два джерела звʼязків:
//   • поліси (у полісі є і email, і телефон);
//   • identity_links — явні привʼязки з кабінету («Способи входу»: Google-акаунт
//     додав номер, або вхід за номером привʼязав Google). Явний звʼязок потрібен
//     тому, хто ще нічого не купував (наприклад, лише ділиться реферальним
//     посиланням), інакше вхід за номером бачив «0 бонусів» (15.11.2026).
// Жоден ключ не «головний» — обидва вказують на ту саму людину.

let linksSchema: Promise<void> | null = null;
function ensureLinksSchema(): Promise<void> {
  if (!sql) return Promise.resolve();
  if (!linksSchema) {
    linksSchema = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS identity_links (
          email      text NOT NULL,
          phone      text NOT NULL,
          source     text,
          created_at timestamptz NOT NULL DEFAULT now(),
          PRIMARY KEY (email, phone)
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS identity_links_phone_idx ON identity_links (phone)`;
      // Намір привʼязати Google до входу за номером: токен живе в httpOnly-cookie,
      // поки користувач проходить Google-вхід; після повернення — завершуємо звʼязок.
      await sql`
        CREATE TABLE IF NOT EXISTS identity_link_intents (
          token      text PRIMARY KEY,
          phone      text NOT NULL,
          expires_at timestamptz NOT NULL
        )
      `;
    })().catch((e) => {
      linksSchema = null;
      throw e;
    });
  }
  return linksSchema;
}

const normEmail = (e: string) => e.trim().toLowerCase();

// Поріг «сімейного» акаунта: email, під яким оформлено поліси щонайбільше на стільки
// різних номерів. Брокер (десятки номерів під одним email) цей поріг перевищує —
// і тоді вхід КЛІЄНТА за своїм номером НЕ підтягує брокерський бонусний рахунок.
const FAMILY_MAX_PHONES = 5;

async function closure(seed: IdentitySeed, opts: { bonus: boolean }): Promise<IdentitySet> {
  const emails = new Set<string>();
  const phones = new Set<string>();
  if (seed.email) emails.add(normEmail(seed.email));
  const p0 = normPhone(seed.phone ?? null);
  if (p0) phones.add(p0);

  if (!sql || (emails.size === 0 && phones.size === 0)) {
    return { emails: [...emails], phones: [...phones] };
  }
  await ensureSchema();
  await ensureLinksSchema().catch(() => undefined);

  // Транзитивне замикання по полісах і явних звʼязках (кілька раундів, поки набір росте).
  for (let round = 0; round < 3; round++) {
    const eArr = [...emails];
    const pArr = [...phones];
    const before = emails.size + phones.size;

    // Поліси. У «бонусному» режимі ребро телефон→email беремо лише для сімейних
    // email-ів (див. FAMILY_MAX_PHONES); ребро email→телефон — завжди.
    const rows = opts.bonus
      ? await sql<{ email: string | null; phone: string | null }[]>`
          SELECT DISTINCT lower(p.email) AS email, p.phone
          FROM policies p
          WHERE lower(p.email) = ANY(${eArr})
             OR (p.phone = ANY(${pArr}) AND (
                  SELECT COUNT(DISTINCT q.phone) FROM policies q WHERE lower(q.email) = lower(p.email) AND q.phone IS NOT NULL
                ) <= ${FAMILY_MAX_PHONES})
        `
      : await sql<{ email: string | null; phone: string | null }[]>`
          SELECT DISTINCT lower(email) AS email, phone FROM policies
          WHERE lower(email) = ANY(${eArr}) OR phone = ANY(${pArr})
        `;
    for (const r of rows) {
      if (r.email) emails.add(normEmail(String(r.email)));
      const ph = normPhone(r.phone);
      if (ph) phones.add(ph);
    }

    // Явні звʼязки з кабінету.
    const links = await sql<{ email: string; phone: string }[]>`
      SELECT email, phone FROM identity_links WHERE email = ANY(${eArr}) OR phone = ANY(${pArr})
    `.catch(() => [] as { email: string; phone: string }[]);
    for (const l of links) {
      emails.add(normEmail(l.email));
      const ph = normPhone(l.phone);
      if (ph) phones.add(ph);
    }

    if (emails.size + phones.size === before) break; // стабілізувалось
  }
  return { emails: [...emails], phones: [...phones] };
}

/** Усі ідентичності людини (поліси + явні звʼязки) — для кабінету «Мої поліси». */
export function resolveIdentities(seed: IdentitySeed): Promise<IdentitySet> {
  return closure(seed, { bonus: false });
}

/**
 * Ідентичності для БОНУСНОГО рахунку (баланс, списання, реферальний код). Суворіше
 * за resolveIdentities: клієнт, якому поліс оформив брокер зі свого email, за своїм
 * номером брокерський рахунок не бачить і не списує.
 */
export function resolveBonusIdentities(seed: IdentitySeed): Promise<IdentitySet> {
  return closure(seed, { bonus: true });
}

/**
 * Ключі бонусного/реферального рахунку: email-и як є + телефони як "phone:+380…".
 * Таблиці bonus_entries / referral_codes / bonus_redemptions мають колонку email,
 * але це просто текстовий ключ — вхід за номером без email отримує власний.
 */
export function identityKeys(ids: IdentitySet): string[] {
  return [...new Set([...ids.emails.map(normEmail), ...ids.phones.map((p) => `phone:${p}`)])];
}

/** Головний ключ рахунку: email входу → перший email → ключ телефону. */
export function primaryKey(ids: IdentitySet, seed: IdentitySeed): string | null {
  return primaryEmail(ids, seed.email) ?? (ids.phones[0] ? `phone:${ids.phones[0]}` : null);
}

// Email для профілю (профіль keyed по email): те, чим увійшли, якщо є; інакше
// перший повʼязаний email (щоб вхід за номером бачив свій профіль).
export function primaryEmail(idset: IdentitySet, prefer?: string | null): string | null {
  const p = prefer?.trim().toLowerCase();
  if (p && idset.emails.includes(p)) return p;
  return idset.emails[0] ?? p ?? null;
}

// ── Явні звʼязки (кабінет → «Способи входу») ────────────────────────────────

export async function addIdentityLink(email: string, phone: string, source: string): Promise<void> {
  if (!sql) return;
  const e = normEmail(email);
  const p = normPhone(phone);
  if (!e || !p) return;
  await ensureLinksSchema();
  await sql`
    INSERT INTO identity_links (email, phone, source) VALUES (${e}, ${p}, ${source})
    ON CONFLICT (email, phone) DO NOTHING
  `;
}

export async function listIdentityLinks(ids: IdentitySet): Promise<{ email: string; phone: string }[]> {
  if (!sql || (!ids.emails.length && !ids.phones.length)) return [];
  await ensureLinksSchema();
  return sql<{ email: string; phone: string }[]>`
    SELECT email, phone FROM identity_links WHERE email = ANY(${ids.emails}) OR phone = ANY(${ids.phones})
  `;
}

export async function removeIdentityLink(email: string, phone: string): Promise<void> {
  if (!sql) return;
  await ensureLinksSchema();
  await sql`DELETE FROM identity_links WHERE email = ${normEmail(email)} AND phone = ${normPhone(phone) ?? phone}`;
}

export async function createLinkIntent(phone: string, token: string, ttlMinutes = 15): Promise<void> {
  if (!sql) return;
  await ensureLinksSchema();
  await sql`DELETE FROM identity_link_intents WHERE expires_at < now()`;
  await sql`
    INSERT INTO identity_link_intents (token, phone, expires_at)
    VALUES (${token}, ${phone}, now() + (${ttlMinutes} * interval '1 minute'))
  `;
}

/** Повертає телефон наміру й «спалює» токен. */
export async function consumeLinkIntent(token: string): Promise<string | null> {
  if (!sql || !token) return null;
  await ensureLinksSchema();
  const rows = await sql<{ phone: string }[]>`
    DELETE FROM identity_link_intents WHERE token = ${token} AND expires_at >= now() RETURNING phone
  `;
  return rows[0]?.phone ?? null;
}
