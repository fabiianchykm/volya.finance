"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Gift, ArrowRight, Check, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useI18n } from "@/lib/i18n";
import { GIFT_MAX, GIFT_MIN, GIFT_PRESETS, GIFT_LAUNCH_LABEL, GIFT_VALID_MONTHS, isGiftLaunched } from "@/lib/gift-constants";
import { trackEvent } from "@/lib/analytics";

// Вибір сертифіката: великі картки-номінали у вигляді подарункової картки прямо на
// темному тлі + коротка заявка (лише телефон). До старту продажів (1 січня 2027)
// картки показуються як вітрина, форми нема.

// Свій відтінок на кожен номінал, щоб картки читались як набір, а не як копії.
const CARD_BG: Record<number | "custom", string> = {
  1000: "linear-gradient(135deg, #1e1b4b 0%, #4338ca 55%, #6366f1 100%)",
  2000: "linear-gradient(135deg, #2e1065 0%, #6d28d9 55%, #a78bfa 100%)",
  4000: "linear-gradient(135deg, #0c4a6e 0%, #0369a1 50%, #4f46e5 100%)",
  10000: "linear-gradient(135deg, #0b0a1f 0%, #1e1060 55%, #7c3aed 100%)",
  custom: "linear-gradient(135deg, #312e81 0%, #4f46e5 50%, #c084fc 100%)",
};

export function GiftOrderForm() {
  const { t } = useI18n();
  const router = useRouter();
  const launched = isGiftLaunched();
  const [preset, setPreset] = useState<number | "custom">(2000);
  const [custom, setCustom] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const title = t({ uk: "Подарунковий сертифікат", en: "Gift certificate" });
  const sub = t({ uk: "на будь-яке страхування", en: "for any insurance" });
  const valid = t({ uk: `${GIFT_VALID_MONTHS} міс.`, en: `${GIFT_VALID_MONTHS} mo.` });

  return (
    <form onSubmit={submit}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GIFT_PRESETS.map((v) => (
          <GiftCard key={v} bg={CARD_BG[v]} selectable={launched} selected={launched && preset === v} onClick={() => setPreset(v)} title={title} sub={sub} valid={valid} premium={v >= 10000}>
            {fmt(v)}<span className="ml-1.5 text-2xl font-semibold opacity-70 sm:text-3xl">₴</span>
          </GiftCard>
        ))}
        {/* Своя сума — картка на дві колонки (у ряд з 10 000) */}
        <div className="sm:col-span-2 lg:col-span-2 lg:h-full">
          <GiftCard bg={CARD_BG.custom} className="sm:aspect-[3.6/1] lg:aspect-auto lg:h-full" selectable={launched} selected={launched && preset === "custom"} onClick={() => setPreset("custom")} title={title} sub={t({ uk: `своя сума від ${fmt(GIFT_MIN)} до ${fmt(GIFT_MAX)} ₴`, en: `your amount, ${fmt(GIFT_MIN)} to ${fmt(GIFT_MAX)} UAH` })} valid={valid}>
            {launched && preset === "custom" ? (
              <span className="flex items-baseline gap-2">
                <input
                  type="text" inputMode="numeric" pattern="[0-9]*" value={custom} autoFocus
                  onChange={(e) => setCustom(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="3 000"
                  aria-label={t({ uk: "Своя сума, грн", en: "Your amount, UAH" })}
                  className="w-44 rounded-xl border border-white/30 bg-white/15 px-3 py-1 text-4xl font-bold tracking-tight text-white placeholder:text-white/40 outline-none focus:border-white/70"
                />
                <span className="text-2xl font-semibold opacity-70">₴</span>
              </span>
            ) : (
              <>{t({ uk: "Інша сума", en: "Other amount" })}</>
            )}
          </GiftCard>
          {launched && preset === "custom" && custom && !amountOk && (
            <p className="mt-1.5 text-xs text-red-300">{t({ uk: `Сума від ${fmt(GIFT_MIN)} до ${fmt(GIFT_MAX)} грн`, en: `${fmt(GIFT_MIN)} to ${fmt(GIFT_MAX)} UAH` })}</p>
          )}
        </div>
      </div>

      {launched ? (
        <div className="mt-6 rounded-2xl bg-white p-5 shadow-2xl dark:bg-zinc-900 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <Input label={t({ uk: "Ваш телефон", en: "Your phone" })} prefix="+380" type="tel" inputMode="numeric" value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 9))} placeholder="67 123 45 67" required autoComplete="tel-national" />
            <Button type="submit" variant="primary" size="lg" className="w-full sm:w-auto" loading={busy} disabled={!canSubmit}>
              <Gift className="h-5 w-5" /> {t({ uk: "Замовити", en: "Order" })}{amountOk ? ` · ${fmt(amount)} ₴` : ""} <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
          {error && <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>}
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
            {t({ uk: "Менеджер зателефонує, уточнить деталі й надішле реквізити для переказу. Після оплати сертифікат стане активним, а ви отримаєте посилання, яке можна подарувати.", en: "A manager will call you, confirm the details and send transfer details. Once paid, the certificate becomes active and you get a link to give." })}
          </p>
        </div>
      ) : (
        <p className="mx-auto mt-6 flex w-fit items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-indigo-100 ring-1 ring-white/15">
          <CalendarClock className="h-4 w-4 text-indigo-300" />
          {t({ uk: `Замовлення відкриємо ${GIFT_LAUNCH_LABEL.uk}`, en: `Orders open on ${GIFT_LAUNCH_LABEL.en}` })}
        </p>
      )}
    </form>
  );
}

// Картка як справжня подарункова: вордмарк, велика сума, підпис, строк дії.
function GiftCard({ bg, selectable, selected, onClick, title, sub, valid, premium, className = "", children }: {
  bg: string; selectable: boolean; selected: boolean; onClick: () => void;
  title: string; sub: string; valid: string; premium?: boolean; className?: string; children: React.ReactNode;
}) {
  const Tag = selectable ? "button" : "div";
  return (
    <Tag
      {...(selectable ? { type: "button" as const, onClick, "aria-pressed": selected } : {})}
      className={`group relative block aspect-[1.75/1] w-full overflow-hidden rounded-2xl p-5 text-left text-white shadow-xl shadow-black/30 transition-all sm:p-6 ${className} ${selectable ? "cursor-pointer" : ""} ${selected ? "ring-4 ring-white/80 ring-offset-2 ring-offset-[#1e1060] scale-[1.01]" : selectable ? "hover:-translate-y-0.5 hover:shadow-2xl" : ""}`}
      style={{ backgroundImage: bg }}
    >
      {/* декор: мʼяке світло + великий напівпрозорий подарунок */}
      <span className="pointer-events-none absolute -right-10 -top-14 h-48 w-48 rounded-full bg-white/15 blur-2xl" />
      <span className="pointer-events-none absolute -bottom-16 -left-8 h-40 w-40 rounded-full bg-black/20 blur-2xl" />
      <Gift className="pointer-events-none absolute -bottom-4 right-4 h-28 w-28 text-white/10 sm:h-32 sm:w-32" strokeWidth={1} />
      {selected && <span className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-white text-indigo-700 shadow"><Check className="h-4 w-4" /></span>}

      <span className="relative flex h-full flex-col justify-between">
        <span className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">VOLYA<span className="text-white/50">.finance</span></span>
          {!selected && <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/80 ring-1 ring-white/20">{valid}</span>}
        </span>
        <span className={`block text-4xl font-bold leading-none tracking-tight sm:text-5xl ${premium ? "text-amber-100" : ""}`}>{children}</span>
        <span className="block">
          <span className="block text-sm font-semibold">{title}</span>
          <span className="block text-xs text-white/70">{sub}</span>
        </span>
      </span>
    </Tag>
  );
}
