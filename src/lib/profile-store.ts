import { sql, ensureSchema } from "@/lib/db";
import { encryptJson, decryptJson } from "@/lib/crypto";
import type { CustomerProfile } from "@/lib/customer-profile";

// Профіль страхувальника в БД, привʼязаний до АКАУНТА (email сесії, не з клієнта).
// Один запис на акаунт; читається/пишеться лише для власного акаунта. Тіло профілю
// (ІПН, паспорт, адреса…) зберігається ЗАШИФРОВАНИМ (AES-256-GCM, див. lib/crypto).

function keyOf(accountEmail: string): string {
  return accountEmail.trim().toLowerCase();
}

/** Найсвіжіший профіль акаунта (для ProfileSync / легасі single-GET). Читає нову
 *  мульти-таблицю, а якщо там порожньо — легасі один-на-акаунт. */
export async function getServerProfile(accountEmail: string): Promise<CustomerProfile | null> {
  if (!sql || !accountEmail) return null;
  await ensureSchema();
  const acc = keyOf(accountEmail);
  const people = await sql`SELECT data FROM account_people WHERE account = ${acc} ORDER BY updated_at DESC LIMIT 1`;
  if (people[0]) return decryptJson<CustomerProfile>(people[0].data);
  // Легасі: до Phase 2 профіль лежав лише тут (один на акаунт).
  const rows = await sql`SELECT data FROM customer_profiles WHERE email = ${acc} LIMIT 1`;
  if (!rows[0]) return null;
  // decryptJson розшифровує конверт; легасі-відкриті записи повертає як є.
  return decryptJson<CustomerProfile>(rows[0].data);
}

/** УСІ профілі акаунта (кілька осіб: сам, дружина…), найсвіжіші першими — для пікера
 *  «Заповнити збереженими». Об'єднує нову мульти-таблицю з легасі-записом. */
export async function listServerProfiles(accountEmail: string): Promise<CustomerProfile[]> {
  if (!sql || !accountEmail) return [];
  await ensureSchema();
  const acc = keyOf(accountEmail);
  const rows = await sql`SELECT data FROM account_people WHERE account = ${acc} ORDER BY updated_at DESC`;
  const people = rows
    .map((r) => decryptJson<CustomerProfile>(r.data))
    .filter((p): p is CustomerProfile => !!p);
  // Легасі один-на-акаунт — додаємо як ще одну особу, якщо її email ще не в списку.
  const legacy = await sql`SELECT data FROM customer_profiles WHERE email = ${acc} LIMIT 1`;
  if (legacy[0]) {
    const p = decryptJson<CustomerProfile>(legacy[0].data);
    if (p && !people.some((x) => keyOf(x.email || "") === keyOf(p.email || ""))) people.push(p);
  }
  return people;
}

/** Зберегти/оновити профіль ОДНІЄЇ особи на акаунті. person_key — нормалізований
 *  email особи (унікальний у межах акаунта); якщо email нема — фолбек на сам акаунт. */
export async function upsertServerProfile(accountEmail: string, data: unknown): Promise<void> {
  if (!sql || !accountEmail) return;
  await ensureSchema();
  const acc = keyOf(accountEmail);
  const personEmail = keyOf((data as Partial<CustomerProfile> | null)?.email || "");
  const personKey = personEmail || acc;
  // Шифруємо ПЕРЕД записом; round-trip через JSON → чистий JSON-value (як у policies.ts).
  const encrypted = encryptJson(data);
  const json = sql.json(JSON.parse(JSON.stringify(encrypted)));
  await sql`
    INSERT INTO account_people (account, person_key, data, updated_at)
    VALUES (${acc}, ${personKey}, ${json}, now())
    ON CONFLICT (account, person_key) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
  `;
}

/** Видалити профіль особи з акаунта (за її email). */
export async function deleteServerProfile(accountEmail: string, personEmail: string): Promise<void> {
  if (!sql || !accountEmail || !personEmail) return;
  await ensureSchema();
  await sql`DELETE FROM account_people WHERE account = ${keyOf(accountEmail)} AND person_key = ${keyOf(personEmail)}`;
}
