import { sql, ensureSchema } from "./db";
import { normPhone } from "./policies";

export interface IdentitySet {
  emails: string[];
  phones: string[];
}

// Рівноправна звʼязка акаунтів: за одним входом (email АБО телефон) збираємо ВСІ
// повʼязані ідентичності людини через поліси (у полісі є і email, і телефон).
// Жоден ключ не «головний» — обидва вказують на ту саму людину.
export async function resolveIdentities(seed: { email?: string | null; phone?: string | null }): Promise<IdentitySet> {
  const emails = new Set<string>();
  const phones = new Set<string>();
  if (seed.email) emails.add(seed.email.trim().toLowerCase());
  const p0 = normPhone(seed.phone ?? null);
  if (p0) phones.add(p0);

  if (!sql || (emails.size === 0 && phones.size === 0)) {
    return { emails: [...emails], phones: [...phones] };
  }
  await ensureSchema();

  // Транзитивне замикання по полісах (кілька раундів, поки набір росте).
  for (let round = 0; round < 3; round++) {
    const eArr = [...emails];
    const pArr = [...phones];
    const rows = await sql<{ email: string | null; phone: string | null }[]>`
      SELECT DISTINCT lower(email) AS email, phone FROM policies
      WHERE lower(email) = ANY(${eArr}) OR phone = ANY(${pArr})
    `;
    const before = emails.size + phones.size;
    for (const r of rows) {
      if (r.email) emails.add(String(r.email).trim().toLowerCase());
      const ph = normPhone(r.phone);
      if (ph) phones.add(ph);
    }
    if (emails.size + phones.size === before) break; // стабілізувалось
  }
  return { emails: [...emails], phones: [...phones] };
}

// Email для профілю (профіль keyed по email): те, чим увійшли, якщо є; інакше
// перший повʼязаний email (щоб вхід за номером бачив свій профіль).
export function primaryEmail(idset: IdentitySet, prefer?: string | null): string | null {
  const p = prefer?.trim().toLowerCase();
  if (p && idset.emails.includes(p)) return p;
  return idset.emails[0] ?? p ?? null;
}
