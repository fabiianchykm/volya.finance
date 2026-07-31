import { sql } from "./db";
import { trySendTelegram } from "./telegram";

// Проактивний моніторинг розміру БД: коли сховище наближається до ліміту (Neon
// free ≈ 0.5 ГБ), шлемо алерт у dev-Telegram, щоб розробник встиг збільшити план
// або почистити старі записи, ПОКИ записи ще проходять. Перевірка throttled —
// звертаємось до БД рідко (раз на кілька годин), алерт — не частіше ніж раз/добу.

const WARN_BYTES = Number(process.env.DB_WARN_BYTES ?? 400 * 1024 * 1024); // 400 МБ (~80% free-тарифу)
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;   // не частіше ніж раз на 6 год
const ALERT_INTERVAL_MS = 24 * 60 * 60 * 1000;  // повторний алерт — не частіше ніж раз на добу

let lastCheck = 0;
let lastAlert = 0;

/** Легка перевірка розміру БД (fire-and-forget). Нічого не кидає нагору. */
export async function checkDbHealth(): Promise<void> {
  if (!sql) return;
  const now = Date.now();
  if (now - lastCheck < CHECK_INTERVAL_MS) return;
  lastCheck = now;
  try {
    const [row] = await sql<{ bytes: string }[]>`SELECT pg_database_size(current_database()) AS bytes`;
    const bytes = Number(row?.bytes ?? 0);
    if (bytes >= WARN_BYTES && now - lastAlert > ALERT_INTERVAL_MS) {
      lastAlert = now;
      const mb = (bytes / 1024 / 1024).toFixed(0);
      const limitMb = (WARN_BYTES / 1024 / 1024).toFixed(0);
      await trySendTelegram(
        "dev",
        `⚠️ <b>База даних заповнюється</b>\n\n` +
          `Розмір БД: <b>${mb} МБ</b> (поріг сповіщення — ${limitMb} МБ).\n` +
          `Схоже, наближається ліміт сховища (Neon). Дії: збільшити план Neon або почистити старі записи (support_threads, phone_login_codes, старі policies).`
      );
    }
  } catch (e) {
    // Моніторинг не має впливати на основний потік.
    console.error("[db-health] check error:", e instanceof Error ? e.message : e);
  }
}
