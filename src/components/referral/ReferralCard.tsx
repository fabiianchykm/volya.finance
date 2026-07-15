"use client";

import { useState } from "react";
import { Gift, Copy, Check } from "lucide-react";
import type { ReferralSummary } from "@/lib/referral";

// Блок реферальної програми в кабінеті: посилання (копіювати), баланс бонусів,
// к-сть запрошених. Бонус = 5% від полісів друзів; знижка на наступний поліс.

export function ReferralCard({ summary }: { summary: ReferralSummary }) {
  const [copied, setCopied] = useState(false);

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
    <div className="mb-6 overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">
      <div className="flex items-center gap-3 bg-gradient-to-br from-indigo-500 to-violet-600 px-5 py-4 text-white">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
          <Gift className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-bold leading-tight">Запрошуй друзів — отримуй 5%</h2>
          <p className="text-xs text-indigo-100">Друг оформлює поліс — вам 5% бонусами на наступний</p>
        </div>
      </div>

      <div className="p-5">
        <div className="mb-4 flex gap-3">
          <div className="flex-1 rounded-xl bg-zinc-50 px-4 py-3 text-center">
            <div className="text-xl font-bold text-zinc-900">{summary.bonusTotal} грн</div>
            <div className="text-xs text-zinc-500">бонусів накопичено</div>
          </div>
          <div className="flex-1 rounded-xl bg-zinc-50 px-4 py-3 text-center">
            <div className="text-xl font-bold text-zinc-900">{summary.invitedCount}</div>
            <div className="text-xs text-zinc-500">запрошено з покупкою</div>
          </div>
        </div>

        <label className="mb-1.5 block text-xs font-medium text-zinc-500">Ваше посилання</label>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={summary.link}
            onFocus={(e) => e.currentTarget.select()}
            className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none focus:border-indigo-400"
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

        <p className="mt-3 text-xs text-zinc-400">
          Бонуси нараховуються, коли друг оформлює поліс за вашим посиланням. Застосування
          знижки на наступний поліс — за підтримки менеджера.
        </p>
      </div>
    </div>
  );
}
