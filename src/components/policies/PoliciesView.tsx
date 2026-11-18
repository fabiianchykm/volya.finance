"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { FileText, Download, ExternalLink, ShieldCheck, LogIn, Trash2, Loader2, Archive, Clock, CheckCircle2, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useI18n, type Tr } from "@/lib/i18n";
import type { PolicyRecord } from "@/lib/policies";
import { downloadEndpointFor } from "@/lib/policy-download";

interface PoliciesViewProps {
  loggedIn: boolean;
  email: string | null;
  policies: PolicyRecord[];
}

// Дата закінчення приходить у різних форматах (ДД.ММ.РРРР з чекаутів, YYYY-MM-DD
// з Ukasko, ISO). Невідома дата → поліс вважаємо активним.
function parseDate(v?: string | null): Date | null {
  if (!v) return null;
  const s = v.trim();
  let m = s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}
function daysLeft(endDate?: string | null): number | null {
  const end = parseDate(endDate);
  if (!end) return null;
  const today = new Date();
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const t1 = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
  return Math.round((t1 - t0) / 86_400_000);
}
function isArchived(p: PolicyRecord): boolean {
  const d = daysLeft(p.endDate);
  return d !== null && d < 0;
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
          {t({ uk: "Поліси привʼязані до контакту з оформлення. Увійдіть за тим самим номером телефону або через Google з тим самим email.", en: "Policies are linked to the contact you gave at checkout. Sign in with the same phone number or with Google using the same email." })}
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

  const active = policies.filter((p) => !isArchived(p));
  const archived = policies.filter(isArchived);

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{t({ uk: "Активні", en: "Active" })}</h2>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">{active.length}</span>
        </div>
        {active.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-white px-5 py-6 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-sm text-zinc-600 dark:text-zinc-300">{t({ uk: "Чинних полісів немає — усі вже завершились.", en: "No active policies — all of them have expired." })}</p>
            <Link href="/osago" className="mt-2 inline-block text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400">{t({ uk: "Оформити новий →", en: "Get a new one →" })}</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {active.map((p) => <PolicyCard key={p.id} policy={p} />)}
          </div>
        )}
      </section>

      {archived.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Archive className="h-4 w-4 text-zinc-400" />
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{t({ uk: "Архів", en: "Archive" })}</h2>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">{archived.length}</span>
          </div>
          <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">{t({ uk: "Поліси, строк дії яких минув. Договори й далі можна завантажити.", en: "Policies whose term has ended. Contracts can still be downloaded." })}</p>
          <div className="space-y-3 opacity-80">
            {archived.map((p) => <PolicyCard key={p.id} policy={p} archived />)}
          </div>
        </section>
      )}
    </div>
  );
}

function TermBadge({ endDate, archived }: { endDate: string | null; archived?: boolean }) {
  const { t } = useI18n();
  const d = daysLeft(endDate);
  if (archived || (d !== null && d < 0)) {
    return <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"><Archive className="h-3 w-3" />{t({ uk: "Завершився", en: "Expired" })}</span>;
  }
  if (d === null) return null;
  if (d <= 30) {
    return <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"><Clock className="h-3 w-3" />{d === 0 ? t({ uk: "Останній день", en: "Last day" }) : t({ uk: `Ще ${d} дн.`, en: `${d} days left` })}</span>;
  }
  return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"><CheckCircle2 className="h-3 w-3" />{t({ uk: "Діє", en: "Active" })}</span>;
}

function PolicyCard({ policy, archived = false }: { policy: PolicyRecord; archived?: boolean }) {
  const { t } = useI18n();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [mtsbuLink, setMtsbuLink] = useState<string | null>(policy.mtsbuLink ?? null);
  const [error, setError] = useState<string | null>(null);

  const isManual = policy.source === "manual";
  const inRegistry = !isManual && (!policy.product || policy.product === "osago" || policy.product === "greencard");

  // Пряме посилання на підтвердження в реєстрі МТСБУ: якщо його ще немає в БД
  // (старі поліси), підтягуємо у фоні через contract/take — сервер закешує.
  useEffect(() => {
    if (mtsbuLink || !inRegistry || !policy.contractId) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/policies/mtsbu", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: policy.id }) });
        const json = await r.json().catch(() => ({}));
        if (!cancelled && json?.success && json.link) setMtsbuLink(json.link);
      } catch { /* кнопка лишається на публічну перевірку */ }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [policy.id]);

  const handleDownload = async () => {
    if (!policy.contractId) {
      setError(t({ uk: "Договір ще обробляється. Спробуйте трохи пізніше.", en: "The contract is still being processed. Please try again a little later." }));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(downloadEndpointFor(policy.product), {
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
    <div className={`rounded-2xl border bg-white px-5 py-4 shadow-sm dark:bg-zinc-900 ${policy.isTest ? "border-dashed border-amber-300 dark:border-amber-800" : "border-zinc-100 dark:border-zinc-800"}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${archived ? "bg-zinc-100 dark:bg-zinc-800" : "bg-indigo-50 dark:bg-indigo-950/40"}`}>
            <ShieldCheck className={`h-5 w-5 ${archived ? "text-zinc-400 dark:text-zinc-500" : "text-indigo-600 dark:text-indigo-400"}`} />
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
              <TermBadge endDate={policy.endDate} archived={archived} />
              {policy.isTest && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" title={t({ uk: "Оформлений у тестовому режимі — не є чинним договором", en: "Issued in test mode — not a valid contract" })}>
                  <FlaskConical className="h-3 w-3" />{t({ uk: "Тестовий", en: "Test" })}
                </span>
              )}
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
            {/* Кнопка реєстру одразу, не лише після завантаження PDF: поки прямого
                посилання на договір немає — ведемо на публічну перевірку за номером авто. */}
            {inRegistry && (
              <a href={mtsbuLink ?? "https://policy.mtsbu.ua"} target="_blank" rel="noopener noreferrer" title={mtsbuLink ? t({ uk: "Підтвердження цього поліса в реєстрі МТСБУ", en: "This policy's confirmation in the MTSBU registry" }) : t({ uk: "Перевірка за номером авто в реєстрі МТСБУ", en: "Check by plate number in the MTSBU registry" })}>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  {mtsbuLink ? t({ uk: "Підтвердження МТСБУ", en: "MTSBU confirmation" }) : t({ uk: "Реєстр МТСБУ", en: "MTSBU registry" })}
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
