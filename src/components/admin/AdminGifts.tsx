"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Gift } from "lucide-react";

interface Row {
  code: string; amount: number; status: "requested" | "paid" | "redeemed" | "cancelled";
  buyerName: string; buyerPhone: string; buyerEmail: string | null; recipientName: string | null; message: string | null;
  note: string | null; createdAt: string; paidAt: string | null; validUntil: string | null; redeemedAt: string | null;
}

const STATUS: Record<Row["status"], { label: string; cls: string }> = {
  requested: { label: "Очікує оплати", cls: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" },
  paid: { label: "Активний", cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" },
  redeemed: { label: "Використано", cls: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300" },
  cancelled: { label: "Скасовано", cls: "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300" },
};

// Подарункові сертифікати: заявки з /gift. «Оплачено» — коли гроші прийшли на рахунок
// (сертифікат стає активним на 12 міс.); «Використано» — коли поліс за ним оформлено
// (у примітку — номер поліса/замовлення).
export function AdminGifts() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await fetch("/api/admin/gifts");
      const json = await res.json();
      if (json.success) setRows(json.gifts); else setError(json.error ?? "Помилка");
    } catch { setError("Помилка завантаження"); } finally { setLoading(false); }
  };
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);

  const setStatus = async (code: string, status: Row["status"]) => {
    let note: string | null = null;
    if (status === "redeemed") { note = window.prompt("Яким полісом/замовленням погашено? (номер, коротко)") ?? null; if (note === null) return; }
    if (status === "cancelled" && !window.confirm(`Скасувати сертифікат ${code}?`)) return;
    setBusy(code); setError(null);
    try {
      const res = await fetch("/api/admin/gifts", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ code, status, note }) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setRows((rs) => rs.map((r) => (r.code === code ? json.gift : r)));
    } catch (e) { setError(e instanceof Error ? e.message : "Помилка"); } finally { setBusy(null); }
  };

  const d = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("uk-UA") : "—");
  const btn = "rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:border-indigo-300 hover:text-indigo-700 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200";

  if (loading) return <div className="flex items-center gap-2 text-sm text-zinc-500"><Loader2 className="h-4 w-4 animate-spin" /> Завантаження…</div>;
  return (
    <div className="space-y-4">
      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-12 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"><Gift className="mx-auto mb-2 h-6 w-6 text-indigo-400" />Заявок ще немає. Сторінка для клієнтів — <Link href="/gift" className="text-indigo-600 hover:underline">/gift</Link>.</div>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.code} className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <a href={`/gift/${r.code}`} target="_blank" rel="noopener noreferrer" className="font-mono text-base font-bold text-zinc-900 hover:text-indigo-600 dark:text-zinc-100">{r.code}</a>
                    <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">{r.amount.toLocaleString("uk-UA")} ₴</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS[r.status].cls}`}>{STATUS[r.status].label}</span>
                  </div>
                  <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{r.buyerName && <>{r.buyerName} · </>}<a href={`tel:${r.buyerPhone}`} className="hover:underline">{r.buyerPhone}</a>{r.buyerEmail && <> · {r.buyerEmail}</>}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {r.recipientName && <>Кому: {r.recipientName} · </>}Заявка {d(r.createdAt)}{r.paidAt && <> · оплачено {d(r.paidAt)} · до {d(r.validUntil)}</>}{r.redeemedAt && <> · використано {d(r.redeemedAt)}</>}
                  </p>
                  {r.message && <p className="mt-1 text-xs italic text-zinc-500 dark:text-zinc-400">«{r.message}»</p>}
                  {r.note && <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">Примітка: {r.note}</p>}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {r.status === "requested" && <button type="button" disabled={busy === r.code} onClick={() => setStatus(r.code, "paid")} className={`${btn} border-emerald-300 text-emerald-700`}>Оплачено</button>}
                  {r.status === "paid" && <button type="button" disabled={busy === r.code} onClick={() => setStatus(r.code, "redeemed")} className={btn}>Використано</button>}
                  {(r.status === "requested" || r.status === "paid") && <button type="button" disabled={busy === r.code} onClick={() => setStatus(r.code, "cancelled")} className={`${btn} text-red-600`}>Скасувати</button>}
                  {r.status === "cancelled" && <button type="button" disabled={busy === r.code} onClick={() => setStatus(r.code, "requested")} className={btn}>Повернути</button>}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
