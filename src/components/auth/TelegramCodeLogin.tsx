"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/Button";

// Вхід через Telegram за одноразовим кодом:
// 1) відкриваємо бота (deep-link ?start=login) — бот надсилає код у чат;
// 2) користувач вводить код тут → створюється сесія.

const BOT_USERNAME = "volya_finance_bot";

export function TelegramCodeLogin() {
  const [step, setStep] = useState<"start" | "code">("start");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openBot = () => {
    window.open(`https://t.me/${BOT_USERNAME}?start=login`, "_blank", "noopener,noreferrer");
    setStep("code");
    setError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6 || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await signIn("telegram", { code, redirect: false });
      if (res?.ok && !res.error) {
        window.location.reload();
      } else {
        setError("Невірний або протермінований код. Отримайте новий у Telegram.");
      }
    } catch {
      setError("Сталася помилка. Спробуйте ще раз.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "start") {
    return (
      <Button
        variant="outline"
        size="lg"
        className="flex w-full items-center justify-center gap-2"
        onClick={openBot}
      >
        <Send className="h-4 w-4 text-sky-500" />
        Отримати код у Telegram
      </Button>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-sm text-zinc-500">
        Ми відкрили бота <span className="font-medium text-zinc-700">@{BOT_USERNAME}</span> — він надіслав вам код.
        Введіть його нижче:
      </p>
      <input
        type="text"
        inputMode="numeric"
        autoFocus
        maxLength={6}
        placeholder="______"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        className="h-12 w-full rounded-xl border border-zinc-200 bg-white text-center text-2xl font-bold tracking-[0.4em] text-zinc-900 outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
      />
      {error && <p className="text-sm font-medium text-red-500">{error}</p>}
      <Button type="submit" variant="primary" size="lg" loading={loading} disabled={code.length !== 6 || loading} className="w-full">
        Підтвердити
      </Button>
      <button type="button" onClick={openBot} className="w-full text-center text-xs text-indigo-600 hover:underline">
        Не отримали код? Відкрити бота ще раз
      </button>
    </form>
  );
}
