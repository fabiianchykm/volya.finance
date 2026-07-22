import { randomInt } from "crypto";
import { sql } from "./db";

// Одноразові коди входу через Telegram. Бот надсилає код у чат користувача, той
// вводить його на сайті → створюється сесія. Коди зберігаємо в Postgres (надійно
// між інстансами), живуть 5 хв, одноразові.

const TTL_SEC = 300;

export interface TgLoginUser {
  tg_id: string;
  name: string;
  username: string;
  photo_url: string;
}

let schemaPromise: Promise<void> | null = null;
function ensureSchema(): Promise<void> {
  if (!sql) return Promise.resolve();
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS tg_login_codes (
          code       text PRIMARY KEY,
          tg_id      text NOT NULL,
          name       text,
          username   text,
          photo_url  text,
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

/** Створює новий 6-значний код для користувача (старі його коди видаляються). */
export async function createLoginCode(u: TgLoginUser): Promise<string | null> {
  if (!sql) return null;
  await ensureSchema();
  // Прибираємо старі коди цього користувача та протерміновані загалом.
  await sql`DELETE FROM tg_login_codes WHERE tg_id = ${u.tg_id} OR created_at < now() - interval '10 minutes'`;
  for (let i = 0; i < 6; i++) {
    const code = String(randomInt(100000, 1000000));
    try {
      await sql`
        INSERT INTO tg_login_codes (code, tg_id, name, username, photo_url)
        VALUES (${code}, ${u.tg_id}, ${u.name}, ${u.username}, ${u.photo_url})
      `;
      return code;
    } catch {
      // колізія PK — пробуємо інший код
    }
  }
  return null;
}

/** Перевіряє й «спалює» код. Повертає користувача, якщо код валідний і свіжий. */
export async function consumeLoginCode(code: string): Promise<TgLoginUser | null> {
  if (!sql) return null;
  await ensureSchema();
  const rows = await sql<{ tg_id: string; name: string; username: string; photo_url: string; created_at: string }[]>`
    SELECT tg_id, name, username, photo_url, created_at FROM tg_login_codes WHERE code = ${code}
  `;
  const row = rows[0];
  if (!row) return null;
  await sql`DELETE FROM tg_login_codes WHERE code = ${code}`; // одноразовий
  const ageSec = (Date.now() - new Date(row.created_at).getTime()) / 1000;
  if (ageSec > TTL_SEC) return null;
  return { tg_id: row.tg_id, name: row.name, username: row.username, photo_url: row.photo_url };
}
