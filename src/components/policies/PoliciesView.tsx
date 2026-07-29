"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { FileText, Download, ExternalLink, ShieldCheck, LogIn, Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { DateInput } from "@/components/ui/DateInput";
import type { PolicyRecord } from "@/lib/policies";

interface PoliciesViewProps {
  loggedIn: boolean;
  email: string | null;
  policies: PolicyRecord[];
}

const PRODUCT_LABELS: Record<string, string> = {
  osago: "Автоцивілка", kasko: "КАСКО", greencard: "Зелена карта", tourism: "Туристичне", other: "Страховий поліс",
};

export function PoliciesView({ loggedIn, email, policies }: PoliciesViewProps) {
  const [addOpen, setAddOpen] = useState(false);

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

  return (
    <>
      {policies.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100">
            <FileText className="h-7 w-7 text-zinc-400" />
          </div>
          <h2 className="text-lg font-bold text-zinc-900">Полісів поки немає</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-500">
            На акаунті <span className="font-medium text-zinc-700">{email}</span> ще немає полісів.
            Оформлені у нас зʼявляться автоматично, а вже наявний можна додати вручну.
          </p>
          <Button variant="primary" size="lg" className="mx-auto mt-6 flex items-center gap-2" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Додати наявний поліс
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-4 flex justify-end">
            <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" />
              Додати наявний поліс
            </Button>
          </div>
          <div className="space-y-3">
            {policies.map((p) => (
              <PolicyCard key={p.id} policy={p} />
            ))}
          </div>
        </>
      )}

      <AddPolicyModal open={addOpen} onClose={() => setAddOpen(false)} />
    </>
  );
}

function PolicyCard({ policy }: { policy: PolicyRecord }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [mtsbuLink, setMtsbuLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isManual = policy.source === "manual";

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
      if (!json.success) throw new Error("Не вдалося видалити");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Помилка");
      setDeleting(false);
    }
  };

  const v = policy.vehicle;
  const productLabel = policy.product ? PRODUCT_LABELS[policy.product] ?? "Страховий поліс" : "Автоцивілка";
  const title = [v.mark, v.model].filter(Boolean).join(" ") || productLabel;
  const subtitle = [v.plate, v.year].filter(Boolean).join(" · ");

  return (
    <div className="rounded-2xl border border-zinc-100 bg-white px-5 py-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
            <ShieldCheck className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-zinc-900">{title}</p>
              {isManual && (
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                  додано вручну
                </span>
              )}
            </div>
            {subtitle && <p className="text-sm text-zinc-500">{subtitle}</p>}
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-zinc-400">
              {isManual && <span className="text-zinc-500">{productLabel}</span>}
              {policy.company && <span>{policy.company}</span>}
              {policy.policyNumber && <span>№ {policy.policyNumber}</span>}
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
        {isManual ? (
          <>
            <a href="https://policy.mtsbu.ua" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                Перевірити в МТСБУ
              </Button>
            </a>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Видалити
            </button>
          </>
        ) : (
          <>
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
          </>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
}

const PRODUCT_OPTIONS = [
  { value: "osago", label: "Автоцивілка (ОСЦПВ)" },
  { value: "kasko", label: "КАСКО" },
  { value: "greencard", label: "Зелена карта" },
  { value: "tourism", label: "Туристичне" },
  { value: "other", label: "Інше" },
];

function AddPolicyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [f, setF] = useState({
    product: "osago", company: "", policyNumber: "",
    plate: "", mark: "", model: "", startDate: "", endDate: "", price: "",
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((s) => ({ ...s, [k]: e.target.value }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuto = f.product === "osago" || f.product === "kasko" || f.product === "greencard";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!f.policyNumber.trim() && !f.company.trim()) {
      setError("Вкажіть номер полісу або страхову компанію");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/policies/manual", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          product: f.product,
          company: f.company || null,
          policyNumber: f.policyNumber || null,
          startDate: f.startDate || null,
          endDate: f.endDate || null,
          price: f.price ? Number(f.price.replace(/\D/g, "")) : null,
          vehicle: isAuto ? { plate: f.plate || undefined, mark: f.mark || undefined, model: f.model || undefined } : {},
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Не вдалося додати поліс");
      onClose();
      setF({ product: "osago", company: "", policyNumber: "", plate: "", mark: "", model: "", startDate: "", endDate: "", price: "" });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка");
    } finally {
      setLoading(false);
    }
  };

  const selectClass = "h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500";

  return (
    <Modal open={open} onClose={onClose} title="Додати наявний поліс" size="md">
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-zinc-500">
          Додайте поліс, який ви вже маєте (оформлений деінде), щоб він зберігався у вашому кабінеті.
        </p>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">Вид страхування</label>
          <select value={f.product} onChange={(e) => setF((s) => ({ ...s, product: e.target.value }))} className={selectClass}>
            {PRODUCT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Страхова компанія" value={f.company} onChange={set("company")} placeholder="напр. PZU, ІНГО" />
          <Input label="Номер полісу" value={f.policyNumber} onChange={set("policyNumber")} placeholder="напр. AO/1234567" />
        </div>

        {isAuto && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input label="Держ. номер" value={f.plate} onChange={set("plate")} placeholder="AA1234BB" />
            <Input label="Марка" value={f.mark} onChange={set("mark")} placeholder="Audi" />
            <Input label="Модель" value={f.model} onChange={set("model")} placeholder="A4" />
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DateInput label="Дата початку" value={f.startDate} onChange={(v) => setF((s) => ({ ...s, startDate: v }))} maxDate={new Date(new Date().getFullYear() + 2, 11, 31)} defaultYear={new Date().getFullYear()} />
          <DateInput label="Дата завершення" value={f.endDate} onChange={(v) => setF((s) => ({ ...s, endDate: v }))} maxDate={new Date(new Date().getFullYear() + 3, 11, 31)} defaultYear={new Date().getFullYear() + 1} />
        </div>

        <Input label="Вартість, грн (необовʼязково)" value={f.price} onChange={(e) => setF((s) => ({ ...s, price: e.target.value.replace(/\D/g, "") }))} placeholder="напр. 1200" />

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" size="md" onClick={onClose}>Скасувати</Button>
          <Button type="submit" variant="primary" size="md" loading={loading}>Додати поліс</Button>
        </div>
      </form>
    </Modal>
  );
}
