"use client";

import { useState, useEffect, useRef } from "react";
import { useFlowReset } from "@/lib/nav-reset";
import { readResume, clearResume } from "@/lib/checkout-resume";
import { motion } from "framer-motion";
import { Clock, ArrowRight, Home, ChevronRight, ArrowDownWideNarrow, ArrowUpWideNarrow, Shield, Globe, Search } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { DateInput, parseUaDate } from "@/components/ui/DateInput";
import { OfferCard } from "@/components/insurance/OfferCard";
import { SearchingInsurers } from "@/components/insurance/SearchingInsurers";
import { AccidentCheckout, type AccidentCheckoutCtx } from "./AccidentCheckout";
import type { AccidentOffer, AccidentParams, AccidentPeriod, AccidentProtection, InsuranceOffer } from "@/types/api";
import { trackEvent, trackCalc } from "@/lib/analytics";
import { useI18n } from "@/lib/i18n";

// Страхування від нещасних випадків (НВ) — потік і дизайн як у тварин/туризму:
// темний герой для параметрів (хто, на скільки, яка сума, який ризик), далі
// світлий екран пропозицій → анкета. Переліки — з документації Ukasko (фіксовані).

export const ACC_PERIODS: { value: AccidentPeriod; label: string; en: string }[] = [
  { value: "10_days", label: "10 днів", en: "10 days" },
  { value: "15_days", label: "15 днів", en: "15 days" },
  { value: "30_days", label: "30 днів", en: "30 days" },
  { value: "3_month", label: "3 місяці", en: "3 months" },
  { value: "6_month", label: "6 місяців", en: "6 months" },
  { value: "9_month", label: "9 місяців", en: "9 months" },
  { value: "12_month", label: "1 рік", en: "1 year" },
];
export const ACC_SUMS = [10000, 15000, 25000, 50000, 100000, 150000, 200000, 250000, 300000];
export const ACC_PROTECTION: { value: AccidentProtection; label: string; en: string }[] = [
  { value: "24_7", label: "Цілодобово (24/7)", en: "Around the clock (24/7)" },
  { value: "study_work_hours", label: "Під час навчання / роботи", en: "During study / work hours" },
  { value: "sport_hours", label: "Під час тренувань і змагань", en: "During training and competitions" },
];
export const ACC_COUNTRIES: { value: 1 | 2; label: string; en: string }[] = [
  { value: 1, label: "Україна", en: "Ukraine" },
  { value: 2, label: "Весь світ", en: "Worldwide" },
];
// Фактор ризику у формі: «без особливих ризиків» = profession:none (у API немає
// окремого «нічого»); решта — як у документації.
export type RiskChoice = "none" | "warRisk" | "sport" | "profession";
export const ACC_RISKS: { value: RiskChoice; label: string; en: string }[] = [
  { value: "none", label: "Без особливих ризиків", en: "No special risks" },
  { value: "warRisk", label: "Воєнні ризики", en: "War risks" },
  { value: "sport", label: "Заняття спортом", en: "Sports" },
  { value: "profession", label: "Небезпечна професія", en: "Hazardous profession" },
];
export const ACC_PROFESSIONS: { value: NonNullable<AccidentParams["profession"]>; label: string; en: string }[] = [
  { value: "builder", label: "Будівельник / монтажник", en: "Builder / fitter" },
  { value: "electrician", label: "Електрик / енергетик", en: "Electrician / power engineer" },
  { value: "firefighter", label: "Пожежник / працівник ДСНС", en: "Firefighter / rescuer" },
  { value: "guard", label: "Охоронець / інкасатор", en: "Security guard / cash courier" },
  { value: "other", label: "Інша професія підвищеної небезпеки", en: "Other hazardous profession" },
];
// Групу ризику виду спорту (S0/S1/S2/SE) підбирає сервер; клієнт обирає лише рівень.
export const ACC_SPORT_LEVELS: { value: "amateur" | "pro"; label: string; en: string }[] = [
  { value: "amateur", label: "Аматор", en: "Amateur" },
  { value: "pro", label: "Професіонал", en: "Professional" },
];

export interface AccidentForm {
  birthDate: string;          // ДД.ММ.РРРР
  startDate: string;          // ДД.ММ.РРРР
  period: AccidentPeriod;
  sum: number;
  countryId: 1 | 2;
  protectionPeriod: AccidentProtection;
  risk: RiskChoice;
  sportType: string;          // код
  sportName: string;          // назва для відображення
  sportLevel: "amateur" | "pro";
  profession: NonNullable<AccidentParams["profession"]>;
}

const selectClass =
  "h-11 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-indigo-400";
const inputClass =
  "h-11 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500";

const fmtSum = (n: number) => `${n.toLocaleString("uk-UA")} грн`;
const uaDate = (d: Date) => { const p = (n: number) => String(n).padStart(2, "0"); return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`; };
const tomorrow = () => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(0, 0, 0, 0); return d; };

// Параметри калькулятора з форми (саме вони ж ідуть у searchInfo заявки).
export function toAccidentParams(f: AccidentForm): AccidentParams {
  const base: AccidentParams = {
    startDate: f.startDate, birthDate: f.birthDate, period: f.period, protectionPeriod: f.protectionPeriod,
    sum: f.sum, countryId: f.countryId, activeFactor: "profession", profession: "none",
  };
  if (f.risk === "warRisk") return { ...base, activeFactor: "warRisk", warRisk: true, profession: undefined };
  // sportCategory підставить сервер (група ризику спорту невідома наперед).
  if (f.risk === "sport") return { ...base, activeFactor: "sport", sportType: f.sportType, profession: undefined };
  if (f.risk === "profession") return { ...base, activeFactor: "profession", profession: f.profession };
  return base;
}

function toInsuranceOffer(o: AccidentOffer): InsuranceOffer {
  return {
    offerId: o.offerId,
    price: o.price,
    company: { ...(o.company ?? {}), publicName: o.company?.publicName || o.companyNamePublic || o.companyName || "", logo: o.company?.logo ?? null },
    listDgo: [],
    listAutolawyer: [],
  } as unknown as InsuranceOffer;
}

export function AccidentFlow() {
  const { t } = useI18n();
  const [step, setStep] = useState<"form" | "offers" | "checkout">("form");
  useFlowReset(() => setStep("form"));
  const [f, setF] = useState<AccidentForm>({
    birthDate: "", startDate: uaDate(tomorrow()), period: "12_month", sum: 100000, countryId: 1,
    protectionPeriod: "24_7", risk: "none", sportType: "", sportName: "", sportLevel: "amateur", profession: "builder",
  });
  const patch = (p: Partial<AccidentForm>) => setF((s) => ({ ...s, ...p }));

  const [offers, setOffers] = useState<AccidentOffer[]>([]);
  // Параметри, з якими СК реально порахувала (зі sportCategory) — ідуть у searchInfo заявки.
  const [calcParams, setCalcParams] = useState<AccidentParams | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<AccidentOffer | null>(null);
  // Відновлення оформлення після перезавантаження вкладки (див. lib/checkout-resume).
  const [resumeCtx, setResumeCtx] = useState<AccidentCheckoutCtx | null>(null);
  useEffect(() => {
    const r = readResume<{ ctx: AccidentCheckoutCtx }>("checkout_resume_accident");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (r?.ctx) { setResumeCtx(r.ctx); setStep("checkout"); }
  }, []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Вік 1–75 повних років на дату початку (вимога API).
  const ageAtStart = (() => {
    const b = parseUaDate(f.birthDate); const s = parseUaDate(f.startDate);
    if (!b || !s) return null;
    let a = s.getFullYear() - b.getFullYear();
    if (s.getMonth() < b.getMonth() || (s.getMonth() === b.getMonth() && s.getDate() < b.getDate())) a--;
    return a;
  })();
  const ageOk = ageAtStart !== null && ageAtStart >= 1 && ageAtStart <= 75;
  const valid = ageOk && !!parseUaDate(f.startDate) && (f.risk !== "sport" || !!f.sportType);

  const runCalc = async (form: AccidentForm) => {
    setError(null);
    setOffers([]);
    setLoading(true);
    setStep("offers");
    const params = toAccidentParams(form);
    const sp = new URLSearchParams({ step: "offers", ...Object.fromEntries(Object.entries({ ...form, sum: String(form.sum), countryId: String(form.countryId) }).filter(([, v]) => v !== "" && v !== undefined)) });
    window.history.replaceState(null, "", `?${sp.toString()}`);
    trackEvent("calculate_cost", { product: "accident" });
    trackCalc("accident", { period: form.period, sum: form.sum, countryId: form.countryId, protection: form.protectionPeriod, risk: form.risk });
    try {
      const res = await fetch("/api/accident", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...params, sportLevel: form.risk === "sport" ? form.sportLevel : undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) throw new Error(data?.error ?? t({ uk: "Не вдалося отримати пропозиції", en: "Could not fetch offers" }));
      const list: AccidentOffer[] = (data.offers ?? []).filter((o: AccidentOffer) => o && o.price > 0);
      list.sort((a, b) => a.price - b.price);
      setOffers(list);
      setCalcParams((data.params as AccidentParams) ?? params);
      if (list.length === 0 && typeof data.hint === "string") setError(data.hint);
    } catch (err) {
      setError(err instanceof Error ? err.message : t({ uk: "Не вдалося отримати пропозиції.", en: "Could not fetch offers." }));
    } finally {
      setLoading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || loading) return;
    void runCalc(f);
  };

  // Відновлення з URL при перезавантаженні (крок оформлення не відновлюємо).
  const didRestore = useRef(false);
  useEffect(() => {
    if (didRestore.current) return;
    didRestore.current = true;
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("step") !== "offers" || !sp.get("birthDate")) return;
    const g = (k: string) => sp.get(k) ?? "";
    const restored: AccidentForm = {
      birthDate: g("birthDate"), startDate: g("startDate") || uaDate(tomorrow()),
      period: (ACC_PERIODS.some((p) => p.value === g("period")) ? g("period") : "12_month") as AccidentPeriod,
      sum: ACC_SUMS.includes(Number(g("sum"))) ? Number(g("sum")) : 100000,
      countryId: g("countryId") === "2" ? 2 : 1,
      protectionPeriod: (ACC_PROTECTION.some((p) => p.value === g("protectionPeriod")) ? g("protectionPeriod") : "24_7") as AccidentProtection,
      risk: (ACC_RISKS.some((r) => r.value === g("risk")) ? g("risk") : "none") as RiskChoice,
      sportType: g("sportType"), sportName: g("sportName"), sportLevel: g("sportLevel") === "pro" ? "pro" : "amateur",
      profession: (ACC_PROFESSIONS.some((p) => p.value === g("profession")) ? g("profession") : "builder") as AccidentForm["profession"],
    };
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setF(restored);
    void runCalc(restored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = (() => {
    const per = ACC_PERIODS.find((p) => p.value === f.period);
    const ctry = ACC_COUNTRIES.find((c) => c.value === f.countryId);
    const risk = ACC_RISKS.find((r) => r.value === f.risk);
    return [fmtSum(f.sum), per ? t({ uk: per.label, en: per.en }) : "", ctry ? t({ uk: ctry.label, en: ctry.en }) : "", f.risk !== "none" && risk ? t({ uk: risk.label, en: risk.en }) : ""].filter(Boolean).join(" · ");
  })();

  // ── Світлий екран: пропозиції / оформлення ──
  if (step === "offers" || step === "checkout") {
    return (
      <>
        <Navbar solid />
        <section className="min-h-screen pt-20 pb-10">
          <div className={`mx-auto px-4 sm:px-6 ${step === "offers" ? "max-w-[1200px]" : "max-w-3xl"}`}>
            {step === "offers" ? (
              <AccidentOffers
                offers={offers}
                loading={loading}
                error={error}
                summary={summary}
                onBack={() => { setError(null); setStep("form"); window.history.replaceState(null, "", window.location.pathname); }}
                onSelect={(o) => { setSelectedOffer(o); setStep("checkout"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              />
            ) : (resumeCtx || selectedOffer) ? (
              <AccidentCheckout
                ctx={resumeCtx ?? ({ offer: selectedOffer!, form: f, params: calcParams ?? toAccidentParams(f) } satisfies AccidentCheckoutCtx)}
                onBack={() => { if (resumeCtx) { clearResume("checkout_resume_accident"); setResumeCtx(null); setStep("form"); window.history.replaceState(null, "", window.location.pathname); } else setStep("offers"); }}
              />
            ) : null}
          </div>
        </section>
      </>
    );
  }

  // ── Темний герой: форма ──
  return (
    <>
      <Navbar />
      <section
        className="relative overflow-x-hidden pb-20 pt-32 sm:pb-28 sm:pt-40 animate-gradient"
        style={{ backgroundImage: "linear-gradient(135deg, #06040f, #0f0c29, #1e1060, #4f46e5, #7c3aed, #1e1060, #06040f)" }}
      >
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 60% at 50% 48%, transparent 0%, rgba(0,0,0,0.1) 100%)" }} />
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 w-full">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-8 text-center">
            <div className="space-y-4">
              <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
                {t({ uk: "Страхування від нещасних випадків", en: "Accident insurance" })}
                <span className="mt-1 block bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                  {t({ uk: "виплата, коли це справді потрібно", en: "a payout when it really matters" })}
                </span>
              </h1>
              <p className="mx-auto max-w-xl text-base text-zinc-300">{t({ uk: "Поліс НВ онлайн для себе, дитини чи спортсмена — від 159 грн. Оберіть параметри і побачите ціну одразу.", en: "An accident policy online for yourself, your child or an athlete — from UAH 159. Choose your options and see the price right away." })}</p>
            </div>

            <form onSubmit={submit} className="rounded-2xl bg-white dark:bg-zinc-900 p-5 text-left shadow-2xl sm:p-7">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DateInput
                  label={t({ uk: "Дата народження застрахованого", en: "Insured person's date of birth" })}
                  value={f.birthDate} onChange={(v) => patch({ birthDate: v })} defaultYear={1990} required
                  error={f.birthDate && parseUaDate(f.birthDate) && !ageOk ? t({ uk: "Вік має бути від 1 до 75 років", en: "Age must be between 1 and 75" }) : undefined}
                />
                <DateInput
                  label={t({ uk: "Початок дії", en: "Start date" })}
                  value={f.startDate} onChange={(v) => patch({ startDate: v })}
                  minDate={tomorrow()} maxDate={(() => { const d = new Date(); d.setDate(d.getDate() + 180); return d; })()} required
                />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400"><Clock className="h-3.5 w-3.5" /> {t({ uk: "Строк страхування", en: "Insurance term" })}</label>
                  <select value={f.period} onChange={(e) => patch({ period: e.target.value as AccidentPeriod })} className={selectClass}>
                    {ACC_PERIODS.map((p) => <option key={p.value} value={p.value}>{t({ uk: p.label, en: p.en })}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400"><Shield className="h-3.5 w-3.5" /> {t({ uk: "Страхова сума", en: "Insured sum" })}</label>
                  <select value={f.sum} onChange={(e) => patch({ sum: Number(e.target.value) })} className={selectClass}>
                    {ACC_SUMS.map((s) => <option key={s} value={s}>{fmtSum(s)}</option>)}
                  </select>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400"><Globe className="h-3.5 w-3.5" /> {t({ uk: "Територія дії", en: "Territory" })}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ACC_COUNTRIES.map((c) => (
                      <button key={c.value} type="button" onClick={() => patch({ countryId: c.value })}
                        className={`flex h-11 items-center justify-center rounded-xl border text-sm font-medium transition-colors ${
                          f.countryId === c.value ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-200 dark:ring-indigo-900" : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-indigo-200"
                        }`}>
                        {t({ uk: c.label, en: c.en })}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-medium text-zinc-500 dark:text-zinc-400">{t({ uk: "Коли діє захист", en: "When cover applies" })}</label>
                  <select value={f.protectionPeriod} onChange={(e) => patch({ protectionPeriod: e.target.value as AccidentProtection })} className={selectClass}>
                    {ACC_PROTECTION.map((p) => <option key={p.value} value={p.value}>{t({ uk: p.label, en: p.en })}</option>)}
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-xs font-medium text-zinc-500 dark:text-zinc-400">{t({ uk: "Фактор ризику", en: "Risk factor" })}</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {ACC_RISKS.map((r) => (
                    <button key={r.value} type="button" onClick={() => patch({ risk: r.value })}
                      className={`min-h-11 rounded-xl border px-2 py-2 text-xs font-medium leading-tight transition-colors sm:text-sm ${
                        f.risk === r.value ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-200 dark:ring-indigo-900" : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-indigo-200"
                      }`}>
                      {t({ uk: r.label, en: r.en })}
                    </button>
                  ))}
                </div>
              </div>

              {f.risk === "sport" && (
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <SportPicker value={f.sportName} onPick={(code, name) => patch({ sportType: code, sportName: name })} onClear={() => patch({ sportType: "", sportName: "" })} />
                  <div>
                    <label className="mb-2 block text-xs font-medium text-zinc-500 dark:text-zinc-400">{t({ uk: "Рівень", en: "Level" })}</label>
                    <div className="grid grid-cols-2 gap-2">
                      {ACC_SPORT_LEVELS.map((l) => (
                        <button key={l.value} type="button" onClick={() => patch({ sportLevel: l.value })}
                          className={`flex h-11 items-center justify-center rounded-xl border text-sm font-medium transition-colors ${
                            f.sportLevel === l.value ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-200 dark:ring-indigo-900" : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-indigo-200"
                          }`}>
                          {t({ uk: l.label, en: l.en })}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {f.risk === "profession" && (
                <div className="mt-4">
                  <label className="mb-2 block text-xs font-medium text-zinc-500 dark:text-zinc-400">{t({ uk: "Професія", en: "Profession" })}</label>
                  <select value={f.profession} onChange={(e) => patch({ profession: e.target.value as AccidentForm["profession"] })} className={selectClass}>
                    {ACC_PROFESSIONS.map((p) => <option key={p.value} value={p.value}>{t({ uk: p.label, en: p.en })}</option>)}
                  </select>
                </div>
              )}

              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

              <Button type="submit" variant="primary" size="lg" loading={loading} disabled={!valid || loading} className="mt-5 w-full">
                <span className="flex items-center gap-2">
                  {loading ? t({ uk: "Шукаємо пропозиції…", en: "Searching for offers…" }) : <>{t({ uk: "Розрахувати вартість", en: "Calculate cost" })} <ArrowRight className="h-5 w-5" /></>}
                </span>
              </Button>
            </form>
          </motion.div>
        </div>
      </section>
    </>
  );
}

// Автокомпліт виду спорту з довідника Ukasko (пошук від 2 символів).
function SportPicker({ value, onPick, onClear }: { value: string; onPick: (code: string, name: string) => void; onClear: () => void }) {
  const { t } = useI18n();
  const [q, setQ] = useState(value);
  const [results, setResults] = useState<{ code: string; name: string }[]>([]);
  const [picked, setPicked] = useState(!!value);
  useEffect(() => {
    if (picked || q.trim().length < 2) return;
    const h = setTimeout(async () => {
      try {
        const res = await fetch(`/api/accident/sports?q=${encodeURIComponent(q.trim())}`);
        const json = await res.json();
        if (json.success) setResults(json.data);
      } catch { /* тихо */ }
    }, 300);
    return () => clearTimeout(h);
  }, [q, picked]);
  return (
    <div className="relative">
      <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400"><Search className="h-3.5 w-3.5" /> {t({ uk: "Вид спорту", en: "Sport" })}</label>
      <input type="text" value={q} placeholder={t({ uk: "напр. футбол, бокс…", en: "e.g. football, boxing…" })} spellCheck={false} required
        onChange={(e) => { setQ(e.target.value); setPicked(false); if (e.target.value.trim().length < 2) setResults([]); onClear(); }}
        className={`${inputClass}${picked ? " border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/40" : ""}`} />
      {results.length > 0 && !picked && (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg">
          {results.map((s) => (
            <button key={s.code} type="button" onClick={() => { setQ(s.name); setPicked(true); setResults([]); onPick(s.code, s.name); }}
              className="w-full px-4 py-2 text-left text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/60">{s.name}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function AccidentOffers({ offers, loading, error, summary, onBack, onSelect }: {
  offers: AccidentOffer[];
  loading: boolean;
  error: string | null;
  summary: string;
  onBack: () => void;
  onSelect: (o: AccidentOffer) => void;
}) {
  const { t } = useI18n();
  const [sortBy, setSortBy] = useState<"price_asc" | "price_desc">("price_asc");
  const cards = [...offers].sort((a, b) => (sortBy === "price_desc" ? b.price - a.price : a.price - b.price));

  return (
    <div>
      <div className="mb-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-4 shadow-sm">
        <div className="mb-3 flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
          <button type="button" onClick={onBack} className="transition-colors hover:text-indigo-500" aria-label={t({ uk: "Змінити параметри", en: "Change parameters" })}>
            <Home className="h-3.5 w-3.5" />
          </button>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-zinc-600 dark:text-zinc-300">{t({ uk: "Нещасні випадки", en: "Accident insurance" })}</span>
        </div>
        <p className="font-bold text-zinc-900 dark:text-zinc-100" style={{ fontSize: 19 }}>{summary}</p>
      </div>

      {!loading && cards.length > 0 && (
        <div className="mb-5 flex items-center justify-end gap-3">
          <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">{t({ uk: "Сортувати", en: "Sort" })}</span>
          <div className="inline-flex items-center gap-1 rounded-full border border-zinc-200/70 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-1 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            {([
              { k: "price_asc", label: "Спершу дешевші", en: "Cheapest first", Icon: ArrowDownWideNarrow },
              { k: "price_desc", label: "Спершу дорожчі", en: "Most expensive first", Icon: ArrowUpWideNarrow },
            ] as const).map(({ k, label, en, Icon }) => (
              <button key={k} type="button" onClick={() => setSortBy(k)}
                className={`relative flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${sortBy === k ? "text-white" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"}`}>
                {sortBy === k && (
                  <motion.span layoutId="accidentSortPill" transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 shadow-sm shadow-indigo-500/30" />
                )}
                <Icon className="relative z-10 h-3.5 w-3.5" />
                <span className="relative z-10">{t({ uk: label, en })}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <SearchingInsurers />
      ) : error || cards.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-6 py-12 text-center">
          <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{t({ uk: "Пропозицій не знайдено", en: "No offers found" })}</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">{error ?? t({ uk: "Спробуйте іншу суму, строк або фактор ризику.", en: "Try a different sum, term or risk factor." })}</p>
          <Button variant="secondary" size="md" onClick={onBack} className="mt-5">{t({ uk: "Змінити параметри", en: "Change parameters" })}</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {cards.map((o, i) => (
            <OfferCard
              key={o.offerId}
              index={i}
              offer={toInsuranceOffer(o)}
              selected={false}
              selectedDgoId={null}
              selectedAutolawyerId={null}
              onSelect={() => {}}
              onSelectDgo={() => {}}
              onSelectAutolawyer={() => {}}
              onBuy={() => onSelect(o)}
              hideExtras
            />
          ))}
        </div>
      )}
    </div>
  );
}
