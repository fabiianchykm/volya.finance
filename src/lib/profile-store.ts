import { sql, ensureSchema } from "@/lib/db";
import type { CustomerProfile } from "@/lib/customer-profile";

// Профіль страхувальника в БД, привʼязаний до АКАУНТА (email сесії, не з клієнта).
// Один запис на акаунт; читається/пишеться лише для власного акаунта.

function keyOf(accountEmail: string): string {
  return accountEmail.trim().toLowerCase();
}

export async function getServerProfile(accountEmail: string): Promise<CustomerProfile | null> {
  if (!sql || !accountEmail) return null;
  await ensureSchema();
  const rows = await sql`SELECT data FROM customer_profiles WHERE email = ${keyOf(accountEmail)} LIMIT 1`;
  const data = rows[0]?.data as CustomerProfile | undefined;
  return data ?? null;
}

export async function upsertServerProfile(accountEmail: string, data: unknown): Promise<void> {
  if (!sql || !accountEmail) return;
  await ensureSchema();
  // round-trip через JSON → чистий JSON-value (як у policies.ts), щоб задовольнити типи
  const json = sql.json(JSON.parse(JSON.stringify(data ?? {})));
  await sql`
    INSERT INTO customer_profiles (email, data, updated_at)
    VALUES (${keyOf(accountEmail)}, ${json}, now())
    ON CONFLICT (email) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
  `;
}
