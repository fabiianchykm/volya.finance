import { sql, ensureSchema } from "./db";

// Спільний (крос-інстансний) кеш результатів калькуляторів у Postgres. Потрібен
// бо in-memory кеш живе лише в одному serverless-інстансі, а з minInstances=0 +
// автоскейлом більшість запитів влучають у «холодний» інстанс і платять повну
// ціну важкого виклику Ukasko (туризм — 20–34с). Тут результат зберігається раз
// і віддається всім інстансам/користувачам до закінчення TTL.
//
// Усе best-effort: якщо БД недоступна — тихо повертаємо null / не пишемо, а
// калькулятор просто працює як раніше (через прямий виклик Ukasko).

export async function getCachedOffers<T = unknown>(cacheKey: string): Promise<T[] | null> {
  if (!sql) return null;
  try {
    await ensureSchema();
    const rows = await sql<{ offers: T[] }[]>`
      SELECT offers FROM offer_cache
      WHERE cache_key = ${cacheKey} AND expires_at > now()
      LIMIT 1
    `;
    return rows.length ? rows[0].offers : null;
  } catch {
    return null; // кеш не має ламати калькулятор
  }
}

export async function setCachedOffers(cacheKey: string, offers: unknown[], ttlMs: number): Promise<void> {
  if (!sql || !Array.isArray(offers) || offers.length === 0) return;
  const expiresAt = new Date(Date.now() + ttlMs);
  try {
    await ensureSchema();
    await sql`
      INSERT INTO offer_cache (cache_key, offers, expires_at)
      VALUES (${cacheKey}, ${sql.json(JSON.parse(JSON.stringify(offers)))}, ${expiresAt})
      ON CONFLICT (cache_key)
      DO UPDATE SET offers = EXCLUDED.offers, expires_at = EXCLUDED.expires_at, created_at = now()
    `;
    // Рідке прибирання протухлих записів (кожен ~20-й запис), щоб таблиця не пухла.
    if (Math.random() < 0.05) {
      await sql`DELETE FROM offer_cache WHERE expires_at < now()`;
    }
  } catch {
    // ігноруємо — кеш best-effort
  }
}
