"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Gift, ArrowRight, Check, Bell, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useI18n } from "@/lib/i18n";
import { GIFT_MAX, GIFT_MIN, GIFT_PRESETS, GIFT_LAUNCH_LABEL, isGiftLaunched } from "@/lib/gift-constants";
import { trackEvent } from "@/lib/analytics";

// Заявка на подарунковий сертифікат — максимально коротка: обрати картку-номінал
// (або вписати свою суму) і лишити телефон. Імена й привітання не питаємо: менеджер
// усе уточнить при дзвінку, а сторінка сертифіката однаково іменна за кодом.
export function GiftOrderForm() {
  const { t } = useI18n();
  const router = useRouter();
  const [preset, setPreset] = useState<number | "custom">(2000);
  const [custom, setCustom] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reminded, setReminded] = useState(false);
  const launched = isGiftLaunched();

  const amount = preset === "custom" ? Number(custom.replace(/\D/g, "")) || 0 : preset;
  const amountOk = amount >= GIFT_MIN && amount <= GIFT_MAX;
  const phoneOk = phone.replace(/\D/g, "").length === 9;
  const canSubmit = amountOk && phoneOk && !busy;
  const fmt = (n: number) => n.toLocaleString("uk-UA");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/gift", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amount, buyerPhone: phone }),
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

  // До старту: «Нагадати мені» — звичайний лід у sales-Telegram з поміткою сертифіката.
  const remind = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneOk || busy) return;
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone, source: "gift-waitlist", comment: `Подарунковий сертифікат${amountOk ? ` ${fmt(amount)} ₴` : ""} — нагадати про старт ${GIFT_LAUNCH_LABEL.uk}` }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error ?? t({ uk: "Не вдалося надіслати", en: "Could not send" }));
      trackEvent("gift_waitlist", { amount });
      setReminded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t({ uk: "Помилка", en: "Error" }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={launched ? submit : remind} className="rounded-2xl bg-white p-5 text-left shadow-2xl dark:bg-zinc-900 sm:p-7">
      {!launched && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-indigo-100 bg-indigo-50/70 px-4 py-3 text-sm text-indigo-900 dark:border-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-100">
          <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
          <p>{t({ uk: `Подарункові сертифікати стартують ${GIFT_LAUNCH_LABEL.uk}. Оберіть номінал і лишіть телефон — нагадаємо в день старту.`, en: `Gift certificates launch on ${GIFT_LAUNCH_LABEL.en}. Pick a value and leave your phone — we'll remind you on launch day.` })}</p>
        </div>
      )}
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{t({ uk: "Оберіть сертифікат", en: "Choose a certificate" })}</p>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {GIFT_PRESETS.map((v) => (
          <GiftCard key={v} selected={preset === v} onClick={() => setPreset(v)} label={t({ uk: "Подарунковий сертифікат", en: "Gift certificate" })} sub={t({ uk: "на будь-яке страхування", en: "for any insurance" })}>
            <span className="text-3xl font-bold tracking-tight sm:text-4xl">{fmt(v)}</span>
            <span className="ml-1 text-lg font-semibold text-indigo-200">₴</span>
          </GiftCard>
        ))}
        <div className="col-span-2 lg:col-span-4">
          <GiftCard selected={preset === "custom"} onClick={() => setPreset("custom")} label={t({ uk: "Подарунковий сертифікат", en: "Gift certificate" })} sub={t({ uk: `своя сума від ${fmt(GIFT_MIN)} до ${fmt(GIFT_MAX)} ₴`, en: `your amount, ${fmt(GIFT_MIN)} to ${fmt(GIFT_MAX)} UAH` })} wide>
            {preset === "custom" ? (
              <span className="flex items-baseline gap-2">
                <input
                  type="text" inputMode="numeric" pattern="[0-9]*" value={custom} autoFocus
                  onChange={(e) => setCustom(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="3 000"
                  aria-label={t({ uk: "Своя сума, грн", en: "Your amount, UAH" })}
                  className="w-36 rounded-xl border border-white/30 bg-white/15 px-3 py-1.5 text-3xl font-bold tracking-tight text-white placeholder:text-white/40 outline-none focus:border-white/70 sm:text-4xl"
                />
                <span className="text-lg font-semibold text-indigo-200">₴</span>
              </span>
            ) : (
              <span className="text-2xl font-bold tracking-tight sm:text-3xl">{t({ uk: "Інша сума", en: "Other amount" })}</span>
            )}
          </GiftCard>
          {preset === "custom" && custom && !amountOk && (
            <p className="mt-1.5 text-xs text-red-500">{t({ uk: `Сума від ${fmt(GIFT_MIN)} до ${fmt(GIFT_MAX)} грн`, en: `${fmt(GIFT_MIN)} to ${fmt(GIFT_MAX)} UAH` })}</p>
          )}
        </div>
      </div>

      {reminded ? (
        <p className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
          {t({ uk: `Дякуємо! Нагадаємо ${GIFT_LAUNCH_LABEL.uk}.`, en: `Thank you! We'll remind you on ${GIFT_LAUNCH_LABEL.en}.` })}
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <Input label={t({ uk: "Ваш телефон", en: "Your phone" })} prefix="+380" type="tel" inputMode="numeric" value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 9))} placeholder="67 123 45 67" required autoComplete="tel-national" />
          {launched ? (
            <Button type="submit" variant="primary" size="lg" className="w-full sm:w-auto" loading={busy} disabled={!canSubmit}>
              <Gift className="h-5 w-5" /> {t({ uk: "Замовити", en: "Order" })}{amountOk ? ` · ${fmt(amount)} ₴` : ""} <ArrowRight className="h-5 w-5" />
            </Button>
          ) : (
            <Button type="submit" variant="primary" size="lg" className="w-full sm:w-auto" loading={busy} disabled={!phoneOk || busy}>
              <Bell className="h-5 w-5" /> {t({ uk: "Нагадати мені", en: "Remind me" })}
            </Button>
          )}
        </div>
      )}
      {error && <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>}
      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
        {launched
          ? t({ uk: "Менеджер зателефонує, уточнить деталі й надішле реквізити для переказу. Після оплати сертифікат стане активним, а ви отримаєте посилання, яке можна подарувати.", en: "A manager will call you, confirm the details and send transfer details. Once paid, the certificate becomes active and you get a link to give." })
          : t({ uk: "Оплата переказом на рахунок, сертифікат діє 12 місяців і підходить для будь-якого полісу на volya.finance.", en: "Paid by bank transfer, valid for 12 months and good for any policy on volya.finance." })}
      </p>
    </form>
  );
}

// Картка-номінал у вигляді самого сертифіката (той самий градієнт, що й на /gift/<код>).
function GiftCard({ selected, onClick, label, sub, wide, children }: { selected: boolean; onClick: () => void; label: string; sub: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button" onClick={onClick} aria-pressed={selected}
      className={`relative w-full overflow-hidden rounded-2xl p-4 text-left text-white shadow-md transition-all ${wide ? "min-h-[96px]" : "aspect-[1.6/1]"} ${selected ? "ring-4 ring-indigo-300 ring-offset-2 dark:ring-offset-zinc-900" : "opacity-90 hover:opacity-100 hover:shadow-lg"}`}
      style={{ backgroundImage: "linear-gradient(135deg, #0f0c29, #1e1060, #4f46e5, #7c3aed)" }}
    >
      <span className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-xl" />
      {selected && <span className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-indigo-700"><Check className="h-3.5 w-3.5" /></span>}
      <span className={`flex h-full ${wide ? "flex-col gap-2 sm:flex-row sm:items-center sm:justify-between" : "flex-col justify-between"}`}>
        <span>
          <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-200">VOLYA.finance</span>
          <span className="block text-[11px] text-indigo-100">{label}</span>
        </span>
        <span className="block">
          <span className="block leading-none">{children}</span>
          <span className="mt-1 block text-[11px] text-indigo-200">{sub}</span>
        </span>
      </span>
    </button>
  );
}
