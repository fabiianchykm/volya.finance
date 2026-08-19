"use client";

import { useEffect, useState } from "react";
import { Loader2, Calculator, ClipboardList, BadgeCheck } from "lucide-react";

interface FunnelRow {
  product: string; label: string;
  calcRuns: number; calcVisitors: number; leads: number; policies: number;
}
interface Totals { calc: number; leads: number; policies: number }

const pct = (a: number, b: number) => (b > 0 ? `${((a / b) * 100).toFixed(1)}%` : "—");

export function AdminFunnel() {
  const [rows, setRows] = useState<FunnelRow[]>([]);
  const [totals, setTotals] = useState<Totals>({ calc: 0, leads: 0, policies: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/funnel");
        const json = await res.json();
        if (!json.success) throw new Error(json.error ?? "Помилка");
        setRows(json.rows ?? []);
        setTotals(json.totals ?? { calc: 0, leads: 0, policies: 0 });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Помилка");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400"><Loader2 className="h-4 w-4 animate-spin" /> Завантаження…</div>;
  if (error) return <p className="text-sm text-red-500">{error}</p>;

  const stages = [
    { key: "calc", label: "Прорахунки", value: totals.calc, Icon: Calculator, hint: "натиснули «Розрахувати»" },
    { key: "leads", label: "Почали оформлення", value: totals.leads, Icon: ClipboardList, hint: "дійшли до OTP/оплати" },
    { key: "policies", label: "Купили поліс", value: totals.policies, Icon: BadgeCheck, hint: "оформлений поліс" },
  ];

  return (
    <div className="space-y-6">
      {/* Загальна воронка */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {stages.map((s, i) => {
          const prev = i === 0 ? null : stages[i - 1].value;
          return (
            <div key={s.key} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
              <div className="mb-2 flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                <s.Icon className="h-4 w-4" />
                <span className="text-xs font-medium">{s.label}</span>
              </div>
              <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{s.value}</p>
              <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">{s.hint}</p>
              {prev != null && (
                <p className="mt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  {pct(s.value, prev)} <span className="font-normal text-zinc-400 dark:text-zinc-500">від попереднього</span>
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* По продуктах */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Продукт</th>
              <th className="px-4 py-3 font-medium text-center">Прорахунки</th>
              <th className="px-4 py-3 font-medium text-center">Оформлення</th>
              <th className="px-4 py-3 font-medium text-center">Купили</th>
              <th className="px-4 py-3 font-medium text-center">Розрах.→Купівля</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {rows.map((r) => (
              <tr key={r.product}>
                <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100 whitespace-nowrap">{r.label}</td>
                <td className="px-4 py-3 text-center text-zinc-600 dark:text-zinc-300 tabular-nums">{r.calcRuns}<span className="text-[11px] text-zinc-400 dark:text-zinc-500"> · {r.calcVisitors} унік.</span></td>
                <td className="px-4 py-3 text-center text-zinc-600 dark:text-zinc-300 tabular-nums">{r.leads}</td>
                <td className="px-4 py-3 text-center text-zinc-600 dark:text-zinc-300 tabular-nums">{r.policies}</td>
                <td className="px-4 py-3 text-center text-zinc-500 dark:text-zinc-400 tabular-nums">{pct(r.policies, r.calcRuns)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-zinc-400 dark:text-zinc-500">
        Прорахунки — з калькулятора; оформлення — хто дійшов до OTP/оплати (таблиця лідів); купили — оформлені поліси. Дані за весь час.
      </p>
    </div>
  );
}
