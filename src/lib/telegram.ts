// Надсилання повідомлень у Telegram через Bot API. Використовується для лідів
// КАСКО (заявка «передзвоніть»). Креди — у TELEGRAM_BOT_TOKEN і TELEGRAM_CHAT_ID.
//
// chat_id — це id чату/каналу менеджера (для приватного чату — id користувача,
// для групи — від'ємне число, напр. -1001234567890). Дізнатись можна через
// @getidsbot або https://api.telegram.org/bot<token>/getUpdates.

export const isTelegramConfigured =
  !!process.env.TELEGRAM_BOT_TOKEN && !!process.env.TELEGRAM_CHAT_ID;

/** Екранує символи, що ламають parse_mode=HTML у Telegram. */
export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Надсилає текст у налаштований чат. Кидає помилку, якщо не налаштовано або
 * Telegram повернув не-2xx — щоб роут не звітував «успіх», втративши лід.
 */
export async function sendTelegramMessage(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    throw new Error("Telegram не налаштовано (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID)");
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
    throw new Error(`[telegram] ${res.status}: ${body.slice(0, 200)}`);
  }
}
