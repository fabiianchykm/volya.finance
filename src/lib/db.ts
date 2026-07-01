import postgres from "postgres";

// Єдиний клієнт Postgres (Neon/Supabase). Підключення береться з DATABASE_URL.
// Якщо змінної немає — sql === null, і шар даних деградує тихо (сайт не падає,
// просто фіча «мої поліси» не працює). Дзеркалить підхід layout.tsx з auth().

const databaseUrl = process.env.DATABASE_URL;

// Кешуємо інстанс у globalThis, щоб HMR у dev і повторні serverless-інвокації
// не плодили нові пули зʼєднань.
const globalForDb = globalThis as unknown as { __sql?: ReturnType<typeof postgres> };

export const sql = databaseUrl
  ? (globalForDb.__sql ??= postgres(databaseUrl, {
      // pgBouncer / Supabase-пулер у transaction-режимі не підтримує prepared
      // statements — вимикаємо, інакше частина запитів падає.
      prepare: false,
      // Serverless-інстанси короткоживучі — тримаємо маленький пул.
      max: 5,
      idle_timeout: 20,
    }))
  : null;

export const isDbConfigured = sql !== null;

// CREATE TABLE один раз на процес (ідемпотентно). Кешуємо проміс, щоб не ганяти
// DDL на кожен запит; при помилці скидаємо, аби наступний виклик спробував знову.
let schemaPromise: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (!sql) return Promise.resolve();
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS policies (
          id           text PRIMARY KEY,
          email        text NOT NULL,
          contract_id  text,
          order_id     text,
          company      text,
          vehicle      jsonb NOT NULL DEFAULT '{}'::jsonb,
          price        numeric,
          start_date   text,
          end_date     text,
          created_at   timestamptz NOT NULL DEFAULT now()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS policies_email_idx ON policies (lower(email))`;
    })().catch((e) => {
      schemaPromise = null;
      throw e;
    });
  }
  return schemaPromise;
}
