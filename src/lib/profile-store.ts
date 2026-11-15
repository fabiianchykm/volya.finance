import { sql, ensureSchema } from "@/lib/db";
import { encryptJson, decryptJson } from "@/lib/crypto";
import type { CustomerProfile } from "@/lib/customer-profile";
import { profileKey, profileKeyCandidates } from "@/lib/profile-key";

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
  // Легасі один-на-акаунт — додаємо як ще одну особу, якщо її ще немає в списку.
  const legacy = await sql`SELECT data FROM customer_profiles WHERE email = ${acc} LIMIT 1`;
  if (legacy[0]) {
    const p = decryptJson<CustomerProfile>(legacy[0].data);
    if (p) people.push(p);
  }
  // Одна особа могла лежати і під старим ключем (email), і під новим (ІПН/ПІБ) —
  // показуємо найсвіжіший запис кожної (rows уже відсортовані за updated_at DESC).
  const seen = new Set<string>();
  return people.filter((p) => {
    const k = profileKey(p) || keyOf(p.email || "") || acc;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** Зберегти/оновити профіль ОДНІЄЇ особи на акаунті. person_key — ключ особи
 *  (ІПН → ПІБ+ДН → email, profileKey); якщо нічого нема — фолбек на сам акаунт.
 *  Старий запис цієї ж особи під легасі-ключем (email) прибираємо, щоб не було дубля. */
export async function upsertServerProfile(accountEmail: string, data: unknown): Promise<void> {
  if (!sql || !accountEmail) return;
  await ensureSchema();
  const acc = keyOf(accountEmail);
  const profile = data as Partial<CustomerProfile> | null;
  const personKey = profileKey(profile) || acc;
  const stale = profileKeyCandidates(profile).filter((k) => k !== personKey);
  // Шифруємо ПЕРЕД записом; round-trip через JSON → чистий JSON-value (як у policies.ts).
  const encrypted = encryptJson(data);
  const json = sql.json(JSON.parse(JSON.stringify(encrypted)));
  await sql`
    INSERT INTO account_people (account, person_key, data, updated_at)
    VALUES (${acc}, ${personKey}, ${json}, now())
    ON CONFLICT (account, person_key) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
  `;
  if (stale.length) {
    // Прибираємо легасі-запис за email лише якщо це ТА САМА особа (ІПН/ПІБ збігаються),
    // бо під тим email могла бути збережена інша людина.
    const rows = await sql`SELECT person_key, data FROM account_people WHERE account = ${acc} AND person_key = ANY(${stale})`;
    for (const r of rows) {
      const old = decryptJson<CustomerProfile>(r.data);
      if (old && profileKey(old) === personKey) {
        await sql`DELETE FROM account_people WHERE account = ${acc} AND person_key = ${r.person_key as string}`;
      }
    }
  }
}

/** Видалити профіль особи з акаунта за її ключами (новий ключ + легасі email). */
export async function deleteServerProfile(accountEmail: string, keys: string[]): Promise<void> {
  const ks = keys.map((k) => k.trim().toLowerCase()).filter(Boolean);
  if (!sql || !accountEmail || !ks.length) return;
  await ensureSchema();
  await sql`DELETE FROM account_people WHERE account = ${keyOf(accountEmail)} AND person_key = ANY(${ks})`;
}
