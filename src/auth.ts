import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { normalizePhone, verifyPhoneCode } from "@/lib/phone-login";
import { getPoliciesByPhone, getPoliciesByEmail } from "@/lib/policies";

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
        if (!(await verifyPhoneCode(phone, code))) return null;
        // Канонічне ім'я підставить jwt-callback з даних полісу.
        return { id: `phone:${phone}`, name: phone };
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
    // Канонічні дані профілю беремо з ОФОРМЛЕНОГО ПОЛІСУ (те, що клієнт сам ввів) —
    // і для Google (за email), і для входу за номером. Так на сайті завжди коректне
    // ім'я (напр. «Михайло»), а не значення з Google/email. Запит лише при вході.
    async jwt({ token, user }) {
      if (user) {
        const email = user.email ?? null;
        const uid = user.id ?? "";
        const phone = uid.startsWith("phone:") ? uid.slice("phone:".length) : null;
        try {
          const pols = phone
            ? await getPoliciesByPhone(phone)
            : email
              ? await getPoliciesByEmail(email)
              : [];
          if (pols[0]?.customerName) token.name = pols[0].customerName;
        } catch { /* ігноруємо — лишиться дефолтне ім'я */ }
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
