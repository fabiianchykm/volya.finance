"use client";

import { useEffect, useState } from "react";
import { Loader2, HeartHandshake, Check, RotateCcw } from "lucide-react";

// Адмінка: пожертви бонусів — кому, скільки, від якого рахунку; позначка «виплачено»
// після фактичного переказу фонду.

interface Donation { id: string; email: string; amount: number; fundId: string; fund: string; status: "pending" | "paid"; createdAt: string; paidAt: string | null }

export function AdminDonations() {
  const [rows, setRows] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/admin/donations");
        const j = await r.json();
        if (j.success) setRows(j.donations); else setError(j.error ?? "Помилка");
      } catch { setError("Помилка завантаження"); }
      finally { setLoading(false); }
    })();
  }, []);

  const toggle = async (d: Donation) => {
    setBusy(d.id);
    try {
      const r = await fetch("/api/admin/donations", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: d.id, paid: d.status !== "paid" }) });
      const j = await r.json().catch(() => ({}));
      if (j?.success) setRows((prev) => prev.map((x) => (x.id === d.id ? { ...x, status: x.status === "paid" ? "pending" : "paid", paidAt: x.status === "paid" ? null : new Date().toISOString() } : x)));
    } finally { setBusy(null); }
  };

  if (loading) return <div className="flex items-center gap-2 text-sm text-zinc-400"><Loader2 className="h-4 w-4 animate-spin" /> Завантаження…</div>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (rows.length === 0) return <p className="text-sm text-zinc-500 dark:text-zinc-400">Пожертв ще немає.</p>;

  const pending = rows.filter((r) => r.status === "pending");
  const totalPending = pending.reduce((s, r) => s + r.amount, 0);
  const byFund = new Map<string, number>();
  for (const r of pending) byFund.set(r.fund, (byFund.get(r.fund) ?? 0) + r.amount);

  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Усього: {rows.length} · не переказано: <span className="font-semibold text-amber-600 dark:text-amber-400">{pending.length}</span> на суму <span className="font-semibold text-zinc-700 dark:text-zinc-200">{totalPending.toLocaleString("uk-UA")} грн</span>
        {byFund.size > 0 && <> · {[...byFund.entries()].map(([f, a]) => `${f}: ${a.toLocaleString("uk-UA")} грн`).join(" · ")}</>}
      </p>
      {rows.map((d) => (
        <div key={d.id} className={`rounded-2xl border bg-white p-4 shadow-sm dark:bg-zinc-900 ${d.status === "paid" ? "border-zinc-100 dark:border-zinc-800" : "border-amber-200 dark:border-amber-900"}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"><HeartHandshake className="h-3.5 w-3.5" />{d.fund}</span>
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{d.amount.toLocaleString("uk-UA")} грн</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${d.status === "paid" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"}`}>{d.status === "paid" ? "переказано" : "очікує переказу"}</span>
            </div>
            <span className="text-xs text-zinc-400 dark:text-zinc-500">{new Date(d.createdAt).toLocaleString("uk-UA")}</span>
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Рахунок: <code>{d.email}</code> · id {d.id}{d.paidAt ? ` · переказано ${new Date(d.paidAt).toLocaleString("uk-UA")}` : ""}</p>
          <div className="mt-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
            <button type="button" onClick={() => toggle(d)} disabled={busy === d.id}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${d.status === "paid" ? "text-zinc-500 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800" : "bg-emerald-600 text-white hover:bg-emerald-700"}`}>
              {busy === d.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : d.status === "paid" ? <RotateCcw className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
              {d.status === "paid" ? "Зняти позначку" : "Переказано фонду"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
