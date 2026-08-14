"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { FileText, Download, ExternalLink, ShieldCheck, LogIn, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useI18n, type Tr } from "@/lib/i18n";
import type { PolicyRecord } from "@/lib/policies";

interface PoliciesViewProps {
  loggedIn: boolean;
  email: string | null;
  policies: PolicyRecord[];
}

const PRODUCT_LABELS: Record<string, Tr> = {
  osago: { uk: "Автоцивілка", en: "Car insurance" }, kasko: { uk: "КАСКО", en: "CASCO" }, greencard: { uk: "Зелена карта", en: "Green Card" }, tourism: { uk: "Туристичне", en: "Travel insurance" }, other: { uk: "Страховий поліс", en: "Insurance policy" },
};

export function PoliciesView({ loggedIn, email, policies }: PoliciesViewProps) {
  const { t } = useI18n();
  if (!loggedIn) {
    return (
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-6 py-12 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/40">
          <ShieldCheck className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{t({ uk: "Увійдіть, щоб побачити свої поліси", en: "Sign in to see your policies" })}</h2>
        <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
          {t({ uk: "Поліси привʼязані до email. Увійдіть через Google з тим самим email, на який оформляли страховку.", en: "Policies are linked to your email. Sign in with Google using the same email you used to buy the insurance." })}
        </p>
        <Button variant="primary" size="lg" className="mx-auto mt-6 flex items-center gap-2" onClick={() => signIn("google")}>
          <LogIn className="h-4 w-4" />
          {t({ uk: "Увійти через Google", en: "Sign in with Google" })}
        </Button>
      </div>
    );
  }

  if (policies.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-6 py-12 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
          <FileText className="h-7 w-7 text-zinc-400 dark:text-zinc-500" />
        </div>
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{t({ uk: "Полісів поки немає", en: "No policies yet" })}</h2>
        <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
          {t({ uk: "На акаунті", en: "Account" })} <span className="font-medium text-zinc-700 dark:text-zinc-200">{email}</span> {t({ uk: "ще немає полісів. Оформлені у нас зʼявляться тут автоматично.", en: "has no policies yet. Those you buy from us will appear here automatically." })}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {policies.map((p) => (
        <PolicyCard key={p.id} policy={p} />
      ))}
    </div>
  );
}

function PolicyCard({ policy }: { policy: PolicyRecord }) {
  const { t } = useI18n();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [mtsbuLink, setMtsbuLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isManual = policy.source === "manual";

  const handleDownload = async () => {
    if (!policy.contractId) {
      setError(t({ uk: "Договір ще обробляється. Спробуйте трохи пізніше.", en: "The contract is still being processed. Please try again a little later." }));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/insurance/contract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "download", contractId: policy.contractId }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      if (json.data?.mtsbuLink) setMtsbuLink(json.data.mtsbuLink);
      if (json.data?.contract) window.open(json.data.contract, "_blank");
      else setError(t({ uk: "Договір недоступний для завантаження.", en: "The contract is not available for download." }));
    } catch (e) {
      setError(e instanceof Error ? e.message : t({ uk: "Помилка завантаження", en: "Download error" }));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch("/api/policies/manual", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: policy.id }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(t({ uk: "Не вдалося видалити", en: "Could not delete" }));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t({ uk: "Помилка", en: "Error" }));
      setDeleting(false);
    }
  };

  const v = policy.vehicle;
  const productLabel = policy.product ? t(PRODUCT_LABELS[policy.product] ?? PRODUCT_LABELS.other) : t(PRODUCT_LABELS.osago);
  const title = [v.mark, v.model].filter(Boolean).join(" ") || productLabel;
  const subtitle = [v.plate, v.year].filter(Boolean).join(" · ");

  return (
    <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 py-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/40">
            <ShieldCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">{title}</p>
              {isManual && (
                <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {t({ uk: "додано вручну", en: "added manually" })}
                </span>
              )}
            </div>
            {subtitle && <p className="text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>}
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-zinc-400 dark:text-zinc-500">
              {isManual && <span className="text-zinc-500 dark:text-zinc-400">{productLabel}</span>}
              {policy.company && <span>{policy.company}</span>}
              {policy.policyNumber && <span>№ {policy.policyNumber}</span>}
              {policy.startDate && policy.endDate && <span>{policy.startDate} — {policy.endDate}</span>}
            </div>
          </div>
        </div>
        {policy.price != null && (
          <div className="shrink-0 text-right">
            <div className="font-bold text-zinc-900 dark:text-zinc-100">{policy.price} {t({ uk: "грн", en: "UAH" })}</div>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {isManual ? (
          <>
            <a href="https://policy.mtsbu.ua" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                {t({ uk: "Перевірити в МТСБУ", en: "Check on MTSBU" })}
              </Button>
            </a>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-zinc-400 dark:text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {t({ uk: "Видалити", en: "Delete" })}
            </button>
          </>
        ) : (
          <>
            <Button variant="primary" size="sm" loading={loading} onClick={handleDownload} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              {t({ uk: "Завантажити (PDF)", en: "Download (PDF)" })}
            </Button>
            {mtsbuLink && (
              <a href={mtsbuLink} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  {t({ uk: "Реєстр МТСБУ", en: "MTSBU registry" })}
                </Button>
              </a>
            )}
          </>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
}
