"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Home as HomeIcon, Building2, ShieldCheck, CalendarDays, ArrowRight, ChevronRight } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { DateInput, parseUaDate } from "@/components/ui/DateInput";
import { SearchingInsurers } from "@/components/insurance/SearchingInsurers";
import { OfferCard } from "@/components/insurance/OfferCard";
import { HousingCheckout, type HousingContext } from "./HousingCheckout";
import type { HomeOffer, InsuranceOffer } from "@/types/api";
import { trackEvent } from "@/lib/analytics";

// Страхування житла — потік як у Зеленій карти: темний герой (параметри) → світлий
// екран пропозицій. Ціна залежить від типу житла, суми покриття та строку.

const HOME_INSURERS = ["ВУСО", "ТАС", "ОРАНТА", "УНІКА", "УСГ", "КНЯЖА", "АРКС"];

const AMOUNTS = [500000, 700000, 1000000, 1500000, 2000000, 2500000, 3000000, 4000000, 5000000];
const PERIODS = ["5m", "6m", "7m", "8m", "9m", "10m", "11m", "12m"];

function fmtAmount(v: number): string {
  if (v >= 1000000) return `${(v / 1000000).toLocaleString("uk-UA")} млн грн`;
  return `${(v / 1000).toLocaleString("uk-UA")} тис. грн`;
}
function fmtPeriod(p: string): string {
  const n = parseInt(p, 10);
  const word = n === 1 ? "місяць" : n < 5 ? "місяці" : "місяців";
  return `${n} ${word}`;
}

const selectClass =
  "h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-indigo-400";

export function HousingFlow() {
  const [step, setStep] = useState<"params" | "offers" | "checkout">("params");

  const [homeType, setHomeType] = useState<"flat" | "house">("flat");
  const [amount, setAmount] = useState(1000000);
  const [period, setPeriod] = useState("12m");
  // Дата початку — сьогодні або пізніше; за замовчуванням найближча (сьогодні).
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
  });

  const [offers, setOffers] = useState<HomeOffer[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<HomeOffer | null>(null);
  const [offersLoading, setOffersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
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
    try {
      const iso = `${sD.getFullYear()}-${String(sD.getMonth() + 1).padStart(2, "0")}-${String(sD.getDate()).padStart(2, "0")}`;
      const res = await fetch("/api/home", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ homeType: ht, insuranceAmount: amt, insurancePeriod: per, startFrom: iso }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) throw new Error(data?.error ?? "Не вдалося отримати пропозиції");
      const list = ((data.offers ?? []) as HomeOffer[]).sort((a, b) => a.price - b.price);
      setOffers(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося отримати пропозиції.");
    } finally {
      setOffersLoading(false);
    }
  };

  const calc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startD) { setError("Вкажіть дату початку"); return; }
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHomeType(ht); setAmount(amt); setPeriod(per); setStartDate(s);
      void runCalc(ht, amt, per, s);
    }
     
  }, []);

  const checkoutCtx = (offer: HomeOffer): HousingContext => ({
    offer, homeType, insuranceAmount: amount, insurancePeriod: period, startDate,
  });

  const summary = [homeType === "flat" ? "Квартира" : "Будинок", fmtAmount(amount), fmtPeriod(period)].join(" · ");

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
                Страхування житла
                <span className="mt-1 block bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                  квартира або будинок
                </span>
              </h1>
              <p className="mx-auto max-w-xl text-base text-zinc-300">Захист від пожежі, затоплення, стихії та інших ризиків. Оберіть параметри — і побачите ціни страхових.</p>
            </div>

            <form onSubmit={calc} className="mx-auto max-w-2xl rounded-2xl bg-white p-5 text-left shadow-2xl sm:p-7">
              {/* Тип житла */}
              <div className="mb-4 grid grid-cols-2 gap-2">
                {([{ v: "flat", label: "Квартира", Icon: Building2 }, { v: "house", label: "Будинок", Icon: HomeIcon }] as const).map(({ v, label, Icon }) => (
                  <button key={v} type="button" onClick={() => setHomeType(v)}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                      homeType === v ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200" : "border-zinc-200 bg-white text-zinc-600 hover:border-indigo-200"
                    }`}>
                    <Icon className="h-4 w-4" /> {label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-500"><ShieldCheck className="h-3.5 w-3.5" /> Сума покриття</label>
                  <select value={amount} onChange={(e) => setAmount(Number(e.target.value))} className={selectClass}>
                    {AMOUNTS.map((a) => <option key={a} value={a}>{fmtAmount(a)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-500"><CalendarDays className="h-3.5 w-3.5" /> Строк</label>
                  <select value={period} onChange={(e) => setPeriod(e.target.value)} className={selectClass}>
                    {PERIODS.map((p) => <option key={p} value={p}>{fmtPeriod(p)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-500"><CalendarDays className="h-3.5 w-3.5" /> Дата початку</label>
                  <DateInput label="" value={startDate} onChange={setStartDate} minDate={today} maxDate={maxStart} required />
                </div>
              </div>

              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

              <Button type="submit" variant="primary" size="lg" disabled={!startD} className="mt-5 w-full">
                <span className="flex items-center gap-2">Розрахувати вартість <ArrowRight className="h-5 w-5" /></span>
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
  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="flex flex-col items-start gap-6 lg:flex-row">
        <div className="min-w-0 flex-1">
          <div className="mb-6 rounded-2xl border border-zinc-100 bg-white px-6 py-4 shadow-sm">
            <div className="mb-3 flex items-center gap-1.5 text-xs text-zinc-400">
              <button type="button" onClick={onBack} className="transition-colors hover:text-indigo-500" aria-label="Змінити параметри">
                <HomeIcon className="h-3.5 w-3.5" />
              </button>
              <ChevronRight className="h-3 w-3" />
              <span className="font-medium text-zinc-600">Страхування житла</span>
            </div>
            <p className="font-bold text-zinc-900" style={{ fontSize: 19 }}>{summary}</p>
          </div>

          {loading ? (
            <>
              <SearchingInsurers names={HOME_INSURERS} />
              {Array.from({ length: 4 }).map((_, i) => <HousingSkeleton key={i} />)}
            </>
          ) : error || offers.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-12 text-center">
              <p className="text-base font-semibold text-zinc-900">{error ? "Не вдалося отримати пропозиції" : "Пропозицій не знайдено"}</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-500">{error ? "Спробуйте ще раз або змініть параметри." : "Спробуйте інші параметри."}</p>
              <Button variant="secondary" size="md" onClick={onBack} className="mt-5">Змінити параметри</Button>
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
    company: { publicName: o.companyNamePublic || o.companyName, logo: o.company?.logo ?? null },
    listDgo: [],
    listAutolawyer: [],
  } as unknown as InsuranceOffer;
}

function HousingSkeleton() {
  return (
    <div className="mb-3 animate-pulse rounded-2xl border border-zinc-100 bg-white px-5 py-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-zinc-100" />
          <div className="space-y-2">
            <div className="h-4 w-36 rounded bg-zinc-100" />
            <div className="h-3 w-20 rounded bg-zinc-100" />
          </div>
        </div>
        <div className="h-9 w-24 rounded-xl bg-zinc-100" />
      </div>
    </div>
  );
}
