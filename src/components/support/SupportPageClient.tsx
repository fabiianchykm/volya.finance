"use client";

import { useState } from "react";
import { Send, PhoneCall, Check, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n";

const TELEGRAM_URL = "https://t.me/volya_finance_bot";
// Viber — без бота: пряме посилання відкриває чат із номером підтримки в застосунку.
const VIBER_NUMBER = "+380965092400";
const VIBER_URL = `viber://chat?number=${encodeURIComponent(VIBER_NUMBER)}`;
// Усі три дії — однакові кнопки (індиго), щоб картки читались як один ряд.
const BTN = "flex h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl !bg-indigo-600 text-white hover:!bg-indigo-700";

function formatUaPhone(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 9);
  return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(" ");
}

// Три однакові за структурою картки: іконка → заголовок → один рядок → дія.
function Card({ icon, tone, title, text, children }: { icon: React.ReactNode; tone: string; title: string; text: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${tone}`}>{icon}</div>
      <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{text}</p>
      <div className="mt-auto pt-7">{children}</div>
    </div>
  );
}

// Сторінка підтримки: Telegram-бот, Viber за номером, «Замовити дзвінок»
// (заявка йде менеджеру через /api/lead, як і з плаваючої кнопки звʼязку).
export function SupportPageClient() {
  const { t } = useI18n();
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (phone.length !== 9) { setError(t({ uk: "Введіть 9 цифр номера після +380.", en: "Enter the 9 digits after +380." })); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone, source: "Сторінка підтримки" }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.error || "error");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error && err.message !== "error" ? err.message : t({ uk: "Не вдалося надіслати. Напишіть нам у Telegram або Viber.", en: "Could not send. Please message us on Telegram or Viber." }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-5 md:grid-cols-3">
      <Card
        icon={<Send className="h-6 w-6" />}
        tone="bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-300"
        title="Telegram"
        text={t({ uk: "Найшвидший спосіб: питання одразу потрапляє до менеджера.", en: "The fastest way: your question goes straight to a manager." })}
      >
        <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer">
          <Button variant="primary" size="lg" className={BTN}><Send className="h-4 w-4 shrink-0" />{t({ uk: "Відкрити Telegram", en: "Open Telegram" })}</Button>
        </a>
      </Card>

      <Card
        icon={<MessageCircle className="h-6 w-6" />}
        tone="bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300"
        title="Viber"
        text={t({ uk: "Чат із менеджером за номером +380 96 509 24 00.", en: "Chat with a manager at +380 96 509 24 00." })}
      >
        <a href={VIBER_URL}>
          <Button variant="primary" size="lg" className={BTN}><MessageCircle className="h-4 w-4 shrink-0" />{t({ uk: "Відкрити Viber", en: "Open Viber" })}</Button>
        </a>
      </Card>

      <Card
        icon={<PhoneCall className="h-6 w-6" />}
        tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300"
        title={t({ uk: "Дзвінок", en: "Call back" })}
        text={t({ uk: "Залиште номер — менеджер передзвонить.", en: "Leave your number — a manager will call you back." })}
      >
        {done ? (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            <Check className="h-4 w-4 shrink-0" />{t({ uk: "Прийнято — зателефонуємо найближчим часом.", en: "Received — we'll call you shortly." })}
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <Input type="tel" inputMode="numeric" prefix="+380" className="h-12" value={formatUaPhone(phone)} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 9))} placeholder="67 123 45 67" aria-label={t({ uk: "Номер телефону", en: "Phone number" })} required autoComplete="tel-national" />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <Button type="submit" variant="primary" size="lg" loading={busy} className={BTN}><PhoneCall className="h-4 w-4 shrink-0" />{t({ uk: "Замовити дзвінок", en: "Request a call" })}</Button>
          </form>
        )}
      </Card>
    </div>
  );
}
