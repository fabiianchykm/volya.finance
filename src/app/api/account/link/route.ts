import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { assertSameOrigin, guardRequest } from "@/lib/api-guard";
import { getSessionIdentity } from "@/lib/session-identity";
import { normalizePhone, verifyPhoneCode } from "@/lib/phone-login";
import {
  resolveIdentities, listIdentityLinks, addIdentityLink, removeIdentityLink,
  createLinkIntent, consumeLinkIntent,
} from "@/lib/identity";

// «Способи входу» в кабінеті: звʼязок Google-акаунта (email) і номера телефону
// однієї людини. Потрібен, щоб бонуси, реферальне посилання й поліси були ОДНІ
// незалежно від того, як людина увійшла цього разу.
//
// GET                      → { email, phone, emails, phones, links }
// POST { phone, code }     → Google-вхід додає номер (код з Telegram, див. /api/phone)
// POST { idToken }         → те саме, але код прийшов по SMS (Firebase Phone Auth)
// POST { intent: "google" }→ вхід за номером хоче додати Google: ставимо httpOnly-cookie
//                            з токеном наміру; далі клієнт іде в signIn("google")
// POST { complete: true }  → після Google-входу: cookie наміру + email сесії → звʼязок
// DELETE { email, phone }  → прибрати явний звʼязок (лише свій)

const INTENT_COOKIE = "link_intent";

export async function GET(req: NextRequest) {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;
  const who = await getSessionIdentity();
  if (!who.email && !who.phone) return NextResponse.json({ loggedIn: false });
  const ids = await resolveIdentities(who).catch(() => ({ emails: who.email ? [who.email] : [], phones: who.phone ? [who.phone] : [] }));
  const links = await listIdentityLinks(ids).catch(() => []);
  return NextResponse.json({ loggedIn: true, email: who.email, phone: who.phone, emails: ids.emails, phones: ids.phones, links });
}

export async function POST(req: NextRequest) {
  const originBlocked = assertSameOrigin(req);
  if (originBlocked) return originBlocked;
  const blocked = guardRequest(req, { name: "account-link", limit: 12, windowMs: 10 * 60 * 1000 });
  if (blocked) return blocked;

  const who = await getSessionIdentity();
  if (!who.email && !who.phone) return NextResponse.json({ success: false, error: "Увійдіть у кабінет." }, { status: 401 });

  let body: { phone?: string; code?: string; idToken?: string; intent?: string; complete?: boolean } = {};
  try { body = await req.json(); } catch { /* порожнє тіло */ }

  // 1) Вхід за номером → намір привʼязати Google.
  if (body.intent === "google") {
    if (!who.phone) return NextResponse.json({ success: false, error: "Ви вже увійшли через Google." }, { status: 400 });
    const token = randomBytes(24).toString("base64url");
    await createLinkIntent(who.phone, token);
    const res = NextResponse.json({ success: true });
    res.cookies.set(INTENT_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 15 * 60 });
    return res;
  }

  // 2) Після Google-входу завершуємо намір.
  if (body.complete) {
    const token = req.cookies.get(INTENT_COOKIE)?.value ?? "";
    const res = (payload: Record<string, unknown>, status = 200) => {
      const r = NextResponse.json(payload, { status });
      r.cookies.set(INTENT_COOKIE, "", { path: "/", maxAge: 0 });
      return r;
    };
    if (!token) return res({ success: false, error: "Намір привʼязки не знайдено або протермінований." }, 400);
    if (!who.email) return res({ success: false, error: "Потрібен вхід через Google." }, 400);
    const phone = await consumeLinkIntent(token);
    if (!phone) return res({ success: false, error: "Намір привʼязки протермінований. Спробуйте ще раз." }, 400);
    await addIdentityLink(who.email, phone, "google-after-phone");
    return res({ success: true, email: who.email, phone });
  }

  // 3) Google-вхід додає номер: код з Telegram (наш) або SMS (Firebase ID-токен).
  if (!who.email) return NextResponse.json({ success: false, error: "Додати номер можна лише з Google-входу." }, { status: 400 });
  let phone: string | null = null;
  if (body.idToken) {
    const { verifyFirebasePhone } = await import("@/lib/firebase-admin");
    const raw = await verifyFirebasePhone(String(body.idToken));
    phone = raw ? normalizePhone(raw) : null;
    if (!phone) return NextResponse.json({ success: false, error: "Не вдалося підтвердити номер." }, { status: 400 });
  } else {
    const p = normalizePhone(String(body.phone ?? ""));
    const code = String(body.code ?? "").trim();
    if (!p || !/^\d{6}$/.test(code)) return NextResponse.json({ success: false, error: "Невірний номер або код." }, { status: 400 });
    if (!(await verifyPhoneCode(p, code))) return NextResponse.json({ success: false, error: "Невірний або протермінований код." }, { status: 400 });
    phone = p;
  }
  await addIdentityLink(who.email, phone, "phone-after-google");
  return NextResponse.json({ success: true, email: who.email, phone });
}

export async function DELETE(req: NextRequest) {
  const originBlocked = assertSameOrigin(req);
  if (originBlocked) return originBlocked;
  const who = await getSessionIdentity();
  if (!who.email && !who.phone) return NextResponse.json({ success: false }, { status: 401 });
  let body: { email?: string; phone?: string } = {};
  try { body = await req.json(); } catch { /* порожнє тіло */ }
  const email = String(body.email ?? "").trim().toLowerCase();
  const phone = normalizePhone(String(body.phone ?? ""));
  if (!email || !phone) return NextResponse.json({ success: false, error: "email і phone обовʼязкові" }, { status: 400 });
  // Прибрати можна лише звʼязок, одна зі сторін якого — ваш поточний вхід.
  if (email !== who.email && phone !== who.phone) return NextResponse.json({ success: false, error: "Це не ваш звʼязок." }, { status: 403 });
  await removeIdentityLink(email, phone);
  return NextResponse.json({ success: true });
}
