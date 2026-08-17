"use client";

import { useEffect, useState } from "react";
import { Loader2, Calculator } from "lucide-react";

interface CalcLead {
  id: number;
  product: string;
  paramKey: string;
  params: Record<string, unknown> | null;
  visitor: string;
  count: number;
  createdAt: string;
  updatedAt: string;
}
interface CalcStat { product: string; runs: number; visitors: number }

const PRODUCT_LABEL: Record<string, string> = {
  osago: "Автоцивілка", kasko: "КАСКО", "mini-kasko": "Міні-КАСКО",
  greencard: "Зелена карта", tourism: "Туристичне", pets: "Тварини", housing: "Житло",
};
const label = (p: string) => PRODUCT_LABEL[p] ?? p;

function fmtParams(params: Record<string, unknown> | null): string {
  if (!params) return "—";
  return Object.entries(params)
    .filter(([, v]) => v !== "" && v != null)
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join(" · ");
}

export function AdminCalculations() {
  const [leads, setLeads] = useState<CalcLead[]>([]);
  const [stats, setStats] = useState<CalcStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/calculations");
        const json = await res.json();
        if (!json.success) throw new Error(json.error ?? "Помилка");
        setLeads(json.leads ?? []);
        setStats(json.stats ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Помилка");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400"><Loader2 className="h-4 w-4 animate-spin" /> Завантаження…</div>;
  }
  if (error) return <p className="text-sm text-red-500">{error}</p>;

  const totalRuns = stats.reduce((s, x) => s + x.runs, 0);
  const totalVisitors = stats.reduce((s, x) => s + x.visitors, 0);

  return (
    <div className="space-y-6">
      {/* Зведення по продуктах */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Усього прорахунків</p>
          <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{totalRuns}</p>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{totalVisitors} унікальних</p>
        </div>
        {stats.map((s) => (
          <div key={s.product} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{label(s.product)}</p>
            <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{s.runs}</p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{s.visitors} унікальних</p>
          </div>
        ))}
      </div>

      {/* Список прорахунків */}
      {leads.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <Calculator className="mx-auto mb-2 h-8 w-8 text-zinc-300 dark:text-zinc-600" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Прорахунків поки немає.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-100 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Продукт</th>
                <th className="px-4 py-3 font-medium">Параметри</th>
                <th className="px-4 py-3 font-medium text-center">Разів</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Останній</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {leads.map((l) => (
                <tr key={l.id} className="align-top">
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100 whitespace-nowrap">{label(l.product)}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{fmtParams(l.params)}</td>
                  <td className="px-4 py-3 text-center text-zinc-500 dark:text-zinc-400 tabular-nums">{l.count}</td>
                  <td className="px-4 py-3 text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                    {new Date(l.updatedAt).toLocaleString("uk-UA", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
