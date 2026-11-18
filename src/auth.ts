import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { normalizePhone, verifyPhoneCode } from "@/lib/phone-login";
import { ensureReviewDemoPolicies, isReviewDemoPhone, verifyReviewDemoCode } from "@/lib/review-demo";
import { getPoliciesByPhone } from "@/lib/policies";

/** Дозволені audience для Google id_token: веб-клієнт + мобільні (через кому). */
function googleAudiences(): Set<string> {
  const ids = [process.env.AUTH_GOOGLE_ID, ...(process.env.AUTH_GOOGLE_IOS_ID ?? "").split(",")]
    .map((v) => (v ?? "").trim())
    .filter(Boolean);
  return new Set(ids);
}

interface GoogleTokenInfo {
  iss?: string;
  aud?: string;
  sub?: string;
  email?: string;
  email_verified?: string | boolean;
  name?: string;
  picture?: string;
  exp?: string;
}

/** Перевірка Google id_token через tokeninfo (підпис, строк, audience, верифікований email). */
async function verifyGoogleIdToken(idToken: string): Promise<{ sub: string; email: string; name?: string; picture?: string } | null> {
  try {
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`, { cache: "no-store" });
    if (!res.ok) return null;
    const info = (await res.json()) as GoogleTokenInfo;
    const issOk = info.iss === "https://accounts.google.com" || info.iss === "accounts.google.com";
    const audOk = !!info.aud && googleAudiences().has(info.aud);
    const verified = info.email_verified === true || info.email_verified === "true";
    if (!issOk || !audOk || !verified || !info.sub || !info.email) return null;
    return { sub: info.sub, email: info.email.toLowerCase(), name: info.name, picture: info.picture };
  } catch {
    return null;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Довіряємо хосту з заголовків запиту (потрібно для self-hosted деплою
  // та доступу не через localhost). На Vercel визначається автоматично.
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    // Вхід за номером телефону: код доставляється через Telegram Gateway (згодом
    // SMS). Перевіряємо код у БД (одноразовий, живе 5 хв).
    Credentials({
      id: "phone",
      name: "Phone",
      credentials: { phone: {}, code: {} },
      authorize: async (raw) => {
        const { phone: rawPhone, code: rawCode } = raw as { phone?: string; code?: string };
        const phone = normalizePhone(String(rawPhone ?? ""));
        const code = String(rawCode ?? "").trim();
        if (!phone || !/^\d{6}$/.test(code)) return null;
        // Демо-акаунт для App Review: фіксований код з env, без Telegram (див. lib/review-demo).
        if (isReviewDemoPhone(phone)) {
          if (!verifyReviewDemoCode(phone, code)) return null;
          await ensureReviewDemoPolicies(phone);
          return { id: `phone:${phone}`, name: "Демо Клієнт" };
        }
        if (!(await verifyPhoneCode(phone, code))) return null;
        // Канонічне ім'я підставить jwt-callback з даних полісу.
        return { id: `phone:${phone}`, name: phone };
      },
    }),
    // Вхід через Google з мобільного застосунку: нативний Google Sign-In дає id_token,
    // ми перевіряємо його в Google (tokeninfo) і що він виданий для НАШОГО клієнта
    // (веб AUTH_GOOGLE_ID або iOS AUTH_GOOGLE_IOS_ID). id = Google sub — той самий, що
    // й у веб-провайдера Google, тож кабінет спільний.
    Credentials({
      id: "google-token",
      name: "Google (token)",
      credentials: { idToken: {} },
      authorize: async (raw) => {
        const idToken = String((raw as { idToken?: string }).idToken ?? "");
        if (!idToken) return null;
        const profile = await verifyGoogleIdToken(idToken);
        if (!profile) return null;
        return { id: profile.sub, email: profile.email, name: profile.name ?? null, image: profile.picture ?? null };
      },
    }),
    // Вхід за номером через SMS (Firebase Phone Auth). Клієнт проходить Firebase-
    // флоу (reCAPTCHA + SMS) і надсилає ID-токен; перевіряємо його на сервері.
    Credentials({
      id: "firebase-phone",
      name: "SMS",
      credentials: { idToken: {} },
      authorize: async (raw) => {
        const idToken = String((raw as { idToken?: string }).idToken ?? "");
        if (!idToken) return null;
        // Динамічний імпорт — щоб firebase-admin не тягнувся у загальний бандл auth.
        const { verifyFirebasePhone } = await import("@/lib/firebase-admin");
        const rawPhone = await verifyFirebasePhone(idToken);
        const phone = rawPhone ? normalizePhone(rawPhone) : null;
        if (!phone) return null;
        return { id: `phone:${phone}`, name: phone };
      },
    }),
  ],
  pages: {
    signIn: "/",
  },
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user;
    },
    // Ім'я в шапці = ВЛАСНИК акаунта, а не страхувальник останнього поліса: на один
    // акаунт (брокер, сім'я) оформлюють поліси на десятки різних людей, і раніше в
    // кутку щоразу з'являлося чуже ім'я. Google → ім'я з Google-акаунта. Вхід за
    // номером не має імені, тож беремо страхувальника НАЙСТАРШОГО поліса на цей
    // номер (перша покупка найімовірніше своя). Запит лише при вході.
    async jwt({ token, user }) {
      if (user) {
        const uid = user.id ?? "";
        const phone = uid.startsWith("phone:") ? uid.slice("phone:".length) : null;
        if (phone) {
          try {
            const pols = await getPoliciesByPhone(phone); // найновіші першими
            const first = [...pols].reverse().find((p) => p.customerName);
            if (first?.customerName) token.name = first.customerName;
          } catch { /* ігноруємо — лишиться номер телефону */ }
        }
      }
      return token;
    },
    // Прокидаємо id користувача (для Google — google id, для входу за номером —
    // "phone:+380…") у сесію, щоб /policies знав, за чим шукати поліси.
    session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as { id?: string }).id = token.sub;
      }
      return session;
    },
  },
});
