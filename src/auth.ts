import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { consumeLoginCode } from "@/lib/tg-login";

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Довіряємо хосту з заголовків запиту (потрібно для self-hosted деплою
  // та доступу не через localhost). На Vercel визначається автоматично.
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    // Вхід через Telegram за одноразовим кодом: бот надсилає код у чат, користувач
    // вводить його на сайті. Код перевіряємо в БД (одноразовий, живе 5 хв).
    Credentials({
      id: "telegram",
      name: "Telegram",
      credentials: { code: {} },
      authorize: async (raw) => {
        const code = String((raw as { code?: string }).code ?? "").trim();
        if (!/^\d{6}$/.test(code)) return null;
        const user = await consumeLoginCode(code);
        if (!user) return null;
        return {
          id: `tg:${user.tg_id}`,
          name: user.name || (user.username ? `@${user.username}` : `tg${user.tg_id}`),
          image: user.photo_url || null,
        };
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
  },
});
