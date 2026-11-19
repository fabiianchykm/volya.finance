"use client";

import { CreditCard, CalendarRange, Check } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { installmentState, INSTALLMENT_NO_DISCOUNTS } from "@/lib/installment";
import { trackEvent } from "@/lib/analytics";

// Вибір способу оплати на кроці оплати: «Карткою онлайн» (активний) і «Частинами»
// (активна, коли INSTALLMENT_ENABLED; інакше «скоро»). Показується лише
// для пропозицій з правом на розстрочку й сумою ≥ INSTALLMENT_MIN (див. lib/installment).

export type PayMethod = "card" | "installment";

export function PaymentMethods({ product, amount, eligible, className = "", value = "card", onChange }: {
  product?: string | null; amount: number;
  /** Чи має ця пропозиція право на розстрочку (дорожча з пари у страхової зі списку). */
  eligible: boolean;
  className?: string;
  /** Обраний спосіб (керований ззовні, щоб чекаут міг обнулити бонуси при розстрочці). */
  value?: PayMethod;
  onChange?: (m: PayMethod) => void;
}) {
  const { t } = useI18n();
  const state = installmentState(amount, eligible);
  if (!state) return null;
  const soon = state === "soon";
  const cardSel = value === "card" || soon;
  const instSel = value === "installment" && !soon;

  return (
    <div className={className}>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{t({ uk: "Спосіб оплати", en: "Payment method" })}</p>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" role="radio" aria-checked={cardSel} onClick={() => onChange?.("card")} className={`relative flex flex-col gap-1 rounded-xl bg-white px-3 py-2.5 text-left dark:bg-zinc-900 ${cardSel ? "border-2 border-indigo-500" : "border border-zinc-200 hover:border-indigo-300 dark:border-zinc-700"}`}>
          {cardSel && <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-white"><Check className="h-3 w-3" /></span>}
          <CreditCard className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{t({ uk: "Карткою", en: "By card" })}</span>
          <span className="text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">{t({ uk: "Visa, Mastercard, Apple / Google Pay", en: "Visa, Mastercard, Apple / Google Pay" })}</span>
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={instSel}
          aria-disabled={soon}
          onClick={() => { trackEvent("installment_interest", { product: product ?? "osago", amount: Math.round(amount) }); if (!soon) onChange?.("installment"); }}
          title={soon ? t({ uk: "Оплату частинами додамо незабаром", en: "Instalments are coming soon" }) : undefined}
          className={`relative flex flex-col gap-1 rounded-xl px-3 py-2.5 text-left transition-colors ${
            soon ? "cursor-default border border-dashed border-zinc-300 bg-zinc-50/60 dark:border-zinc-700 dark:bg-zinc-800/40"
              : instSel ? "border-2 border-indigo-500 bg-white dark:bg-zinc-900" : "border border-zinc-200 bg-white hover:border-indigo-300 dark:border-zinc-700 dark:bg-zinc-900"
          }`}
        >
          {soon && <span className="absolute right-2 top-2 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">{t({ uk: "скоро", en: "soon" })}</span>}
          {instSel && <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-white"><Check className="h-3 w-3" /></span>}
          <CalendarRange className={`h-4 w-4 ${soon ? "text-zinc-400" : "text-indigo-600 dark:text-indigo-400"}`} />
          <span className={`text-sm font-semibold ${soon ? "text-zinc-500 dark:text-zinc-400" : "text-zinc-900 dark:text-zinc-100"}`}>{t({ uk: "Частинами", en: "Instalments" })}</span>
          <span className="text-[11px] leading-snug text-zinc-400 dark:text-zinc-500">
            {INSTALLMENT_NO_DISCOUNTS ? t({ uk: "Повна вартість, без бонусів і промокоду", en: "Full price, no bonuses or promo codes" }) : t({ uk: "Розстрочка від банку", en: "Bank instalments" })}
          </span>
        </button>
      </div>
    </div>
  );
}
