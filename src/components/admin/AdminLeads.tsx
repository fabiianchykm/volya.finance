"use client";

import { useEffect, useState } from "react";
import { Trash2, Loader2, Phone, Mail } from "lucide-react";

type LeadStatus = "new" | "called" | "converted" | "lost";

interface Lead {
  id: number;
  product: string | null;
  customerName: string | null;
  phone: string | null;
  email: string | null;
  company: string | null;
  price: number | null;
  car: string | null;
  stage: string | null;
  status: LeadStatus;
  createdAt: string;
}

const STATUS_META: Record<LeadStatus, { label: string; cls: string }> = {
  new:       { label: "Новий",       cls: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  called:    { label: "Передзвонив", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  converted: { label: "Оформив",     cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  lost:      { label: "Втрачений",   cls: "bg-zinc-100 text-zinc-500 border-zinc-200" },
};

export function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/leads");
        const json = await res.json();
        if (json.success) setLeads(json.leads);
        else setError(json.error ?? "Помилка");
      } catch {
        setError("Помилка завантаження");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setStatus = async (id: number, status: LeadStatus) => {
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status } : l))); // оптимістично
    try {
      await fetch("/api/admin/leads", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
    } catch { /* лишаємо оптимістичне значення */ }
  };

  const remove = async (id: number) => {
    if (!confirm("Видалити цей лід?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/leads?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) setLeads((ls) => ls.filter((l) => l.id !== id));
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return <div className="flex items-center gap-2 text-sm text-zinc-400"><Loader2 className="h-4 w-4 animate-spin" /> Завантаження…</div>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (leads.length === 0) return <p className="text-sm text-zinc-500">Лідів ще немає.</p>;

  const active = leads.filter((l) => l.status === "new").length;

  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-500">Усього: {leads.length} · нових: <span className="font-semibold text-indigo-600">{active}</span></p>
      {leads.map((l) => (
        <div key={l.id} className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {l.product && (
                <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">{l.product}</span>
              )}
              {l.company && <span className="text-xs text-zinc-500">{l.company}</span>}
              {typeof l.price === "number" && <span className="text-xs font-semibold text-zinc-700">{l.price} грн</span>}
            </div>
            <span className="text-xs text-zinc-400">{new Date(l.createdAt).toLocaleString("uk-UA")}</span>
          </div>

          <p className="text-sm font-semibold text-zinc-900">{l.customerName || "—"}</p>
          {l.car && <p className="text-xs text-zinc-500">{l.car}</p>}

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            {l.phone && (
              <a href={`tel:${l.phone}`} className="inline-flex items-center gap-1.5 font-medium text-indigo-600 hover:underline">
                <Phone className="h-3.5 w-3.5" /> {l.phone}
              </a>
            )}
            {l.email && (
              <a href={`mailto:${l.email}`} className="inline-flex items-center gap-1.5 text-zinc-600 hover:text-indigo-600">
                <Mail className="h-3.5 w-3.5" /> {l.email}
              </a>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-3">
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(STATUS_META) as LeadStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatus(l.id, st)}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                    l.status === st ? STATUS_META[st].cls : "border-zinc-200 bg-white text-zinc-400 hover:text-zinc-700"
                  }`}
                >
                  {STATUS_META[st].label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => remove(l.id)}
              disabled={deleting === l.id}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
            >
              {deleting === l.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              Видалити
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
