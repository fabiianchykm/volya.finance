"use client";

import { useState, useEffect, useRef } from "react";
import { useFlowReset } from "@/lib/nav-reset";
import { motion } from "framer-motion";
import { Home as HomeIcon, Building2, ShieldCheck, CalendarDays, ArrowRight, ChevronRight } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { DateInput, parseUaDate } from "@/components/ui/DateInput";
import { SearchingInsurers } from "@/components/insurance/SearchingInsurers";
import { OfferCard } from "@/components/insurance/OfferCard";
import { HousingCheckout, type HousingContext } from "./HousingCheckout";
import type { HomeOffer, InsuranceOffer } from "@/types/api";
import { trackEvent, trackCalc } from "@/lib/analytics";
import { useI18n, type Tr } from "@/lib/i18n";

// Страхування житла — потік як у Зеленій карти: темний герой (параметри) → світлий
// екран пропозицій. Ціна залежить від типу житла, суми покриття та строку.

const HOME_INSURERS = ["ВУСО", "ТАС", "ОРАНТА", "УНІКА", "УСГ", "КНЯЖА", "АРКС"];

const AMOUNTS = [500000, 700000, 1000000, 1500000, 2000000, 2500000, 3000000, 4000000, 5000000];
const PERIODS = ["5m", "6m", "7m", "8m", "9m", "10m", "11m", "12m"];

function fmtAmount(v: number, t: (tr: Tr) => string): string {
  if (v >= 1000000) return `${(v / 1000000).toLocaleString("uk-UA")} ${t({ uk: "млн грн", en: "M UAH" })}`;
  return `${(v / 1000).toLocaleString("uk-UA")} ${t({ uk: "тис. грн", en: "K UAH" })}`;
}
function fmtPeriod(p: string, t: (tr: Tr) => string): string {
  const n = parseInt(p, 10);
  const word = n === 1
    ? t({ uk: "місяць", en: n === 1 ? "month" : "months" })
    : n < 5
    ? t({ uk: "місяці", en: "months" })
    : t({ uk: "місяців", en: "months" });
  return `${n} ${word}`;
}

const selectClass =
  "h-11 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-indigo-400";

export function HousingFlow() {
  const { t } = useI18n();
  const [step, setStep] = useState<"params" | "offers" | "checkout">("params");
  useFlowReset(() => setStep("params"));

  const [homeType, setHomeType] = useState<"flat" | "house">("flat");
  const [amount, setAmount] = useState(1000000);
  const [period, setPeriod] = useState("12m");
  // Дата початку — за замовчуванням +14 днів. ІНГО (єдиний страховик житла) відхиляє
  // ранні дати: формально «не раніше +9», але фактично приймає лише пізніші, а в зоні
  // +9…+11 модуль ще й нестабільний (перевірено на проді). +14 — надійний запас.
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
  });

  const [offers, setOffers] = useState<HomeOffer[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<HomeOffer | null>(null);
  const [offersLoading, setOffersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Мінімальна дата старту — +14 днів (див. коментар вище): забороняємо ранні дати
  // у самому календарі, щоб не впертись у відмову/нестабільність модуля ІНГО.
  const minStart = new Date();
  minStart.setDate(minStart.getDate() + 14);
  minStart.setHours(0, 0, 0, 0);
  const maxStart = new Date();
  maxStart.setFullYear(maxStart.getFullYear() + 1);
  const startD = parseUaDate(startDate);

  const runCalc = async (ht: "flat" | "house", amt: number, per: string, sUa: string) => {
    const sD = parseUaDate(sUa);
    if (!sD) return;
    setError(null);
    setOffers([]);
    setOffersLoading(true);
    setStep("offers");
    window.history.replaceState(null, "", `?step=offers&homeType=${ht}&amount=${amt}&period=${per}&start=${encodeURIComponent(sUa)}`);
    trackEvent("calculate_cost", { product: "housing" });
    trackCalc("housing", { homeType: ht, amount: amt, period: per, start: sUa });
    try {
      const iso = `${sD.getFullYear()}-${String(sD.getMonth() + 1).padStart(2, "0")}-${String(sD.getDate()).padStart(2, "0")}`;
      const res = await fetch("/api/home", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ homeType: ht, insuranceAmount: amt, insurancePeriod: per, startFrom: iso }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) throw new Error(data?.error ?? t({ uk: "Не вдалося отримати пропозиції", en: "Failed to fetch offers" }));
      const list = ((data.offers ?? []) as HomeOffer[]).sort((a, b) => a.price - b.price);
      setOffers(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : t({ uk: "Не вдалося отримати пропозиції.", en: "Failed to fetch offers." }));
    } finally {
      setOffersLoading(false);
    }
  };

  const calc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startD) { setError(t({ uk: "Вкажіть дату початку", en: "Enter the start date" })); return; }
    void runCalc(homeType, amount, period, startDate);
  };

  // Відновлення з URL при перезавантаженні (крок оформлення не відновлюємо).
  const didRestore = useRef(false);
  useEffect(() => {
    if (didRestore.current) return;
    didRestore.current = true;
    const sp = new URLSearchParams(window.location.search);
    const ht = sp.get("homeType"); const amt = Number(sp.get("amount"));
    const per = sp.get("period"); const s = sp.get("start");
    if (sp.get("step") === "offers" && (ht === "flat" || ht === "house") && amt && per && s) {
      // Застаріла дата з URL (розрахунок робився раніше) може стати < +9 днів —
      // піднімаємо до мінімальної, інакше ІНГО відхилить замовлення.
      const sd = parseUaDate(s);
      const startStr = sd && sd >= minStart
        ? s
        : `${String(minStart.getDate()).padStart(2, "0")}.${String(minStart.getMonth() + 1).padStart(2, "0")}.${minStart.getFullYear()}`;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHomeType(ht); setAmount(amt); setPeriod(per); setStartDate(startStr);
      void runCalc(ht, amt, per, startStr);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkoutCtx = (offer: HomeOffer): HousingContext => ({
    offer, homeType, insuranceAmount: amount, insurancePeriod: period, startDate,
  });

  const summary = [homeType === "flat" ? t({ uk: "Квартира", en: "Apartment" }) : t({ uk: "Будинок", en: "House" }), fmtAmount(amount, t), fmtPeriod(period, t)].join(" · ");

  if (step === "offers" || step === "checkout") {
    return (
      <>
        <Navbar solid />
        <section className="min-h-screen pt-20 pb-10">
          <div className={`mx-auto px-4 sm:px-6 ${step === "offers" ? "max-w-[1200px]" : "max-w-3xl"}`}>
            {step === "offers" ? (
              <HousingOffers
                offers={offers}
                loading={offersLoading}
                error={error}
                summary={summary}
                onBack={() => { setError(null); setStep("params"); window.history.replaceState(null, "", window.location.pathname); }}
                onSelect={(o) => { setSelectedOffer(o); setStep("checkout"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              />
            ) : selectedOffer ? (
              <HousingCheckout ctx={checkoutCtx(selectedOffer)} onBack={() => setStep("offers")} />
            ) : null}
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <section
        className="relative overflow-x-hidden pb-20 pt-32 sm:pb-28 sm:pt-40 animate-gradient"
        style={{ backgroundImage: "linear-gradient(135deg, #06040f, #0f0c29, #1e1060, #4f46e5, #7c3aed, #1e1060, #06040f)" }}
      >
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 60% at 50% 48%, transparent 0%, rgba(0,0,0,0.1) 100%)" }} />

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 w-full">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-8 text-center">
            <div className="space-y-4">
              <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
                {t({ uk: "Страхування житла", en: "Property insurance" })}
                <span className="mt-1 block bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                  {t({ uk: "квартира або будинок", en: "apartment or house" })}
                </span>
              </h1>
              <p className="mx-auto max-w-xl text-base text-zinc-300">{t({ uk: "Захист від пожежі, затоплення, стихії та інших ризиків. Оберіть параметри — і побачите ціни страхових.", en: "Protection against fire, flooding, natural disasters and other risks. Choose the parameters — and see insurers' prices." })}</p>
            </div>

            <form onSubmit={calc} className="mx-auto max-w-2xl rounded-2xl bg-white dark:bg-zinc-900 p-5 text-left shadow-2xl sm:p-7">
              {/* Тип житла */}
              <div className="mb-4 grid grid-cols-2 gap-2">
                {([{ v: "flat", label: t({ uk: "Квартира", en: "Apartment" }), Icon: Building2 }, { v: "house", label: t({ uk: "Будинок", en: "House" }), Icon: HomeIcon }] as const).map(({ v, label, Icon }) => (
                  <button key={v} type="button" onClick={() => setHomeType(v)}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                      homeType === v ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-200 dark:ring-indigo-900" : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-indigo-200"
                    }`}>
                    <Icon className="h-4 w-4" /> {label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400"><ShieldCheck className="h-3.5 w-3.5" /> {t({ uk: "Сума покриття", en: "Coverage amount" })}</label>
                  <select value={amount} onChange={(e) => setAmount(Number(e.target.value))} className={selectClass}>
                    {AMOUNTS.map((a) => <option key={a} value={a}>{fmtAmount(a, t)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400"><CalendarDays className="h-3.5 w-3.5" /> {t({ uk: "Строк", en: "Term" })}</label>
                  <select value={period} onChange={(e) => setPeriod(e.target.value)} className={selectClass}>
                    {PERIODS.map((p) => <option key={p} value={p}>{fmtPeriod(p, t)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400"><CalendarDays className="h-3.5 w-3.5" /> {t({ uk: "Дата початку", en: "Start date" })}</label>
                  <DateInput label="" value={startDate} onChange={setStartDate} minDate={minStart} maxDate={maxStart} required />
                </div>
              </div>

              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

              <Button type="submit" variant="primary" size="lg" disabled={!startD} className="mt-5 w-full">
                <span className="flex items-center gap-2">{t({ uk: "Розрахувати вартість", en: "Calculate cost" })} <ArrowRight className="h-5 w-5" /></span>
              </Button>
            </form>
          </motion.div>
        </div>
      </section>
    </>
  );
}

function HousingOffers({
  offers, loading, error, summary, onBack, onSelect,
}: {
  offers: HomeOffer[];
  loading: boolean;
  error: string | null;
  summary: string;
  onBack: () => void;
  onSelect: (o: HomeOffer) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="flex flex-col items-start gap-6 lg:flex-row">
        <div className="min-w-0 flex-1">
          <div className="mb-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-4 shadow-sm">
            <div className="mb-3 flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
              <button type="button" onClick={onBack} className="transition-colors hover:text-indigo-500" aria-label={t({ uk: "Змінити параметри", en: "Change parameters" })}>
                <HomeIcon className="h-3.5 w-3.5" />
              </button>
              <ChevronRight className="h-3 w-3" />
              <span className="font-medium text-zinc-600 dark:text-zinc-300">{t({ uk: "Страхування житла", en: "Property insurance" })}</span>
            </div>
            <p className="font-bold text-zinc-900 dark:text-zinc-100" style={{ fontSize: 19 }}>{summary}</p>
          </div>

          {loading ? (
            <>
              <SearchingInsurers names={HOME_INSURERS} />
              {Array.from({ length: 4 }).map((_, i) => <HousingSkeleton key={i} />)}
            </>
          ) : error || offers.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-6 py-12 text-center">
              <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{error ? t({ uk: "Не вдалося отримати пропозиції", en: "Failed to fetch offers" }) : t({ uk: "Пропозицій не знайдено", en: "No offers found" })}</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">{error ? t({ uk: "Спробуйте ще раз або змініть параметри.", en: "Try again or change the parameters." }) : t({ uk: "Спробуйте інші параметри.", en: "Try other parameters." })}</p>
              <Button variant="secondary" size="md" onClick={onBack} className="mt-5">{t({ uk: "Змінити параметри", en: "Change parameters" })}</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {offers.map((o, i) => (
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

      </div>
    </div>
  );
}

function toInsuranceOffer(o: HomeOffer): InsuranceOffer {
  return {
    offerId: o.offerId,
    price: o.price,
    company: { ...(o.company ?? {}), publicName: o.companyNamePublic || o.companyName, logo: o.company?.logo ?? null },
    listDgo: [],
    listAutolawyer: [],
  } as unknown as InsuranceOffer;
}

function HousingSkeleton() {
  return (
    <div className="mb-3 animate-pulse rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 py-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
          <div className="space-y-2">
            <div className="h-4 w-36 rounded bg-zinc-100 dark:bg-zinc-800" />
            <div className="h-3 w-20 rounded bg-zinc-100 dark:bg-zinc-800" />
          </div>
        </div>
        <div className="h-9 w-24 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
      </div>
    </div>
  );
}
