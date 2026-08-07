import { sql, ensureSchema } from "@/lib/db";
import { encryptJson, decryptJson } from "@/lib/crypto";
import type { CustomerProfile } from "@/lib/customer-profile";

// Профіль страхувальника в БД, привʼязаний до АКАУНТА (email сесії, не з клієнта).
// Один запис на акаунт; читається/пишеться лише для власного акаунта. Тіло профілю
// (ІПН, паспорт, адреса…) зберігається ЗАШИФРОВАНИМ (AES-256-GCM, див. lib/crypto).

function keyOf(accountEmail: string): string {
  return accountEmail.trim().toLowerCase();
}

export async function getServerProfile(accountEmail: string): Promise<CustomerProfile | null> {
  if (!sql || !accountEmail) return null;
  await ensureSchema();
  const rows = await sql`SELECT data FROM customer_profiles WHERE email = ${keyOf(accountEmail)} LIMIT 1`;
  if (!rows[0]) return null;
  // decryptJson розшифровує конверт; легасі-відкриті записи повертає як є.
  return decryptJson<CustomerProfile>(rows[0].data);
}

export async function upsertServerProfile(accountEmail: string, data: unknown): Promise<void> {
  if (!sql || !accountEmail) return;
  await ensureSchema();
  // Шифруємо ПЕРЕД записом; round-trip через JSON → чистий JSON-value (як у policies.ts).
  const encrypted = encryptJson(data);
  const json = sql.json(JSON.parse(JSON.stringify(encrypted)));
  await sql`
    INSERT INTO customer_profiles (email, data, updated_at)
    VALUES (${keyOf(accountEmail)}, ${json}, now())
    ON CONFLICT (email) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
  `;
}
