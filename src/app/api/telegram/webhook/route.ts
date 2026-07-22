import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

// Вебхук Telegram-бота = двосторонній чат підтримки:
//   • клієнт тисне /start → вітальне повідомлення;
//   • клієнт пише → автовідповідь «Вітаю, …, Володя, служба турботи» + пересилання
//     повідомлення оператору;
//   • оператор робить reply на переслане повідомлення → відповідь летить клієнту.
//
// Захист: Telegram надсилає secret_token у заголовку; звіряємо з похідним від
// токена бота (щоб не заводити окремий секрет). НЕ застосовуємо origin/rate-guard —
// запит іде від серверів Telegram.

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OPERATOR_CHAT_ID = process.env.TELEGRAM_OPERATOR_CHAT_ID || process.env.TELEGRAM_SALES_CHAT_ID;
const CARE_ICON = "💜";

// Хто вже отримав привітання (щоб не слати його на кожне повідомлення). In-memory —
// живе, поки живий інстанс (у нас minInstances:1). Повторне привітання після
// редеплою нешкідливе.
const greeted = new Set<string>();

export function webhookSecret(): string {
  return createHash("sha256").update(`${BOT_TOKEN ?? ""}:webhook`).digest("hex").slice(0, 40);
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function tg(method: string, payload: Record<string, unknown>): Promise<void> {
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // тихо — не валимо вебхук
  }
}

export async function POST(req: NextRequest) {
  if (!BOT_TOKEN) return NextResponse.json({ ok: true });

  // Перевірка секрету вебхука.
  const sig = req.headers.get("x-telegram-bot-api-secret-token");
  if (sig !== webhookSecret()) return NextResponse.json({ ok: false }, { status: 401 });

  let update: Record<string, unknown>;
  try {
    update = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  const msg = (update.message ?? update.edited_message) as Record<string, unknown> | undefined;
  const chat = msg?.chat as { id: number | string } | undefined;
  if (!msg || !chat) return NextResponse.json({ ok: true });

  const chatId = String(chat.id);
  const text = String((msg.text as string) ?? "");
  const from = (msg.from as { first_name?: string; last_name?: string; username?: string }) ?? {};
  const fullName = [from.first_name, from.last_name].filter(Boolean).join(" ") || "друже";
  const firstName = from.first_name || "друже";
  const username = from.username ? `@${from.username}` : "";

  const isOperator = OPERATOR_CHAT_ID && chatId === String(OPERATOR_CHAT_ID);

  // ── Оператор відповідає клієнту (reply на переслане повідомлення з 🆔) ──
  if (isOperator) {
    const replied = msg.reply_to_message as { text?: string } | undefined;
    const m = replied?.text?.match(/🆔\s*(\d+)/);
    if (m && text) {
      await tg("sendMessage", { chat_id: m[1], text });
      await tg("sendMessage", { chat_id: chatId, text: "✅ Надіслано клієнту." });
    }
    // Інші повідомлення оператора (не reply на звернення) ігноруємо тихо,
    // щоб не заважати сповіщенням про ліди в тому ж чаті.
    return NextResponse.json({ ok: true });
  }

  // ── Клієнт ──
  if (text.startsWith("/start")) {
    await tg("sendMessage", {
      chat_id: chatId,
      parse_mode: "HTML",
      text:
        `👋 Вітаємо у службі турботи <b>volya.finance</b>! ${CARE_ICON}\n\n` +
        `Напишіть своє запитання — і наш оператор відповість вам якнайшвидше.`,
    });
    return NextResponse.json({ ok: true });
  }

  // Привітання — один раз на клієнта.
  if (!greeted.has(chatId)) {
    greeted.add(chatId);
    if (greeted.size > 5000) greeted.delete(greeted.values().next().value as string);
    await tg("sendMessage", {
      chat_id: chatId,
      parse_mode: "HTML",
      text:
        `Вітаю, ${esc(firstName)}! Мене звати Володя, служба турботи volya.finance ${CARE_ICON}\n\n` +
        `Ваше звернення прийнято — відповім найближчим часом.`,
    });
  }

  // Пересилання оператору.
  if (OPERATOR_CHAT_ID) {
    const header =
      `💬 <b>Звернення з бота</b>\n` +
      `👤 ${esc(fullName)} ${esc(username)}\n` +
      `🆔 ${chatId}`;
    if (text) {
      await tg("sendMessage", {
        chat_id: OPERATOR_CHAT_ID,
        parse_mode: "HTML",
        text: `${header}\n\n${esc(text)}\n\n↩️ Reply на це повідомлення — відповісти клієнту.`,
      });
    } else {
      // Не текст (фото/файл) — інфо + копія самого повідомлення.
      await tg("sendMessage", {
        chat_id: OPERATOR_CHAT_ID,
        parse_mode: "HTML",
        text: `${header}\n\n(медіа-повідомлення нижче)\n↩️ Reply — відповісти клієнту.`,
      });
      await tg("copyMessage", {
        chat_id: OPERATOR_CHAT_ID,
        from_chat_id: chatId,
        message_id: msg.message_id,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
