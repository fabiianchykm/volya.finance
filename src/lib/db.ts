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
      // Повні дані клієнта з полісом: телефон+ім'я (індекс/показ) і весь customer
      // (ПІБ, ІПН, документ, адреса…) як jsonb — щоб мати повний запис по кожному полісу.
      await sql`ALTER TABLE policies ADD COLUMN IF NOT EXISTS phone text`;
      await sql`ALTER TABLE policies ADD COLUMN IF NOT EXISTS customer_name text`;
      await sql`ALTER TABLE policies ADD COLUMN IF NOT EXISTS customer jsonb NOT NULL DEFAULT '{}'::jsonb`;
      await sql`CREATE INDEX IF NOT EXISTS policies_phone_idx ON policies (phone)`;
      // Поліси, додані клієнтом вручну (куплені деінде): source='manual',
      // product — вид (osago/kasko/greencard/tourism), policy_number — номер полісу.
      await sql`ALTER TABLE policies ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'issued'`;
      await sql`ALTER TABLE policies ADD COLUMN IF NOT EXISTS product text`;
      await sql`ALTER TABLE policies ADD COLUMN IF NOT EXISTS policy_number text`;
      // Профіль страхувальника, привʼязаний до АКАУНТА (email сесії). Один запис на
      // акаунт; синхронізується між пристроями. data — весь CustomerProfile як jsonb.
      await sql`
        CREATE TABLE IF NOT EXISTS customer_profiles (
          email      text PRIMARY KEY,
          data       jsonb NOT NULL DEFAULT '{}'::jsonb,
          updated_at timestamptz NOT NULL DEFAULT now()
        )
      `;
      // Відгуки про страхові — лише від тих, хто купував поліс цієї СК у нас.
      await sql`
        CREATE TABLE IF NOT EXISTS insurer_reviews (
          id          bigserial PRIMARY KEY,
          insurer     text NOT NULL,
          email       text NOT NULL,
          author_name text,
          rating      int NOT NULL,
          text        text NOT NULL,
          product     text,
          created_at  timestamptz NOT NULL DEFAULT now()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS insurer_reviews_insurer_idx ON insurer_reviews (insurer)`;
      // Ліди воронки: клієнт заповнив дані й перейшов до підтвердження, але міг не
      // завершити. Для передзвону/доведення — з контактом і статусом обробки.
      await sql`
        CREATE TABLE IF NOT EXISTS leads (
          id           bigserial PRIMARY KEY,
          product      text,
          customer_name text,
          phone        text,
          email        text,
          company      text,
          price        numeric,
          car          text,
          stage        text,
          status       text NOT NULL DEFAULT 'new',
          created_at   timestamptz NOT NULL DEFAULT now()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS leads_created_idx ON leads (created_at DESC)`;
      // Замовлення, що чекають фіналізації після оплати. Дозволяє БУДЬ-ЯКОМУ продукту
      // укластися на /payment-success (куди редіректить LiqPay), а не лише ОСЦПВ:
      // тут лежить продукт + payload укладання (для туризму — повний order) + мета
      // для збереження поліса. Видаляється/помічається після успішної фіналізації.
      await sql`
        CREATE TABLE IF NOT EXISTS pending_orders (
          order_id      text PRIMARY KEY,
          product       text NOT NULL,
          order_payload jsonb,
          meta          jsonb,
          finalized     boolean NOT NULL DEFAULT false,
          created_at    timestamptz NOT NULL DEFAULT now()
        )
      `;
    })().catch((e) => {
      schemaPromise = null;
      throw e;
    });
  }
  return schemaPromise;
}
