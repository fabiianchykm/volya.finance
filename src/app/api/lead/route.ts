import { NextRequest, NextResponse } from "next/server";
import { guardRequest, assertSameOrigin } from "@/lib/api-guard";
import { sendTelegram, trySendTelegram, escapeHtml } from "@/lib/telegram";

// Заявка на дзвінок («Оформити з консультантом»). Лід шлемо в sales-бот Telegram.
// Лід критичний — тому sendTelegram (кидає при збої): якщо не доставили, звітуємо
// клієнту помилкою, щоб він міг зателефонувати напряму, і дублюємо в dev-бот.

export async function POST(req: NextRequest) {
  const originBlocked = assertSameOrigin(req);
  if (originBlocked) return originBlocked;

  // Ліди рідкісні — тримаємо ліміт низьким проти спаму/ботів.
  const blocked = guardRequest(req, { name: "lead", limit: 8, windowMs: 10 * 60 * 1000 });
  if (blocked) return blocked;

  let rawPhone = "";
  let source = "";
  try {
    const body = await req.json();
    rawPhone = String(body?.phone ?? "").replace(/\D/g, "");
    source = String(body?.source ?? "");
  } catch {
    return NextResponse.json({ success: false, error: "Bad request" }, { status: 400 });
  }

  // Нормалізуємо до локальних 9 цифр (приймаємо і формат із 380 / 80).
  let local = rawPhone;
  if (local.length === 12 && local.startsWith("380")) local = local.slice(3);
  else if (local.length === 11 && local.startsWith("80")) local = local.slice(2);
  if (local.length !== 9) {
    return NextResponse.json({ success: false, error: "Невірний номер телефону" }, { status: 400 });
  }

  const full = `+380${local}`;
  const pretty = `+380 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5, 7)} ${local.slice(7, 9)}`;

  const lines = [
    "📞 <b>Заявка на дзвінок</b>",
    `☎️ <code>${escapeHtml(full)}</code> (${escapeHtml(pretty)})`,
    source ? `🌐 Джерело: ${escapeHtml(source).slice(0, 60)}` : null,
  ].filter(Boolean);

  try {
    await sendTelegram("sales", lines.join("\n"));
  } catch (e) {
    // Не втрачаємо лід: дублюємо в dev-бот і повідомляємо клієнта, що краще подзвонити.
    await trySendTelegram("dev", `⚠️ <b>Лід не доставлено в sales</b>\n${lines.join("\n")}\n<code>${escapeHtml(e instanceof Error ? e.message : String(e)).slice(0, 200)}</code>`);
    return NextResponse.json(
      { success: false, error: "Не вдалося надіслати заявку. Зателефонуйте нам, будь ласка." },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true });
}
