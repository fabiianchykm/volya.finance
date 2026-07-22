import { randomInt } from "crypto";
import { sql } from "./db";

// Коди входу за номером телефону (доставка через Telegram Gateway, згодом SMS).
// Зберігаємо в Postgres (один активний код на номер), живуть 5 хв, одноразові.

const TTL_SEC = 300;

/** Нормалізує український номер до E.164 "+380XXXXXXXXX" або null. */
export function normalizePhone(input: string): string | null {
  let d = input.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("380")) d = d.slice(3);
  else if (d.length === 11 && d.startsWith("80")) d = d.slice(2);
  else if (d.length === 10 && d.startsWith("0")) d = d.slice(1);
  if (d.length !== 9) return null;
  return `+380${d}`;
}

let schemaPromise: Promise<void> | null = null;
function ensureSchema(): Promise<void> {
  if (!sql) return Promise.resolve();
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS phone_login_codes (
          phone      text PRIMARY KEY,
          code       text NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now()
        )
      `;
    })().catch((e) => {
      schemaPromise = null;
      throw e;
    });
  }
  return schemaPromise;
}

/** Створює/оновлює 6-значний код для номера, повертає його. */
export async function createPhoneCode(phone: string): Promise<string | null> {
  if (!sql) return null;
  await ensureSchema();
  const code = String(randomInt(100000, 1000000));
  await sql`
    INSERT INTO phone_login_codes (phone, code, created_at)
    VALUES (${phone}, ${code}, now())
    ON CONFLICT (phone) DO UPDATE SET code = ${code}, created_at = now()
  `;
  return code;
}

/** Перевіряє код і «спалює» його. */
export async function verifyPhoneCode(phone: string, code: string): Promise<boolean> {
  if (!sql) return false;
  await ensureSchema();
  const rows = await sql<{ code: string; created_at: string }[]>`
    SELECT code, created_at FROM phone_login_codes WHERE phone = ${phone}
  `;
  const row = rows[0];
  if (!row) return false;
  const fresh = (Date.now() - new Date(row.created_at).getTime()) / 1000 <= TTL_SEC;
  const ok = fresh && row.code === code;
  if (ok) await sql`DELETE FROM phone_login_codes WHERE phone = ${phone}`;
  return ok;
}
