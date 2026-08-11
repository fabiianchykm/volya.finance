"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, ArrowRight, Home, ChevronRight, ChevronDown, ShieldCheck, Loader2, Phone } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { parseUaDate } from "@/components/ui/DateInput";
import { SearchingInsurers } from "@/components/insurance/SearchingInsurers";
import { OfferCard } from "@/components/insurance/OfferCard";
import { InviteFriendCard } from "@/components/insurance/InviteFriendCard";
import { LeadModal, type LeadMode } from "@/components/layout/LeadModal";
import { MiniKaskoCheckout, type MiniKaskoContext } from "./MiniKaskoCheckout";
import { cityShort, cityLong } from "@/lib/utils";
import type { MiniKaskoOffer, InsuranceOffer } from "@/types/api";
import { trackEvent } from "@/lib/analytics";

// Міні-КАСКО — потік як у Зеленій карти: темний герой (місто + дата) → світлий
// екран пропозицій із вкладками покриття (400k/800k/1.2M) і картками СК.

const MK_INSURERS = ["ВУСО", "ТАС", "ОРАНТА", "УНІКА", "УСГ", "АРКС", "КНЯЖА"];

interface CityOption { id: number; name_ua: string; name_full_name_ua: string; zone: number }

const inputCls =
  "h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500";

function fmtCoverage(v: number): string {
  return `${(v / 1000).toLocaleString("uk-UA")} тис. грн`;
}

export function MiniKaskoFlow() {
  const [step, setStep] = useState<"params" | "offers" | "checkout">("params");

  // Місто (автопідбір) + дата початку.
  const [cityQuery, setCityQuery] = useState("");
  const [cityResults, setCityResults] = useState<CityOption[]>([]);
  const [cityLoading, setCityLoading] = useState(false);
  const [selectedCity, setSelectedCity] = useState<CityOption | null>(null);
  const cityRef = useRef<HTMLDivElement>(null);

  // Прогрів кешу міст на сервері: перший запит будує повний довідник (кілька сек),
  // тож робимо його заздалегідь — поки користувач читає, кеш уже готовий.
  useEffect(() => { fetch("/api/vehicle/cities?q=ки").catch(() => {}); }, []);
  // Дата — найближча можлива (завтра); поля на екрані нема, встановлюється автоматично.
  const [startDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
  });

  const [offers, setOffers] = useState<MiniKaskoOffer[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<MiniKaskoOffer | null>(null);
  const [offersLoading, setOffersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Дата авто = найближча можлива (завтра); поля на екрані нема.
  const startD = parseUaDate(startDate);

  useEffect(() => {
    if (!cityQuery || cityQuery.length < 2 || selectedCity) return;
    let active = true;
    const t = setTimeout(async () => {
      setCityLoading(true);
      try {
        const res = await fetch(`/api/vehicle/cities?q=${encodeURIComponent(cityQuery)}`);
        const json = await res.json();
        if (active && json.success) setCityResults(json.data);
      } finally {
        if (active) setCityLoading(false);
      }
    }, 200);
    return () => { active = false; clearTimeout(t); };
  }, [cityQuery, selectedCity]);

  // Розрахунок для конкретного міста. Пише параметри в URL (несенситивні: місто),
  // щоб перезавантаження одразу показувало пропозиції. Персональні дані в URL НЕ йдуть.
  const runCalc = async (city: CityOption) => {
    setError(null);
    setOffers([]);
    setOffersLoading(true);
    setStep("offers");
    const cn = cityShort(city.name_full_name_ua || city.name_ua);
    window.history.replaceState(null, "", `?step=offers&cityId=${city.id}&cityName=${encodeURIComponent(cn)}`);
    trackEvent("calculate_cost", { product: "mini-kasko" });
    try {
      const d = startD ?? new Date();
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const res = await fetch("/api/mini-kasko", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ start_date: iso, city_id: city.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) throw new Error(data?.error ?? "Не вдалося отримати пропозиції");
      setOffers((data.offers ?? []) as MiniKaskoOffer[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося отримати пропозиції.");
    } finally {
      setOffersLoading(false);
    }
  };

  const calc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCity) { setError("Оберіть місто зі списку"); return; }
    if (!startD) { setError("Вкажіть дату початку"); return; }
    void runCalc(selectedCity);
  };

  // Відновлення з URL при перезавантаженні: якщо є місто й step=offers — одразу
  // показуємо пропозиції (крок оформлення НЕ відновлюємо — персональні дані не в URL).
  const didRestore = useRef(false);
  useEffect(() => {
    if (didRestore.current) return;
    didRestore.current = true;
    const sp = new URLSearchParams(window.location.search);
    const cityId = Number(sp.get("cityId"));
    const cityName = sp.get("cityName");
    if (sp.get("step") === "offers" && cityId && cityName) {
      const c: CityOption = { id: cityId, name_ua: cityName, name_full_name_ua: cityName, zone: 0 };
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedCity(c);
      setCityQuery(cityName);
      void runCalc(c);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkoutCtx = (offer: MiniKaskoOffer): MiniKaskoContext => ({
    offer,
    startDate,
    city: selectedCity,
  });

  // ── Світлий екран: пропозиції / оформлення ──
  if (step === "offers" || step === "checkout") {
    return (
      <>
        <Navbar solid />
        <section className="min-h-screen pt-20 pb-10">
          <div className={`mx-auto px-4 sm:px-6 ${step === "offers" ? "max-w-[1200px]" : "max-w-3xl"}`}>
            {step === "offers" ? (
              <MiniKaskoOffers
                offers={offers}
                loading={offersLoading}
                error={error}
                summary={[cityShort(selectedCity?.name_full_name_ua || selectedCity?.name_ua || ""), startDate].filter(Boolean).join(" · ")}
                onBack={() => { setError(null); setStep("params"); window.history.replaceState(null, "", window.location.pathname); }}
                onSelect={(o) => { setSelectedOffer(o); setStep("checkout"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              />
            ) : selectedOffer ? (
              <MiniKaskoCheckout ctx={checkoutCtx(selectedOffer)} onBack={() => setStep("offers")} />
            ) : null}
          </div>
        </section>
      </>
    );
  }

  // ── Темний герой: місто + дата ──
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
                Міні-КАСКО
                <span className="mt-1 block bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                  бюджетний захист авто
                </span>
              </h1>
              <p className="mx-auto max-w-xl text-base text-zinc-300">Оберіть місто — і побачите ціни страхових із покриттям до 1,2 млн грн.</p>
            </div>

            <form onSubmit={calc} className="mx-auto max-w-md rounded-2xl bg-white p-5 text-left shadow-2xl sm:p-7">
              <div className="relative" ref={cityRef}>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-500"><MapPin className="h-3.5 w-3.5" /> Місто реєстрації авто</label>
                <input type="text" value={cityQuery} placeholder="Почніть вводити місто…" spellCheck={false}
                  onChange={(e) => { setCityQuery(e.target.value); setSelectedCity(null); }}
                  className={`${inputCls} pr-10${selectedCity ? " border-emerald-400 bg-emerald-50/40" : ""}`} />
                {cityLoading && !selectedCity && cityQuery.length >= 2 && (
                  <Loader2 className="pointer-events-none absolute right-3 top-[2.15rem] h-4 w-4 animate-spin text-indigo-500" />
                )}
                {cityResults.length > 0 && !selectedCity && cityQuery.length >= 2 && (
                  <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
                    {cityResults.map((c) => (
                      <button key={c.id} type="button"
                        onClick={() => { setSelectedCity(c); setCityQuery(cityShort(c.name_full_name_ua || c.name_ua)); setCityResults([]); }}
                        className="w-full px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50">{cityLong(c.name_full_name_ua || c.name_ua)}</button>
                    ))}
                  </div>
                )}
              </div>

              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

              <Button type="submit" variant="primary" size="lg" disabled={!selectedCity || !startD} className="mt-5 w-full">
                <span className="flex items-center gap-2">Розрахувати вартість <ArrowRight className="h-5 w-5" /></span>
              </Button>
            </form>
          </motion.div>
        </div>
      </section>
    </>
  );
}

// ── Світлий екран пропозицій: вкладки покриття + картки СК ──
function MiniKaskoOffers({
  offers, loading, error, summary, onBack, onSelect,
}: {
  offers: MiniKaskoOffer[];
  loading: boolean;
  error: string | null;
  summary: string;
  onBack: () => void;
  onSelect: (o: MiniKaskoOffer) => void;
}) {
  // Доступні рівні покриття (за зростанням) з відповіді калькулятора.
  const coverages = Array.from(new Set(offers.map((o) => o.coverage))).sort((a, b) => a - b);
  const [coverage, setCoverage] = useState<number | null>(null);
  const [cvOpen, setCvOpen] = useState(false);
  const [leadMode, setLeadMode] = useState<LeadMode>(null);
  const activeCoverage = coverage ?? coverages[0] ?? null;
  const list = offers.filter((o) => o.coverage === activeCoverage).sort((a, b) => a.price - b.price);

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="flex flex-col items-start gap-6 lg:flex-row">
        <div className="min-w-0 flex-1">
          {/* Картка-підсумок */}
          <div className="mb-6 rounded-2xl border border-zinc-100 bg-white px-6 py-4 shadow-sm">
            <div className="mb-3 flex items-center gap-1.5 text-xs text-zinc-400">
              <button type="button" onClick={onBack} className="transition-colors hover:text-indigo-500" aria-label="Змінити параметри">
                <Home className="h-3.5 w-3.5" />
              </button>
              <ChevronRight className="h-3 w-3" />
              <span className="font-medium text-zinc-600">Міні-КАСКО</span>
            </div>
            <p className="font-bold text-zinc-900" style={{ fontSize: 19 }}>{summary || "Ваше авто"}</p>
          </div>

          {/* Покриття — дропдаун із підказкою «від N грн» на кожен рівень */}
          {!loading && coverages.length > 0 && activeCoverage != null && (
            <div className="relative mb-5 inline-block">
              <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-400"><ShieldCheck className="h-3.5 w-3.5" /> Сума покриття</span>
              <button
                type="button"
                onClick={() => setCvOpen((o) => !o)}
                aria-expanded={cvOpen}
                className="flex min-w-[240px] items-center justify-between gap-3 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm ring-1 ring-zinc-200 transition-colors hover:ring-indigo-300"
              >
                <span>{fmtCoverage(activeCoverage)}</span>
                <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform ${cvOpen ? "rotate-180" : ""}`} />
              </button>
              {cvOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setCvOpen(false)} />
                  <div className="absolute left-0 top-full z-20 mt-2 w-[280px] overflow-hidden rounded-xl border border-zinc-100 bg-white p-1.5 shadow-xl">
                    {coverages.map((cv) => (
                      <button
                        key={cv}
                        type="button"
                        onClick={() => { setCoverage(cv); setCvOpen(false); }}
                        className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                          activeCoverage === cv ? "bg-indigo-50" : "hover:bg-zinc-50"
                        }`}
                      >
                        <span className="flex flex-col">
                          <span className="text-sm font-semibold text-zinc-900">{fmtCoverage(cv)}</span>
                          <span className="text-xs text-zinc-400">максимальна виплата</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {loading ? (
            <>
              <SearchingInsurers names={MK_INSURERS} />
              {Array.from({ length: 4 }).map((_, i) => <MiniKaskoSkeleton key={i} />)}
            </>
          ) : error || offers.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-12 text-center">
              <p className="text-base font-semibold text-zinc-900">{error ? "Не вдалося отримати пропозиції" : "Пропозицій не знайдено"}</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-500">{error ? "Спробуйте ще раз або змініть параметри." : "Спробуйте іншу дату чи місто."}</p>
              <Button variant="secondary" size="md" onClick={onBack} className="mt-5">Змінити параметри</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {list.map((o, i) => (
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

          {/* Прорахунок консультантом — додаткова можливість поруч із пропозиціями */}
          {!loading && (
            <div className="mt-4 flex flex-col items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
                  <Phone className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">Потрібен індивідуальний прорахунок?</p>
                  <p className="text-xs text-zinc-500">Залиште номер — консультант прорахує найкращий варіант і передзвонить.</p>
                </div>
              </div>
              <Button type="button" variant="secondary" size="md" onClick={() => setLeadMode("phone")} className="shrink-0">
                Замовити прорахунок
              </Button>
            </div>
          )}
        </div>

        <InviteFriendCard />
      </div>

      <LeadModal mode={leadMode} source="Міні-КАСКО — прорахунок консультанта" onClose={() => setLeadMode(null)} />
    </div>
  );
}

// Мапимо офер міні-КАСКО у InsuranceOffer, щоб переюзати OSAGO OfferCard.
function toInsuranceOffer(o: MiniKaskoOffer): InsuranceOffer {
  return {
    offerId: o.offerId,
    price: o.price,
    company: { publicName: o.companyNamePublic || o.companyName, logo: o.logo ?? null },
    listDgo: [],
    listAutolawyer: [],
  } as unknown as InsuranceOffer;
}

function MiniKaskoSkeleton() {
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
