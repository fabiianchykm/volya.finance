"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/Button";

// Вхід за номером телефону: код доставляється через Telegram (Gateway).
// 1) вводимо номер → /api/phone надсилає код у Telegram;
// 2) вводимо код → NextAuth credentials "phone" створює сесію.

function formatUaPhone(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 9);
  return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(" ");
}

export function PhoneLogin() {
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [channel, setChannel] = useState<"telegram" | "sms">("telegram");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const phoneDigits = phone.replace(/\D/g, "");

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneDigits.length !== 9 || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/phone", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone: `380${phoneDigits}` }),
      });
      const json = await res.json().catch(() => ({}));
      if (json.success) {
        setChannel(json.channel === "sms" ? "sms" : "telegram");
        setStep("code");
      } else {
        setError(json.error ?? "Не вдалося надіслати код. Спробуйте ще раз.");
      }
    } catch {
      setError("Сталася помилка. Спробуйте ще раз.");
    } finally {
      setLoading(false);
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6 || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await signIn("phone", { phone: `380${phoneDigits}`, code, redirect: false });
      if (res?.ok && !res.error) {
        window.location.reload();
      } else {
        setError("Невірний або протермінований код.");
      }
    } catch {
      setError("Сталася помилка. Спробуйте ще раз.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "phone") {
    return (
      <form onSubmit={sendCode} className="space-y-3">
        <div className="flex items-center rounded-xl border border-zinc-200 bg-white transition-colors focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
          <span className="select-none pl-4 pr-1 text-sm text-zinc-500">+380</span>
          <input
            type="tel"
            inputMode="numeric"
            autoFocus
            placeholder="67 123 45 67"
            value={formatUaPhone(phone)}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 9))}
            className="h-11 w-full rounded-r-xl bg-transparent px-2 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none"
          />
        </div>
        {error && <p className="text-sm font-medium text-red-500">{error}</p>}
        <Button type="submit" variant="primary" size="lg" loading={loading} disabled={phoneDigits.length !== 9 || loading} className="flex w-full items-center justify-center gap-2">
          Отримати код
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={verify} className="space-y-3">
      <p className="flex items-start gap-2 text-sm text-zinc-500">
        <Send className={`mt-0.5 h-4 w-4 shrink-0 ${channel === "sms" ? "text-emerald-500" : "text-sky-500"}`} />
        <span>
          Код надіслано {channel === "sms" ? "по SMS" : "в Telegram"} на{" "}
          <span className="font-medium text-zinc-700">+380 {formatUaPhone(phone)}</span>. Введіть його:
        </span>
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
      <button type="button" onClick={() => { setStep("phone"); setCode(""); setError(null); }} className="w-full text-center text-xs text-indigo-600 hover:underline">
        Змінити номер
      </button>
    </form>
  );
}
