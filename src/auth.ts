import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { verifyTelegramAuth, type TelegramAuthData } from "@/lib/telegram-auth";

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Довіряємо хосту з заголовків запиту (потрібно для self-hosted деплою
  // та доступу не через localhost). На Vercel визначається автоматично.
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    // Вхід через Telegram Login Widget — перевіряємо підпис даних токеном бота.
    Credentials({
      id: "telegram",
      name: "Telegram",
      credentials: {
        id: {}, first_name: {}, last_name: {}, username: {},
        photo_url: {}, auth_date: {}, hash: {},
      },
      authorize: async (raw) => {
        const data = raw as TelegramAuthData;
        if (!verifyTelegramAuth(data, process.env.TELEGRAM_BOT_TOKEN ?? "")) return null;
        const name =
          [data.first_name, data.last_name].filter(Boolean).join(" ") ||
          (data.username ? `@${data.username}` : `tg${data.id}`);
        return {
          id: `tg:${data.id}`,
          name,
          image: data.photo_url ?? null,
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
