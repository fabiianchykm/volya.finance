"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

export function SessionProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  // Не передаємо сесію з сервера (щоб сторінки не ставали динамічними) — провайдер
  // підтягне її на клієнті. Пропс лишаємо опційним для сумісності.
  session?: Session | null;
}) {
  return (
    <NextAuthSessionProvider session={session ?? undefined}>
      {children}
    </NextAuthSessionProvider>
  );
}
