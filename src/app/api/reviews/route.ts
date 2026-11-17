import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { guardRequest, assertSameOrigin } from "@/lib/api-guard";
import { getReviews, saveReview, hasReviewed, updateOwnReview, deleteOwnReview } from "@/lib/reviews";
import { getInsurer } from "@/lib/insurers";
import { getPoliciesByIdentities } from "@/lib/policies";
import { resolveIdentities, primaryEmail, identityKeys } from "@/lib/identity";
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
    // Рівноправна звʼязка: перевіряємо покупку по ВСІХ повʼязаних ідентичностях.
    const ids = await resolveIdentities({ email, phone });
    const policies = await getPoliciesByIdentities(ids.emails, ids.phones);
    const bought = policies.find((p) => !!p.company && ins.match.test(p.company));
    if (!bought) {
      return NextResponse.json({ success: false, error: "Відгук можна лишити лише про страхову, поліс якої ви купили у нас." }, { status: 403 });
    }

    // Канонічний ключ відгуку + перевірка «вже лишав» по всіх ключах акаунта.
    const key = primaryEmail(ids, email) ?? `phone:${ids.phones[0] ?? phone}`;
    const candidateKeys = [...ids.emails, ...ids.phones.map((p) => `phone:${p}`)];
    for (const k of candidateKeys) {
      if (await hasReviewed(slug, k)) {
        return NextResponse.json({ success: false, error: "Ви вже залишили відгук про цю страхову." }, { status: 409 });
      }
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

// ── Власні відгуки з кабінету (/reviews): редагувати й видаляти може лише автор
// (перевірка по всіх ключах звʼязаних ідентичностей акаунта).
async function ownerKeys(): Promise<string[] | null> {
  const session = await auth().catch(() => null);
  const email = session?.user?.email ?? null;
  const uid = (session?.user as { id?: string } | undefined)?.id ?? "";
  const phone = uid.startsWith("phone:") ? uid.slice("phone:".length) : null;
  if (!email && !phone) return null;
  const ids = await resolveIdentities({ email, phone });
  return identityKeys(ids);
}

export async function PATCH(req: NextRequest) {
  const originBlocked = assertSameOrigin(req);
  if (originBlocked) return originBlocked;
  const keys = await ownerKeys();
  if (!keys) return NextResponse.json({ success: false, error: "Увійдіть у кабінет" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const id = Number(body?.id);
  const rating = Number(body?.rating);
  const text = String(body?.text ?? "").trim();
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ success: false, error: "Невірний відгук" }, { status: 400 });
  if (!(rating >= 1 && rating <= 5)) return NextResponse.json({ success: false, error: "Оцінка має бути від 1 до 5" }, { status: 400 });
  if (text.length < 10) return NextResponse.json({ success: false, error: "Відгук замалий (мін. 10 символів)" }, { status: 400 });
  if (text.length > 2000) return NextResponse.json({ success: false, error: "Відгук задовгий (макс. 2000 символів)" }, { status: 400 });

  try {
    const ok = await updateOwnReview(id, keys, rating, text);
    if (!ok) return NextResponse.json({ success: false, error: "Відгук не знайдено" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[reviews] update error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ success: false, error: "Не вдалося зберегти зміни" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const originBlocked = assertSameOrigin(req);
  if (originBlocked) return originBlocked;
  const keys = await ownerKeys();
  if (!keys) return NextResponse.json({ success: false, error: "Увійдіть у кабінет" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const id = Number(body?.id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ success: false, error: "Невірний відгук" }, { status: 400 });
  try {
    const ok = await deleteOwnReview(id, keys);
    if (!ok) return NextResponse.json({ success: false, error: "Відгук не знайдено" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[reviews] delete error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ success: false, error: "Не вдалося видалити" }, { status: 500 });
  }
}
