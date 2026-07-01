"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { FileText, Download, ExternalLink, ShieldCheck, LogIn } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { PolicyRecord } from "@/lib/policies";

interface PoliciesViewProps {
  loggedIn: boolean;
  email: string | null;
  policies: PolicyRecord[];
}

export function PoliciesView({ loggedIn, email, policies }: PoliciesViewProps) {
  if (!loggedIn) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-12 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
          <ShieldCheck className="h-7 w-7 text-indigo-600" />
        </div>
        <h2 className="text-lg font-bold text-zinc-900">Увійдіть, щоб побачити свої поліси</h2>
        <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-500">
          Поліси привʼязані до email. Увійдіть через Google з тим самим email, на який оформляли страховку.
        </p>
        <Button variant="primary" size="lg" className="mx-auto mt-6 flex items-center gap-2" onClick={() => signIn("google")}>
          <LogIn className="h-4 w-4" />
          Увійти через Google
        </Button>
      </div>
    );
  }

  if (policies.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-12 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100">
          <FileText className="h-7 w-7 text-zinc-400" />
        </div>
        <h2 className="text-lg font-bold text-zinc-900">Полісів поки немає</h2>
        <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-500">
          На акаунті <span className="font-medium text-zinc-700">{email}</span> ще немає оформлених полісів.
          Оформлені поліси зʼявляться тут автоматично.
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
  const [loading, setLoading] = useState(false);
  const [mtsbuLink, setMtsbuLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    if (!policy.contractId) {
      setError("Договір ще обробляється. Спробуйте трохи пізніше.");
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
      else setError("Договір недоступний для завантаження.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Помилка завантаження");
    } finally {
      setLoading(false);
    }
  };

  const v = policy.vehicle;
  const title = [v.mark, v.model].filter(Boolean).join(" ") || "Автоцивілка";
  const subtitle = [v.plate, v.year].filter(Boolean).join(" · ");

  return (
    <div className="rounded-2xl border border-zinc-100 bg-white px-5 py-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
            <ShieldCheck className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <p className="font-semibold text-zinc-900">{title}</p>
            {subtitle && <p className="text-sm text-zinc-500">{subtitle}</p>}
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-zinc-400">
              {policy.company && <span>{policy.company}</span>}
              {policy.startDate && policy.endDate && <span>{policy.startDate} — {policy.endDate}</span>}
            </div>
          </div>
        </div>
        {policy.price != null && (
          <div className="shrink-0 text-right">
            <div className="font-bold text-zinc-900">{policy.price} грн</div>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button variant="primary" size="sm" loading={loading} onClick={handleDownload} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Завантажити (PDF)
        </Button>
        {mtsbuLink && (
          <a href={mtsbuLink} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Реєстр МТСБУ
            </Button>
          </a>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
}
