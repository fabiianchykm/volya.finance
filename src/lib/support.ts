import { sql } from "./db";

// Звʼязок «клієнт ↔ тема (forum topic)» для чату підтримки в супергрупі.
// Кожен клієнт має власну тему; оператори відповідають у ній. Зберігаємо у
// Postgres, щоб маршрутизація переживала рестарти/кілька інстансів.

let schemaPromise: Promise<void> | null = null;

function ensureSupportSchema(): Promise<void> {
  if (!sql) return Promise.resolve();
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS support_threads (
          client_chat_id text PRIMARY KEY,
          thread_id      integer NOT NULL,
          created_at     timestamptz NOT NULL DEFAULT now()
        )
      `;
      await sql`CREATE UNIQUE INDEX IF NOT EXISTS support_threads_thread_idx ON support_threads (thread_id)`;
    })().catch((e) => {
      schemaPromise = null;
      throw e;
    });
  }
  return schemaPromise;
}

/** thread_id теми для клієнта, або null. */
export async function getThreadForClient(clientChatId: string): Promise<number | null> {
  if (!sql) return null;
  await ensureSupportSchema();
  const rows = await sql<{ thread_id: number }[]>`
    SELECT thread_id FROM support_threads WHERE client_chat_id = ${clientChatId}
  `;
  return rows[0]?.thread_id ?? null;
}

/** chat_id клієнта за темою, або null. */
export async function getClientForThread(threadId: number): Promise<string | null> {
  if (!sql) return null;
  await ensureSupportSchema();
  const rows = await sql<{ client_chat_id: string }[]>`
    SELECT client_chat_id FROM support_threads WHERE thread_id = ${threadId}
  `;
  return rows[0]?.client_chat_id ?? null;
}

/** Зберегти/оновити звʼязок клієнт → тема. */
export async function saveThread(clientChatId: string, threadId: number): Promise<void> {
  if (!sql) return;
  await ensureSupportSchema();
  await sql`
    INSERT INTO support_threads (client_chat_id, thread_id)
    VALUES (${clientChatId}, ${threadId})
    ON CONFLICT (client_chat_id) DO UPDATE SET thread_id = ${threadId}
  `;
}
