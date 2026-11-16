import { NextRequest, NextResponse } from "next/server";
import { guardRequest } from "@/lib/api-guard";
import { sendTelegram, trySendTelegram, escapeHtml } from "@/lib/telegram";
import { sourceLine } from "@/lib/attribution";
import { saveLead } from "@/lib/leads";
import { createGiftRequest, GIFT_MAX, GIFT_MIN } from "@/lib/gift";
import { GIFT_LAUNCH_LABEL, isGiftLaunched } from "@/lib/gift-constants";
import { absoluteUrl } from "@/lib/seo";

// Заявка на подарунковий сертифікат: зберігаємо в БД, шлемо менеджеру в Telegram,
// дублюємо лідом (щоб був у /admin/leads). Повертаємо код і посилання на сертифікат.

export async function POST(req: NextRequest) {
  const blocked = guardRequest(req, { name: "gift", limit: 6, windowMs: 10 * 60 * 1000 });
  if (blocked) return blocked;

  if (!isGiftLaunched()) {
    return NextResponse.json({ success: false, error: `Подарункові сертифікати будуть доступні з ${GIFT_LAUNCH_LABEL.uk}` }, { status: 403 });
  }

  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ success: false, error: "Bad request" }, { status: 400 }); }

  const amount = Math.round(Number(b.amount));
  if (!Number.isFinite(amount) || amount < GIFT_MIN || amount > GIFT_MAX) {
    return NextResponse.json({ success: false, error: `Сума має бути від ${GIFT_MIN} до ${GIFT_MAX} грн` }, { status: 400 });
  }
  // Імʼя, одержувач і привітання — опційні (форма питає лише суму й телефон; менеджер уточнює при дзвінку).
  const buyerName = String(b.buyerName ?? "").trim().slice(0, 80);

  let local = String(b.buyerPhone ?? "").replace(/\D/g, "");
  if (local.length === 12 && local.startsWith("380")) local = local.slice(3);
  else if (local.length === 11 && local.startsWith("80")) local = local.slice(2);
  if (local.length !== 9) return NextResponse.json({ success: false, error: "Невірний номер телефону" }, { status: 400 });
  const buyerPhone = `+380${local}`;

  const buyerEmail = String(b.buyerEmail ?? "").trim().slice(0, 254) || null;
  if (buyerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) {
    return NextResponse.json({ success: false, error: "Невірний email" }, { status: 400 });
  }
  const recipientName = String(b.recipientName ?? "").trim().slice(0, 80) || null;
  const message = String(b.message ?? "").trim().slice(0, 300) || null;

  let gift;
  try {
    gift = await createGiftRequest({ amount, buyerName, buyerPhone, buyerEmail, recipientName, message });
  } catch (e) {
    console.error("[gift] create error:", e instanceof Error ? e.message : e);
  }
  if (!gift) return NextResponse.json({ success: false, error: "Не вдалося створити заявку. Напишіть нам у Telegram." }, { status: 503 });

  const url = absoluteUrl(`/gift/${gift.code}`);
  const pretty = `+380 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5, 7)} ${local.slice(7)}`;
  const lines = [
    "🎁 <b>Заявка на подарунковий сертифікат</b>",
    `💰 <b>${amount} грн</b> · код <code>${gift.code}</code>`,
    `☎️ <code>${escapeHtml(buyerPhone)}</code> (${escapeHtml(pretty)})${buyerName ? ` · ${escapeHtml(buyerName)}` : ""}`,
    buyerEmail ? `✉️ ${escapeHtml(buyerEmail)}` : null,
    recipientName ? `🎀 Кому: ${escapeHtml(recipientName)}` : null,
    message ? `💬 ${escapeHtml(message)}` : null,
    `🔗 Сертифікат: ${url}`,
    `🛠 Адмінка: ${absoluteUrl("/admin/gifts")} — після оплати поставити «Оплачено»`,
    sourceLine(req),
  ].filter(Boolean) as string[];

  try {
    await sendTelegram("sales", lines.join("\n"));
  } catch (e) {
    await trySendTelegram("dev", `⚠️ <b>Заявку на сертифікат не доставлено в sales</b>\n${lines.join("\n")}\n<code>${escapeHtml(e instanceof Error ? e.message : String(e)).slice(0, 200)}</code>`);
  }
  try {
    await saveLead({ product: "gift", customerName: buyerName || null, phone: buyerPhone, email: buyerEmail, price: amount, stage: `сертифікат ${gift.code}` });
  } catch (e) {
    console.error("[gift] lead error:", e instanceof Error ? e.message : e);
  }

  return NextResponse.json({ success: true, code: gift.code, url: `/gift/${gift.code}` });
}
