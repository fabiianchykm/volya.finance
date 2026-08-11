import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { guardRequest, assertSameOrigin } from "@/lib/api-guard";
import { getReviews, saveReview, hasReviewed } from "@/lib/reviews";
import { getInsurer } from "@/lib/insurers";
import { getPoliciesByEmail, getPoliciesByPhone } from "@/lib/policies";
import { trySendTelegram, escapeHtml } from "@/lib/telegram";

// GET ?insurer=slug — список відгуків + середня оцінка (публічно).
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("insurer")?.trim() ?? "";
  if (!getInsurer(slug)) return NextResponse.json({ success: false, error: "Невідома страхова" }, { status: 400 });
  try {
    const data = await getReviews(slug);
    return NextResponse.json({ success: true, ...data });
  } catch {
    return NextResponse.json({ success: false, error: "Не вдалося завантажити відгуки" }, { status: 500 });
  }
}

// POST — лишити відгук. Лише залогінені, які купували поліс саме цієї СК у нас.
export async function POST(req: NextRequest) {
  const blocked = guardRequest(req, { name: "reviews", limit: 10, windowMs: 10 * 60 * 1000 });
  if (blocked) return blocked;
  const originBlocked = assertSameOrigin(req);
  if (originBlocked) return originBlocked;

  const session = await auth().catch(() => null);
  const email = session?.user?.email ?? null;
  const uid = (session?.user as { id?: string } | undefined)?.id ?? "";
  const phone = uid.startsWith("phone:") ? uid.slice("phone:".length) : null;
  if (!email && !phone) {
    return NextResponse.json({ success: false, error: "Увійдіть, щоб залишити відгук" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const slug = String(body?.insurer ?? "");
  const rating = Number(body?.rating);
  const text = String(body?.text ?? "").trim();
  const ins = getInsurer(slug);
  if (!ins) return NextResponse.json({ success: false, error: "Невідома страхова" }, { status: 400 });
  if (!(rating >= 1 && rating <= 5)) return NextResponse.json({ success: false, error: "Оцінка має бути від 1 до 5" }, { status: 400 });
  if (text.length < 10) return NextResponse.json({ success: false, error: "Відгук замалий (мін. 10 символів)" }, { status: 400 });

  try {
    // Перевірка покупки: серед полісів користувача має бути поліс цієї СК.
    const policies = phone ? await getPoliciesByPhone(phone) : await getPoliciesByEmail(email!);
    const bought = policies.find((p) => !!p.company && ins.match.test(p.company));
    if (!bought) {
      return NextResponse.json({ success: false, error: "Відгук можна лишити лише про страхову, поліс якої ви купили у нас." }, { status: 403 });
    }

    const key = email ?? `phone:${phone}`;
    if (await hasReviewed(slug, key)) {
      return NextResponse.json({ success: false, error: "Ви вже залишили відгук про цю страхову." }, { status: 409 });
    }

    const authorName = session?.user?.name ?? bought.customerName ?? null;
    await saveReview({ insurer: slug, email: key, authorName, rating, text, product: bought.product ?? null });

    await trySendTelegram("dev", [
      `📝 <b>Новий відгук про ${escapeHtml(ins.name)}</b> — ${rating}★`,
      bought.product ? `Продукт: ${escapeHtml(String(bought.product))}` : null,
      authorName ? `Автор: ${escapeHtml(String(authorName))}` : null,
      escapeHtml(text).slice(0, 500),
    ].filter(Boolean).join("\n"));

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[reviews] save error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ success: false, error: "Не вдалося зберегти відгук" }, { status: 500 });
  }
}
