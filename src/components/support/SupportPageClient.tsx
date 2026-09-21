"use client";

import { useState } from "react";
import { Send, PhoneCall, Check, Clock, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n";

const TELEGRAM_URL = "https://t.me/volya_finance_bot";

function formatUaPhone(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 9);
  return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(" ");
}

// Сторінка підтримки: два канали — Telegram-бот (найшвидше) і «Замовити дзвінок»
// (заявка йде менеджеру через /api/lead, як і з плаваючої кнопки звʼязку).
export function SupportPageClient() {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (phone.length !== 9) { setError(t({ uk: "Вкажіть номер телефону — 9 цифр після +380.", en: "Enter your phone number — 9 digits after +380." })); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone, name, comment, source: "Сторінка підтримки" }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.error || "error");
      setDone(true);
    } catch (err) {
      const msg = err instanceof Error && err.message !== "error" ? err.message : t({ uk: "Не вдалося надіслати заявку. Напишіть нам у Telegram.", en: "Could not send the request. Please message us on Telegram." });
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {/* Telegram */}
      <div className="flex flex-col rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-300"><Send className="h-6 w-6" /></div>
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{t({ uk: "Написати в Telegram", en: "Message us on Telegram" })}</h2>
        <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
          {t({ uk: "Найшвидший спосіб. Напишіть боту — питання одразу потрапить до менеджера, відповідь прийде в той самий чат.", en: "The fastest way. Message the bot — your question goes straight to a manager and the reply arrives in the same chat." })}
        </p>
        <ul className="mt-4 space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
          <li className="flex items-center gap-2"><MessageCircle className="h-4 w-4 shrink-0 text-sky-500" />{t({ uk: "Допоможемо оформити поліс або виправити дані", en: "Help with buying a policy or fixing details" })}</li>
          <li className="flex items-center gap-2"><Clock className="h-4 w-4 shrink-0 text-sky-500" />{t({ uk: "Зазвичай відповідаємо протягом кількох хвилин", en: "We usually reply within a few minutes" })}</li>
        </ul>
        <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className="mt-6 md:mt-auto md:pt-6">
          <Button variant="primary" size="lg" className="flex w-full items-center justify-center gap-2"><Send className="h-4 w-4" />{t({ uk: "Відкрити Telegram", en: "Open Telegram" })}</Button>
        </a>
        <p className="mt-2 text-center text-xs text-zinc-400 dark:text-zinc-500">@volya_finance_bot</p>
      </div>

      {/* Замовити дзвінок */}
      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300"><PhoneCall className="h-6 w-6" /></div>
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{t({ uk: "Замовити дзвінок", en: "Request a call" })}</h2>
        <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">{t({ uk: "Залиште номер — менеджер передзвонить і допоможе.", en: "Leave your number — a manager will call you back." })}</p>

        {done ? (
          <div className="mt-5 flex flex-col items-center gap-2 rounded-xl bg-emerald-50 px-4 py-6 text-center dark:bg-emerald-950/40">
            <Check className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            <p className="font-semibold text-emerald-800 dark:text-emerald-200">{t({ uk: "Заявку прийнято!", en: "Request received!" })}</p>
            <p className="text-sm text-emerald-700 dark:text-emerald-300">{t({ uk: "Ми зателефонуємо вам найближчим часом.", en: "We'll call you shortly." })}</p>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-5 space-y-3">
            <Input label={t({ uk: "Ваше ім'я", en: "Your name" })} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoComplete="given-name" />
            <Input label={t({ uk: "Телефон", en: "Phone" })} type="tel" inputMode="numeric" prefix="+380" value={formatUaPhone(phone)} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 9))} placeholder="67 123 45 67" required autoComplete="tel-national" />
            <div>
              <label htmlFor="support-comment" className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">{t({ uk: "Коротко про питання (необов'язково)", en: "Briefly, what's it about (optional)" })}</label>
              <textarea id="support-comment" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={500} rows={3}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-indigo-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                placeholder={t({ uk: "Напр.: не можу оплатити поліс ОСЦПВ", en: "E.g.: I can't pay for my policy" })} />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" variant="primary" size="lg" loading={busy} className="flex w-full items-center justify-center gap-2"><PhoneCall className="h-4 w-4" />{t({ uk: "Передзвоніть мені", en: "Call me back" })}</Button>
          </form>
        )}
      </div>
    </div>
  );
}
