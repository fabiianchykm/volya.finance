"use client";

import { useEffect, useState } from "react";
import { Loader2, Phone, Mail, Download, ExternalLink } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { downloadEndpointFor } from "@/lib/policy-download";
import type { PolicyRecord } from "@/lib/policies";

const PRODUCT_LABELS: Record<string, string> = {
  osago: "Автоцивілка", greencard: "Зелена карта", tourism: "Туристичне", housing: "Житло", home: "Житло",
  pets: "Тварини", "mini-kasko": "Міні-КАСКО", kasko: "КАСКО",
};

export function AdminPolicies() {
  const [policies, setPolicies] = useState<PolicyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [dlError, setDlError] = useState<Record<string, string>>({});
  const { t } = useI18n();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/policies");
        const json = await res.json();
        if (json.success) setPolicies(json.policies);
        else setError(json.error ?? t({ uk: "Помилка", en: "Error" }));
      } catch {
        setError(t({ uk: "Помилка завантаження", en: "Loading error" }));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const download = async (p: PolicyRecord) => {
    if (!p.contractId) return;
    setDownloading(p.id);
    setDlError((e) => ({ ...e, [p.id]: "" }));
    try {
      const res = await fetch(downloadEndpointFor(p.product), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "download", contractId: p.contractId }),
      });
      const json = await res.json();
      if (json.data?.contract) window.open(json.data.contract, "_blank");
      else setDlError((e) => ({ ...e, [p.id]: json.error ?? t({ uk: "Договір недоступний", en: "Contract unavailable" }) }));
    } catch {
      setDlError((e) => ({ ...e, [p.id]: t({ uk: "Помилка завантаження", en: "Download error" }) }));
    } finally {
      setDownloading(null);
    }
  };

  if (loading) return <div className="flex items-center gap-2 text-sm text-zinc-400 dark:text-zinc-500"><Loader2 className="h-4 w-4 animate-spin" /> {t({ uk: "Завантаження…", en: "Loading…" })}</div>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (policies.length === 0) return <p className="text-sm text-zinc-500 dark:text-zinc-400">{t({ uk: "Полісів ще немає.", en: "No policies yet." })}</p>;

  const issued = policies.filter((p) => p.source !== "manual");
  const revenue = issued.reduce((s, p) => s + (p.price ?? 0), 0);

  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        {t({ uk: "Усього:", en: "Total:" })} {policies.length} · {t({ uk: "оформлено на сайті:", en: "issued on site:" })} <span className="font-semibold text-indigo-600 dark:text-indigo-400">{issued.length}</span> · {t({ uk: "на суму", en: "for" })} <span className="font-semibold text-zinc-700 dark:text-zinc-200">{revenue.toLocaleString("uk-UA")} грн</span>
      </p>
      {policies.map((p) => {
        const v = p.vehicle ?? {};
        const car = [v.mark, v.model, v.year, v.plate].filter(Boolean).join(" ");
        const isManual = p.source === "manual";
        return (
          <div key={p.id} className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                  {(p.product && PRODUCT_LABELS[p.product]) || p.product || "Поліс"}
                </span>
                {isManual && <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{t({ uk: "вручну", en: "manual" })}</span>}
                {p.company && <span className="text-xs text-zinc-500 dark:text-zinc-400">{p.company}</span>}
                {typeof p.price === "number" && <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">{p.price} грн</span>}
              </div>
              <span className="text-xs text-zinc-400 dark:text-zinc-500">{new Date(p.createdAt).toLocaleString("uk-UA")}</span>
            </div>

            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{p.customerName || "—"}</p>
            {car && <p className="text-xs text-zinc-500 dark:text-zinc-400">{car}</p>}
            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
              {p.startDate && p.endDate && <span className="mr-3">{p.startDate} — {p.endDate}</span>}
              {p.policyNumber && <span className="mr-3">№ {p.policyNumber}</span>}
              {p.contractId && <span className="mr-3">contract {p.contractId}</span>}
              {p.orderId && <span>order {p.orderId}</span>}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              {p.phone && (
                <a href={`tel:${p.phone}`} className="inline-flex items-center gap-1.5 font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                  <Phone className="h-3.5 w-3.5" /> {p.phone}
                </a>
              )}
              {p.email && (
                <a href={`mailto:${p.email}`} className="inline-flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400">
                  <Mail className="h-3.5 w-3.5" /> {p.email}
                </a>
              )}
            </div>

            {!isManual && (
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                <button
                  type="button"
                  onClick={() => download(p)}
                  disabled={!p.contractId || downloading === p.id}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                >
                  {downloading === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  PDF
                </button>
                <a href="https://policy.mtsbu.ua" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                  <ExternalLink className="h-3.5 w-3.5" /> МТСБУ
                </a>
                {dlError[p.id] && <span className="text-xs text-red-500">{dlError[p.id]}</span>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
