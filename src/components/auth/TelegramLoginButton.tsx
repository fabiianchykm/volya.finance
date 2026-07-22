"use client";

import { useEffect, useRef } from "react";
import { signIn } from "next-auth/react";

// Офіційний Telegram Login Widget. Рендерить кнопку «Log in with Telegram».
// Після успіху Telegram віддає підписані дані → входимо через credentials-провайдер.
// ВАЖЛИВО: домен сайту має бути прив'язаний до бота в @BotFather (/setdomain).

const BOT_USERNAME = "volya_finance_bot";

// Тип даних, які віддає віджет.
interface TgUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export function TelegramLoginButton() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (window as unknown as { onTelegramAuth?: (u: TgUser) => void }).onTelegramAuth = (user) => {
      // Передаємо всі поля як credentials; сервер перевірить підпис.
      void signIn("telegram", {
        id: String(user.id),
        first_name: user.first_name ?? "",
        last_name: user.last_name ?? "",
        username: user.username ?? "",
        photo_url: user.photo_url ?? "",
        auth_date: String(user.auth_date),
        hash: user.hash,
        callbackUrl: "/",
      });
    };

    const container = ref.current;
    if (!container) return;
    container.replaceChildren();

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", BOT_USERNAME);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "10");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    script.setAttribute("data-request-access", "write");
    container.appendChild(script);

    return () => container.replaceChildren();
  }, []);

  return <div ref={ref} className="flex justify-center" />;
}
