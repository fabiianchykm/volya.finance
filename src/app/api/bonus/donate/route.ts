import { NextRequest, NextResponse } from "next/server";
import { guardRequest, assertSameOrigin } from "@/lib/api-guard";
import { getSessionIdentity } from "@/lib/session-identity";
import { donateBonus, DONATION_FUNDS, DONATION_MIN } from "@/lib/bonus-donation";
import { sendTelegram, trySendTelegram, escapeHtml } from "@/lib/telegram";
import { absoluteUrl } from "@/lib/seo";

// POST { amount, fundId } — пожертвувати бонуси на благодійність (лише свій рахунок).
// GET — список фондів і мінімум (для форми).

export async function GET(req: NextRequest) {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;
  return NextResponse.json({ success: true, funds: DONATION_FUNDS, min: DONATION_MIN });
}

export async function POST(req: NextRequest) {
  const blocked = guardRequest(req, { name: "bonus-donate", limit: 5, windowMs: 10 * 60 * 1000 });
  if (blocked) return blocked;
  const originBlocked = assertSameOrigin(req);
  if (originBlocked) return originBlocked;

  const { email, phone } = await getSessionIdentity();
  if (!email && !phone) return NextResponse.json({ success: false, error: "Увійдіть у кабінет" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const amount = Number(body?.amount);
  const fundId = String(body?.fundId ?? "");
  if (!Number.isFinite(amount)) return NextResponse.json({ success: false, error: "Вкажіть суму" }, { status: 400 });

  try {
    const d = await donateBonus({ email, phone }, amount, fundId);
    const lines = [
      "💛 <b>Пожертва бонусів на благодійність</b>",
      `💰 <b>${d.amount} грн</b> → ${escapeHtml(d.fund)}`,
      `👤 Рахунок: <code>${escapeHtml(d.email)}</code>`,
      `🆔 ${escapeHtml(d.id)}`,
      `🛠 Переказати фонду й позначити «виплачено»: ${absoluteUrl("/admin/donations")}`,
    ];
    try { await sendTelegram("sales", lines.join("\n")); }
    catch (e) { await trySendTelegram("dev", `⚠️ <b>Пожертву не доставлено в sales</b>\n${lines.join("\n")}\n<code>${escapeHtml(e instanceof Error ? e.message : String(e)).slice(0, 200)}</code>`); }
    return NextResponse.json({ success: true, donation: d });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Не вдалося оформити пожертву";
    const client = /Мінімальна|Доступно лише|Оберіть фонд|рахунок/.test(msg);
    if (!client) console.error("[bonus/donate]", msg);
    return NextResponse.json({ success: false, error: client ? msg : "Не вдалося оформити пожертву. Спробуйте пізніше." }, { status: client ? 400 : 500 });
  }
}
