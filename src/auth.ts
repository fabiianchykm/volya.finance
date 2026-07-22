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
        // Ім'я беремо з останнього полісу за цим номером (якщо є), інакше — номер.
        let name = phone;
        try {
          const pols = await getPoliciesByPhone(phone);
          if (pols[0]?.customerName) name = pols[0].customerName;
        } catch { /* ігноруємо — покажемо номер */ }
        return { id: `phone:${phone}`, name };
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
