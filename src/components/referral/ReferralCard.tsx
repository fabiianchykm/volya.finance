"use client";

import { useState } from "react";
import { Wallet, Copy, Check } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { ReferralSummary } from "@/lib/referral";

// Єдиний бонусний рахунок у кабінеті: загальний баланс (1% з покупок + 5% з
// рефералів), розбивка, посилання для запрошень і к-сть запрошених.

export function ReferralCard({ summary }: { summary: ReferralSummary }) {
  const [copied, setCopied] = useState(false);
  const { balance } = summary;

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
            <p className="text-xs font-medium text-indigo-100">Бонусний рахунок</p>
            <p className="text-2xl font-bold leading-tight">{formatPrice(balance.total)}</p>
          </div>
        </div>
      </div>

      {/* Запрошення друзів */}
      <div className="p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Запрошуй друзів — отримуй 5%</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Друг оформлює поліс — вам 5% на бонусний рахунок</p>
          </div>
          <div className="shrink-0 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 px-3 py-1.5 text-center">
            <div className="text-base font-bold text-zinc-900 dark:text-zinc-100">{summary.invitedCount}</div>
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400">запрошено</div>
          </div>
        </div>

        <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Ваше посилання</label>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={summary.link}
            onFocus={(e) => e.currentTarget.select()}
            className="h-11 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-sm text-zinc-700 dark:text-zinc-200 outline-none focus:border-indigo-400"
          />
          <button
            type="button"
            onClick={copy}
            className="flex h-11 shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Скопійовано" : "Копіювати"}
          </button>
        </div>

        <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
          На рахунок нараховується 1% від кожної вашої покупки та 5% від покупок запрошених друзів.
          Застосування бонусів — за підтримки менеджера.
        </p>
      </div>
    </div>
  );
}
