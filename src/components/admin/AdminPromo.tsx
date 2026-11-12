"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, TicketPercent } from "lucide-react";

interface PromoRow {
  code: string; kind: "percent" | "amount"; value: number; product: string; maxDiscount: number | null;
  validUntil: string | null; maxUses: number | null; usedCount: number; active: boolean; note: string | null; createdAt: string;
}

const PRODUCTS: { v: string; label: string }[] = [
  { v: "all", label: "Усі продукти" }, { v: "osago", label: "Автоцивілка" }, { v: "tourism", label: "Туризм" }, { v: "greencard", label: "Зелена карта" },
];
const inputClass = "h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-indigo-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

// Промокоди = наша знижка коштом комісії (Ukasko discountPercent), стеля по кожній
// пропозиції — maxDiscount страхової. Тут створюємо/вимикаємо коди й бачимо, скільки
// разів кожен спрацював (рахуються лише ВИДАНІ поліси).
export function AdminPromo() {
  const [rows, setRows] = useState<PromoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ code: "", kind: "percent" as "percent" | "amount", value: "", product: "all", maxDiscount: "", validUntil: "", maxUses: "", note: "" });

  const load = async () => {
    try {
      const res = await fetch("/api/admin/promo");
      const json = await res.json();
      if (json.success) setRows(json.codes);
      else setError(json.error ?? "Помилка");
    } catch {
      setError("Помилка завантаження");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/promo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          code: form.code, kind: form.kind, value: Number(form.value), product: form.product,
          maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
          validUntil: form.validUntil ? new Date(`${form.validUntil}T23:59:59`).toISOString() : null,
          maxUses: form.maxUses ? Number(form.maxUses) : null, note: form.note || null,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Не вдалося зберегти");
      setForm({ code: "", kind: "percent", value: "", product: "all", maxDiscount: "", validUntil: "", maxUses: "", note: "" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Помилка");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (code: string, active: boolean) => {
    setRows((r) => r.map((x) => (x.code === code ? { ...x, active } : x)));
    await fetch("/api/admin/promo", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ code, active }) }).catch(() => {});
  };

  const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("uk-UA") : "—");

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100"><Plus className="h-4 w-4" /> Новий промокод</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs text-zinc-500 dark:text-zinc-400">Код
            <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="VOLYA10" className={`${inputClass} mt-1 uppercase tracking-wider`} />
          </label>
          <label className="text-xs text-zinc-500 dark:text-zinc-400">Тип знижки
            <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as "percent" | "amount" })} className={`${inputClass} mt-1`}>
              <option value="percent">Відсоток від ціни</option>
              <option value="amount">Фіксована сума, грн</option>
            </select>
          </label>
          <label className="text-xs text-zinc-500 dark:text-zinc-400">{form.kind === "percent" ? "Відсоток" : "Сума, грн"}
            <input required type="number" min={1} max={form.kind === "percent" ? 100 : undefined} step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className={`${inputClass} mt-1`} />
          </label>
          <label className="text-xs text-zinc-500 dark:text-zinc-400">Продукт
            <select value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} className={`${inputClass} mt-1`}>
              {PRODUCTS.map((p) => <option key={p.v} value={p.v}>{p.label}</option>)}
            </select>
          </label>
          {form.kind === "percent" && (
            <label className="text-xs text-zinc-500 dark:text-zinc-400">Максимум знижки, грн (необовʼязково)
              <input type="number" min={1} value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} className={`${inputClass} mt-1`} />
            </label>
          )}
          <label className="text-xs text-zinc-500 dark:text-zinc-400">Діє до (необовʼязково)
            <input type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} className={`${inputClass} mt-1`} />
          </label>
          <label className="text-xs text-zinc-500 dark:text-zinc-400">Ліміт використань (необовʼязково)
            <input type="number" min={1} value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} className={`${inputClass} mt-1`} />
          </label>
          <label className="text-xs text-zinc-500 dark:text-zinc-400">Примітка
            <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="для кого / акція" className={`${inputClass} mt-1`} />
          </label>
        </div>
        <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">Знижка йде з нашої комісії. По кожній пропозиції страхова має свою стелю (maxDiscount), більше за неї код не спише.</p>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={saving} className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Зберегти
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        {loading ? (
          <p className="p-6 text-sm text-zinc-500"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Завантаження…</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-zinc-500">Промокодів ще немає.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500 dark:bg-zinc-800/60 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3">Код</th><th className="px-4 py-3">Знижка</th><th className="px-4 py-3">Продукт</th><th className="px-4 py-3">Діє до</th><th className="px-4 py-3">Використано</th><th className="px-4 py-3">Примітка</th><th className="px-4 py-3">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {rows.map((r) => (
                <tr key={r.code} className={r.active ? "" : "opacity-50"}>
                  <td className="px-4 py-3 font-mono font-semibold text-zinc-900 dark:text-zinc-100"><TicketPercent className="mr-1.5 inline h-4 w-4 text-indigo-500" />{r.code}</td>
                  <td className="px-4 py-3">{r.kind === "percent" ? `${r.value}%${r.maxDiscount ? ` (до ${r.maxDiscount} ₴)` : ""}` : `${r.value} ₴`}</td>
                  <td className="px-4 py-3">{PRODUCTS.find((p) => p.v === r.product)?.label ?? r.product}</td>
                  <td className="px-4 py-3">{fmtDate(r.validUntil)}</td>
                  <td className="px-4 py-3">{r.usedCount}{r.maxUses ? ` / ${r.maxUses}` : ""}</td>
                  <td className="px-4 py-3 text-zinc-500">{r.note ?? ""}</td>
                  <td className="px-4 py-3">
                    <label className="inline-flex cursor-pointer items-center gap-2">
                      <input type="checkbox" checked={r.active} onChange={(e) => void toggle(r.code, e.target.checked)} className="h-4 w-4 rounded border-zinc-300 text-indigo-600" />
                      <span>{r.active ? "активний" : "вимкнено"}</span>
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
