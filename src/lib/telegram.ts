// Telegram Bot API — ОДИН бот із двома ролями (два чати):
//   sales — бізнес-події: ліди КАСКО/Зелена карта, розпочато оплату, оформлено ОСЦПВ
//   dev   — технічні: помилки серверних роутів + зрив на пізньому кроці воронки
//
// Спільний токен TELEGRAM_BOT_TOKEN, а маршрут визначає лише чат:
//   sales → TELEGRAM_SALES_CHAT_ID, dev → TELEGRAM_DEV_CHAT_ID.
// Бот має бути учасником обох чатів. chat_id — id отримувача: приватний чат = id
// користувача; група = від'ємне число (напр. -1001234567890). @getidsbot / getUpdates.
//
// Якщо бот/чат не налаштовані — код деградує тихо (нічого не шлеться, сайт не падає).

export type TelegramTarget = "sales" | "dev";

function creds(target: TelegramTarget): { token?: string; chatId?: string } {
  return {
    token: process.env.TELEGRAM_BOT_TOKEN,
    chatId:
      target === "sales"
        ? process.env.TELEGRAM_SALES_CHAT_ID
        : process.env.TELEGRAM_DEV_CHAT_ID,
  };
}

export function isTelegramConfigured(target: TelegramTarget): boolean {
  const { token, chatId } = creds(target);
  return !!token && !!chatId;
}

/** Екранує символи, що ламають parse_mode=HTML у Telegram. */
export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Надсилає текст у бота target. Кидає помилку, якщо не налаштовано або Telegram
 * повернув не-2xx. Використовуй там, де втрата повідомлення критична (ліди) —
 * щоб роут не звітував «успіх», втративши лід.
 */
export async function sendTelegram(target: TelegramTarget, text: string): Promise<void> {
  const { token, chatId } = creds(target);
  if (!token || !chatId) {
    throw new Error(`Telegram (${target}) не налаштовано`);
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`[telegram:${target}] ${res.status}: ${body.slice(0, 200)}`);
  }
}

/**
 * Безпечна відправка: чекає завершення, але ковтає будь-яку помилку (лише лог) і
 * тихо нічого не робить, якщо target не налаштований. Для сповіщень, які НЕ мають
 * впливати на відповідь користувачу (продаж, оплата, dev-алерти). Виклик треба
 * await-ити в роуті — так доставка гарантована навіть на serverless.
 */
export async function trySendTelegram(target: TelegramTarget, text: string): Promise<void> {
  if (!isTelegramConfigured(target)) return;
  try {
    await sendTelegram(target, text);
  } catch (e) {
    console.error(`[telegram:${target}] send failed:`, e instanceof Error ? e.message : e);
  }
}

/** Формує й шле dev-боту алерт про помилку (безпечно, await-абельно). */
export async function notifyDevError(context: string, error: unknown): Promise<void> {
  const msg = error instanceof Error ? error.message : String(error);
  await trySendTelegram(
    "dev",
    `🛠 <b>Помилка</b> — ${escapeHtml(context)}\n<code>${escapeHtml(msg.slice(0, 400))}</code>`
  );
}
