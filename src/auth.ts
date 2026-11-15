import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { normalizePhone, verifyPhoneCode } from "@/lib/phone-login";
import { getPoliciesByPhone } from "@/lib/policies";

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
