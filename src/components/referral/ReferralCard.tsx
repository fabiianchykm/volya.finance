"use client";

import { useState } from "react";
import { Wallet, Copy, Check, History, ChevronDown, ArrowDownLeft, ArrowUpRight, Clock } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useI18n, type Tr } from "@/lib/i18n";
import type { ReferralSummary } from "@/lib/referral";
import type { BonusHistoryItem } from "@/lib/bonus";

const PRODUCT: Record<string, Tr> = {
  osago: { uk: "Автоцивілка", en: "Car insurance" }, kasko: { uk: "КАСКО", en: "CASCO" }, minikasko: { uk: "Міні-КАСКО", en: "Mini CASCO" },
  greencard: { uk: "Зелена карта", en: "Green Card" }, tourism: { uk: "Туристичне", en: "Travel" }, pets: { uk: "Тварини", en: "Pets" },
  home: { uk: "Житло", en: "Home" }, accident: { uk: "Нещасний випадок", en: "Accident" },
};
const SHOWN_AT_FIRST = 5;

function fmtDate(iso: string, locale: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString(locale === "en" ? "en-GB" : "uk-UA", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// Єдиний бонусний рахунок у кабінеті: загальний баланс (1% з покупок + 5% з
// рефералів), розбивка, посилання для запрошень і к-сть запрошених.

export function ReferralCard({ summary }: { summary: ReferralSummary }) {
  const { t, lang } = useI18n();
  const [copied, setCopied] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const { balance, history } = summary;
  const visible = showAll ? history : history.slice(0, SHOWN_AT_FIRST);

  // Заголовок і підпис рядка історії: що за рух і за який поліс.
  const describe = (h: BonusHistoryItem): { title: string; sub: string } => {
    const product = h.policy?.product ? t(PRODUCT[h.policy.product] ?? { uk: "Поліс", en: "Policy" }) : "";
    const policyLine = [product, h.policy?.company, h.policy?.plate].filter(Boolean).join(" · ");
    switch (h.kind) {
      case "purchase":
        return { title: t({ uk: "1% за ваш поліс", en: "1% for your policy" }), sub: policyLine || (h.policy?.customerName ?? "") };
      case "referral":
        return { title: t({ uk: "5% за поліс друга", en: "5% for a friend's policy" }), sub: h.friend ?? "" };
      case "redeem":
        return { title: t({ uk: "Списано як знижку", en: "Redeemed as a discount" }), sub: policyLine };
      case "held":
        return { title: t({ uk: "Зарезервовано під заявку", en: "Reserved for a pending order" }), sub: policyLine || t({ uk: "Повернеться, якщо поліс не оплатять протягом доби", en: "Returned if the policy is not paid within a day" }) };
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summary.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard недоступний — тихо ігноруємо
    }
  };

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-indigo-100 dark:border-indigo-900 bg-white dark:bg-zinc-900 shadow-sm">
      {/* Баланс бонусного рахунку */}
      <div className="bg-gradient-to-br from-indigo-500 to-violet-600 px-5 py-5 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-indigo-100">{t({ uk: "Бонусний рахунок", en: "Bonus account" })}</p>
            <p className="text-2xl font-bold leading-tight">{formatPrice(balance.total)}</p>
          </div>
        </div>
      </div>

      {/* Запрошення друзів */}
      <div className="p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{t({ uk: "Запрошуй друзів — отримуй 5%", en: "Invite friends — get 5%" })}</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{t({ uk: "Друг оформлює поліс — вам 5% на бонусний рахунок", en: "A friend buys a policy — you get 5% to your bonus account" })}</p>
          </div>
          <div className="shrink-0 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 px-3 py-1.5 text-center">
            <div className="text-base font-bold text-zinc-900 dark:text-zinc-100">{summary.invitedCount}</div>
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400">{t({ uk: "запрошено", en: "invited" })}</div>
          </div>
        </div>

        <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">{t({ uk: "Ваше посилання", en: "Your link" })}</label>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={summary.link}
            aria-label={t({ uk: "Ваше реферальне посилання", en: "Your referral link" })}
            onFocus={(e) => e.currentTarget.select()}
            className="h-11 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-sm text-zinc-700 dark:text-zinc-200 outline-none focus:border-indigo-400"
          />
          <button
            type="button"
            onClick={copy}
            className="flex h-11 shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? t({ uk: "Скопійовано", en: "Copied" }) : t({ uk: "Копіювати", en: "Copy" })}
          </button>
        </div>

        <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
          {t({ uk: "На рахунок нараховується 1% від кожної вашої покупки та 5% від покупок запрошених друзів. Бонуси списуються як знижка при оформленні автоцивілки.", en: "Your account earns 1% of each of your purchases and 5% of purchases by friends you invited. Bonuses are redeemed as a discount when buying car insurance." })}
        </p>
      </div>

      {/* Історія руху по рахунку */}
      <div className="border-t border-zinc-100 dark:border-zinc-800 p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-100">
            <History className="h-4 w-4 text-indigo-500" />
            {t({ uk: "Історія нарахувань", en: "Bonus history" })}
          </h2>
          {(balance.purchase > 0 || balance.referral > 0) && (
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {t({ uk: "Нараховано", en: "Earned" })} {formatPrice(balance.purchase + balance.referral)}
              {balance.redeemed > 0 ? ` · ${t({ uk: "списано", en: "redeemed" })} ${formatPrice(balance.redeemed)}` : ""}
            </p>
          )}
        </div>
        {history.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 px-4 py-5 text-center text-xs text-zinc-500 dark:text-zinc-400">
            {t({ uk: "Поки що порожньо. Перше нарахування зʼявиться після оформлення поліса.", en: "Nothing yet. The first entry appears after you buy a policy." })}
          </p>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {visible.map((h) => {
              const d = describe(h);
              const positive = h.amount > 0;
              const pending = h.kind === "held";
              return (
                <li key={h.id} className="flex items-center gap-3 py-2.5">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${pending ? "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400" : positive ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"}`}>
                    {pending ? <Clock className="h-4 w-4" /> : positive ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{d.title}</p>
                    <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{[fmtDate(h.createdAt, lang), d.sub].filter(Boolean).join(" · ")}</p>
                  </div>
                  <span className={`shrink-0 text-sm font-semibold tabular-nums ${pending ? "text-amber-600 dark:text-amber-400" : positive ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-700 dark:text-zinc-300"}`}>
                    {positive ? "+" : "−"}{formatPrice(Math.abs(h.amount))}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        {history.length > SHOWN_AT_FIRST && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="mt-2 flex w-full items-center justify-center gap-1 rounded-xl py-2 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40"
          >
            {showAll ? t({ uk: "Згорнути", en: "Show less" }) : t({ uk: `Показати всі (${history.length})`, en: `Show all (${history.length})` })}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showAll ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>
    </div>
  );
}
