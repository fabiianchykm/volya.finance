"use client";

import { useState, useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { trackEvent } from "@/lib/analytics";
import { useI18n } from "@/lib/i18n";

// Спільне віконце заявки на звʼязок (телефон/email). Використовують і футер, і
// плаваюча кнопка. Керується через mode: "phone" | "email" | null (закрито).
// Заявка йде в sales-бот через /api/lead.

export type LeadMode = "phone" | "email" | null;

// "671234567" → "67 123 45 67" (у стані лише цифри).
function formatUaPhone(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 9);
  return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(" ");
}

export function LeadModal({ mode, source, onClose }: { mode: LeadMode; source: string; onClose: () => void }) {
  const { t } = useI18n();
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Мікро-конверсія: користувач відкрив форму зворотного звʼязку (початок заповнення).
  useEffect(() => {
    if (mode) trackEvent("callback_start", { method: mode, source });
  }, [mode, source]);

  // Скидаємо стан і закриваємо (усі шляхи закриття йдуть сюди), щоб наступне
  // відкриття було з чистою формою.
  const close = () => {
    setPhone("");
    setEmail("");
    setDone(false);
    setError(null);
    setSubmitting(false);
    onClose();
  };

  const phoneDigits = phone.replace(/\D/g, "");
  const valid =
    mode === "phone" ? phoneDigits.length === 9 : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const body =
        mode === "phone"
          ? { phone: `380${phoneDigits}`, source: `${source} — передзвоніть` }
          : { email: email.trim(), source: `${source} — напишіть на email` };
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error ?? t({ uk: "Не вдалося надіслати. Спробуйте ще раз.", en: "Failed to send. Please try again." }));
      trackEvent("generate_lead", { form: "callback", method: mode ?? "phone", source });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t({ uk: "Сталася помилка. Спробуйте ще раз.", en: "An error occurred. Please try again." }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={mode !== null} onClose={close} title={mode === "email" ? t({ uk: "Написати нам", en: "Write to us" }) : t({ uk: "Замовити дзвінок", en: "Order a call" })} size="sm">
      {done ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <CheckCircle2 className="h-12 w-12 text-emerald-500" />
          <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{t({ uk: "Дякуємо! Заявку прийнято.", en: "Thank you! Your request has been received." })}</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {mode === "email" ? t({ uk: "Ми напишемо вам найближчим часом.", en: "We'll write to you shortly." }) : t({ uk: "Наш менеджер зателефонує вам найближчим часом.", en: "Our manager will call you shortly." })}
          </p>
          <Button variant="outline" size="md" className="mt-2 w-full" onClick={close}>
            {t({ uk: "Готово", en: "Done" })}
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {mode === "email"
              ? t({ uk: "Залиште свій email — ми напишемо вам.", en: "Leave your email — we'll write to you." })
              : t({ uk: "Залиште свій номер — ми зателефонуємо вам.", en: "Leave your number — we'll call you." })}
          </p>

          {mode === "phone" ? (
            <div className="flex items-center rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 transition-colors focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
              <span className="select-none pl-4 pr-1 text-sm text-zinc-500 dark:text-zinc-400">+380</span>
              <input
                type="tel"
                inputMode="numeric"
                autoFocus
                aria-label={t({ uk: "Номер телефону", en: "Phone number" })}
                placeholder="67 123 45 67"
                value={formatUaPhone(phone)}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 9))}
                className="h-11 w-full rounded-r-xl bg-transparent px-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none"
              />
            </div>
          ) : (
            <input
              type="email"
              autoFocus
              aria-label={t({ uk: "Електронна пошта", en: "Email" })}
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          )}

          {error && <p className="text-sm font-medium text-red-500">{error}</p>}

          <Button type="submit" variant="primary" size="lg" loading={submitting} disabled={!valid || submitting} className="w-full">
            {mode === "email" ? t({ uk: "Надіслати", en: "Send" }) : t({ uk: "Передзвоніть мені", en: "Call me back" })}
          </Button>
        </form>
      )}
    </Modal>
  );
}
