import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { getThreadForClient, getClientForThread, saveThread } from "@/lib/support";

// Вебхук Telegram-бота = чат підтримки.
//
// Режим ТЕМ (масштабований, коли задано TELEGRAM_SUPPORT_GROUP_ID):
//   • клієнт пише → бот заводить окрему ТЕМУ на клієнта в супергрупі й пересилає
//     туди повідомлення; клієнт отримує автовідповідь Володі;
//   • будь-який оператор пише в темі → бот пересилає це клієнту.
//   Усі оператори — учасники групи, бачать усі теми й повну історію.
//
// Резервний режим (один оператор, якщо групу не задано): пересилання в
// TELEGRAM_OPERATOR_CHAT_ID / TELEGRAM_SALES_CHAT_ID, відповідь через reply.
//
// Захист: secret_token у заголовку, похідний від токена бота. Origin/rate-guard
// не застосовуємо — запит іде від серверів Telegram.

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SUPPORT_GROUP_ID = process.env.TELEGRAM_SUPPORT_GROUP_ID;
const OPERATOR_CHAT_ID = process.env.TELEGRAM_OPERATOR_CHAT_ID || process.env.TELEGRAM_SALES_CHAT_ID;
const CARE_ICON = "💜";

export function webhookSecret(): string {
  return createHash("sha256").update(`${BOT_TOKEN ?? ""}:webhook`).digest("hex").slice(0, 40);
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function tg(method: string, payload: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = (await res.json().catch(() => null)) as { ok?: boolean; result?: unknown } | null;
    return json?.ok ? (json.result as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

const greeting = (firstName: string) =>
  `Вітаю, ${esc(firstName)}! Мене звати Володя, служба турботи volya.finance ${CARE_ICON}\n\n` +
  `Ваше звернення прийнято — відповім найближчим часом.`;

const welcome = () =>
  `👋 Вітаємо у службі турботи <b>volya.finance</b>! ${CARE_ICON}\n\n` +
  `Напишіть своє запитання — і наш оператор відповість вам якнайшвидше.`;

// Знаходить існуючу тему клієнта або створює нову в супергрупі.
async function ensureTopic(clientChatId: string, fullName: string, username: string): Promise<number | null> {
  const existing = await getThreadForClient(clientChatId);
  if (existing) return existing;

  const name = `${fullName}${username ? ` ${username}` : ""}`.slice(0, 120) || `Клієнт ${clientChatId}`;
  const created = await tg("createForumTopic", { chat_id: SUPPORT_GROUP_ID, name });
  const threadId = created?.message_thread_id as number | undefined;
  if (!threadId) return null;

  await saveThread(clientChatId, threadId);
  await tg("sendMessage", {
    chat_id: SUPPORT_GROUP_ID,
    message_thread_id: threadId,
    parse_mode: "HTML",
    text: `👤 <b>${esc(fullName)}</b> ${esc(username)}\n🆔 ${clientChatId}\n\n↩️ Пишіть у цій темі — відповідь піде клієнту.`,
  });
  return threadId;
}

export async function POST(req: NextRequest) {
  if (!BOT_TOKEN) return NextResponse.json({ ok: true });

  const sig = req.headers.get("x-telegram-bot-api-secret-token");
  if (sig !== webhookSecret()) return NextResponse.json({ ok: false }, { status: 401 });

  let update: Record<string, unknown>;
  try {
    update = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  const msg = (update.message ?? update.edited_message) as Record<string, unknown> | undefined;
  const chat = msg?.chat as { id: number | string; type?: string } | undefined;
  if (!msg || !chat) return NextResponse.json({ ok: true });

  const from = (msg.from as { id?: number; is_bot?: boolean; first_name?: string; last_name?: string; username?: string }) ?? {};
  if (from.is_bot) return NextResponse.json({ ok: true }); // ігноруємо ботів (у т.ч. службові)

  const chatId = String(chat.id);
  const text = String((msg.text as string) ?? "");
  const messageId = msg.message_id as number;
  const fullName = [from.first_name, from.last_name].filter(Boolean).join(" ") || "друже";
  const firstName = from.first_name || "друже";
  const username = from.username ? `@${from.username}` : "";

  // /id — допомога при налаштуванні: бот повертає id чату (щоб отримати id групи).
  if (text.trim() === "/id") {
    await tg("sendMessage", { chat_id: chatId, text: `chat_id: ${chatId}\ntype: ${chat.type ?? "?"}` });
    return NextResponse.json({ ok: true });
  }

  try {
    // ══════════ РЕЖИМ ТЕМ (супергрупа задана) ══════════
    if (SUPPORT_GROUP_ID) {
      // Повідомлення в самій групі підтримки = відповідь оператора в темі.
      if (chatId === String(SUPPORT_GROUP_ID)) {
        const threadId = msg.message_thread_id as number | undefined;
        if (!threadId) return NextResponse.json({ ok: true }); // General / без теми
        const clientId = await getClientForThread(threadId);
        if (!clientId) return NextResponse.json({ ok: true });
        if (text) {
          await tg("sendMessage", { chat_id: clientId, text });
        } else {
          await tg("copyMessage", { chat_id: clientId, from_chat_id: SUPPORT_GROUP_ID, message_id: messageId });
        }
        return NextResponse.json({ ok: true });
      }

      // Приватний чат = клієнт.
      if (chat.type === "private") {
        if (text.startsWith("/start")) {
          await tg("deleteMessage", { chat_id: chatId, message_id: messageId });
          await tg("sendMessage", { chat_id: chatId, parse_mode: "HTML", text: welcome() });
          return NextResponse.json({ ok: true });
        }

        await tg("sendMessage", { chat_id: chatId, parse_mode: "HTML", text: greeting(firstName) });

        const threadId = await ensureTopic(chatId, fullName, username);
        if (threadId) {
          if (text) {
            await tg("sendMessage", { chat_id: SUPPORT_GROUP_ID, message_thread_id: threadId, text });
          } else {
            await tg("copyMessage", { chat_id: SUPPORT_GROUP_ID, message_thread_id: threadId, from_chat_id: chatId, message_id: messageId });
          }
        }
      }
      return NextResponse.json({ ok: true });
    }

    // ══════════ РЕЗЕРВНИЙ РЕЖИМ (один оператор) ══════════
    const isOperator = OPERATOR_CHAT_ID && chatId === String(OPERATOR_CHAT_ID);
    if (isOperator) {
      const replied = msg.reply_to_message as { text?: string } | undefined;
      const m = replied?.text?.match(/🆔\s*(\d+)/);
      if (m && text) {
        await tg("sendMessage", { chat_id: m[1], text });
        await tg("sendMessage", { chat_id: chatId, text: "✅ Надіслано клієнту." });
      }
      return NextResponse.json({ ok: true });
    }

    if (text.startsWith("/start")) {
      await tg("deleteMessage", { chat_id: chatId, message_id: messageId });
      await tg("sendMessage", { chat_id: chatId, parse_mode: "HTML", text: welcome() });
      return NextResponse.json({ ok: true });
    }

    await tg("sendMessage", { chat_id: chatId, parse_mode: "HTML", text: greeting(firstName) });

    if (OPERATOR_CHAT_ID) {
      const header = `💬 <b>Звернення з бота</b>\n👤 ${esc(fullName)} ${esc(username)}\n🆔 ${chatId}`;
      if (text) {
        await tg("sendMessage", { chat_id: OPERATOR_CHAT_ID, parse_mode: "HTML", text: `${header}\n\n${esc(text)}\n\n↩️ Reply — відповісти клієнту.` });
      } else {
        await tg("sendMessage", { chat_id: OPERATOR_CHAT_ID, parse_mode: "HTML", text: `${header}\n\n(медіа нижче)\n↩️ Reply — відповісти клієнту.` });
        await tg("copyMessage", { chat_id: OPERATOR_CHAT_ID, from_chat_id: chatId, message_id: messageId });
      }
    }
  } catch {
    // тихо — не валимо вебхук
  }

  return NextResponse.json({ ok: true });
}
