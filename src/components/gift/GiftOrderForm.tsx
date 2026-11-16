"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Gift, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useI18n } from "@/lib/i18n";
import { GIFT_MAX, GIFT_MIN, GIFT_PRESETS } from "@/lib/gift-constants";
import { trackEvent } from "@/lib/analytics";

// Форма заявки на подарунковий сертифікат: номінал (пресети + своя сума), контакти
// покупця, кому дарують і привітання. Після відправки — на сторінку сертифіката.
export function GiftOrderForm() {
  const { t } = useI18n();
  const router = useRouter();
  const [preset, setPreset] = useState<number | "custom">(2000);
  const [custom, setCustom] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amount = preset === "custom" ? Number(custom.replace(/\D/g, "")) || 0 : preset;
  const amountOk = amount >= GIFT_MIN && amount <= GIFT_MAX;
  const phoneOk = phone.replace(/\D/g, "").length === 9;
  const canSubmit = amountOk && phoneOk && buyerName.trim().length >= 2 && !busy;
  const fmt = (n: number) => n.toLocaleString("uk-UA");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/gift", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amount, buyerName: buyerName.trim(), buyerPhone: phone, buyerEmail: email.trim(), recipientName: recipientName.trim(), message: message.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error ?? t({ uk: "Не вдалося надіслати заявку", en: "Could not submit the request" }));
      trackEvent("gift_request", { amount });
      router.push(`${json.url}?new=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t({ uk: "Помилка", en: "Error" }));
      setBusy(false);
    }
  };

  const chip = (active: boolean) =>
    `rounded-xl border px-3 py-3 text-center text-sm font-semibold transition-colors ${active
      ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-950/40 dark:text-indigo-300"
      : "border-zinc-200 bg-white text-zinc-700 hover:border-indigo-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"}`;

  return (
    <form onSubmit={submit} className="rounded-2xl bg-white p-5 text-left shadow-2xl dark:bg-zinc-900 sm:p-7">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{t({ uk: "Номінал сертифіката", en: "Certificate value" })}</p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {GIFT_PRESETS.map((v) => (
          <button key={v} type="button" onClick={() => setPreset(v)} className={chip(preset === v)}>{fmt(v)} ₴</button>
        ))}
        <button type="button" onClick={() => setPreset("custom")} className={chip(preset === "custom")}>{t({ uk: "Інша сума", en: "Other" })}</button>
      </div>
      {preset === "custom" && (
        <div className="mt-3">
          <Input
            label={t({ uk: `Сума, грн (від ${fmt(GIFT_MIN)} до ${fmt(GIFT_MAX)})`, en: `Amount, UAH (${fmt(GIFT_MIN)} to ${fmt(GIFT_MAX)})` })}
            type="text" inputMode="numeric" pattern="[0-9]*" value={custom}
            onChange={(e) => setCustom(e.target.value.replace(/\D/g, "").slice(0, 6))}
            error={custom && !amountOk ? t({ uk: `Від ${fmt(GIFT_MIN)} до ${fmt(GIFT_MAX)} грн`, en: `${fmt(GIFT_MIN)} to ${fmt(GIFT_MAX)} UAH` }) : undefined}
            autoFocus
          />
        </div>
      )}

      <p className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{t({ uk: "Хто дарує", en: "From" })}</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label={t({ uk: "Ваше імʼя", en: "Your name" })} value={buyerName} onChange={(e) => setBuyerName(e.target.value)} required autoComplete="name" />
        <Input label={t({ uk: "Телефон", en: "Phone" })} prefix="+380" type="tel" inputMode="numeric" value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 9))} placeholder="67 123 45 67" required autoComplete="tel-national" />
        <div className="sm:col-span-2">
          <Input label={t({ uk: "Email (необовʼязково)", en: "Email (optional)" })} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </div>
      </div>

      <p className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{t({ uk: "Кому дарують", en: "To" })}</p>
      <div className="grid grid-cols-1 gap-4">
        <Input label={t({ uk: "Імʼя одержувача (необовʼязково)", en: "Recipient name (optional)" })} value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="gift-message">{t({ uk: "Привітання на сертифікаті (необовʼязково)", en: "Greeting on the certificate (optional)" })}</label>
          <textarea id="gift-message" value={message} onChange={(e) => setMessage(e.target.value.slice(0, 300))} rows={3}
            placeholder={t({ uk: "Наприклад: «З днем народження! Нехай дорога буде безпечною»", en: "For example: “Happy birthday! Safe travels”" })}
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition-colors focus:border-indigo-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
          <p className="mt-1 text-right text-xs text-zinc-400">{message.length}/300</p>
        </div>
      </div>

      {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>}

      <div className="mt-6 border-t border-zinc-100 pt-5 dark:border-zinc-800">
        <div className="mb-4 flex items-baseline justify-between">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">{t({ uk: "Сертифікат на", en: "Certificate for" })}</span>
          <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{amountOk ? `${fmt(amount)} ₴` : "—"}</span>
        </div>
        <Button type="submit" variant="primary" size="lg" className="w-full" loading={busy} disabled={!canSubmit}>
          <Gift className="h-5 w-5" /> {t({ uk: "Замовити сертифікат", en: "Order the certificate" })} <ArrowRight className="h-5 w-5" />
        </Button>
        <p className="mt-3 text-center text-xs text-zinc-500 dark:text-zinc-400">
          {t({ uk: "Оплата переказом на рахунок. Менеджер звʼяжеться з вами, а після оплати сертифікат стане активним.", en: "Payment by bank transfer. A manager will contact you; the certificate becomes active once paid." })}
        </p>
      </div>
    </form>
  );
}
