"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { MapPin, CalendarDays, ArrowRight, Car, Home, ChevronRight, ChevronDown, ArrowDownWideNarrow, ArrowUpWideNarrow, Globe, FileText, CreditCard, Download } from "lucide-react";
import { HeroSteps } from "@/components/sections/HeroSteps";
import { useI18n } from "@/lib/i18n";

const GC_STEPS = [
  { icon: Globe, label: "Країна та авто", en: "Country & car" },
  { icon: FileText, label: "Пропозиції", en: "Offers" },
  { icon: CreditCard, label: "Оплата", en: "Payment" },
  { icon: Download, label: "Готовий поліс", en: "Ready policy" },
];
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { parseUaDate } from "@/components/ui/DateInput";
import { DateRangeInput, daysBetween } from "@/components/ui/DateRangeInput";
import { SearchingInsurers } from "@/components/insurance/SearchingInsurers";
import { OfferCard } from "@/components/insurance/OfferCard";
import { GreenCardCheckout, type GreenCardContext } from "./GreenCardCheckout";
import type { GreenCardOffer, InsuranceOffer } from "@/types/api";
import type { VehicleData } from "@/types/insurance";
import { trackEvent, trackCalc } from "@/lib/analytics";

// Зелена карта — потік і дизайн як в ОСЦПВ: темний герой для вводу номера/параметрів,
// далі СВІТЛИЙ екран пропозицій (як OffersSection) з карткою-підсумком, сортуванням,
// лоадером перебору страхових і картками пропозицій.

const TERRITORIES = [
  { value: "60", label: "Європа", en: "Europe" },
  { value: "117", label: "Молдова", en: "Moldova" },
];

// Страхові Зеленої карти — для лоадера (перебір назв).
const GC_INSURERS = ["УСГ", "ВУСО", "ТАС", "УТІКО", "ОРАНТА", "ІНГО", "АРКС", "КНЯЖА"];

// periodOption Зеленої карти дискретний: 15/21 = дні, 1..12 = місяці. Користувач
// обирає діапазон дат, а ми підбираємо НАЙМЕНШИЙ період ЗК, що покриває поїздку.
function periodFromDays(days: number): { value: number; label: { uk: string; en: string } } {
  if (days <= 15) return { value: 15, label: { uk: "15 днів", en: "15 days" } };
  if (days <= 21) return { value: 21, label: { uk: "21 день", en: "21 days" } };
  const m = Math.min(12, Math.ceil(days / 30));
  return { value: m, label: { uk: `${m} ${m === 1 ? "місяць" : m < 5 ? "місяці" : "місяців"}`, en: `${m} ${m === 1 ? "month" : "months"}` } };
}

// Для зеленої карти достатньо КАТЕГОРІЇ авто (ціна залежить від неї), а не номера.
const CAR_TYPES = [
  { value: "B", label: "Легковий автомобіль", en: "Car" },
  { value: "C", label: "Вантажний автомобіль", en: "Truck" },
  { value: "D", label: "Автобус", en: "Bus" },
  { value: "A", label: "Мотоцикл / мопед", en: "Motorcycle / moped" },
  { value: "E", label: "Причіп", en: "Trailer" },
];

const selectClass =
  "h-11 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-indigo-400";

export function GreenCardFlow() {
  const { t } = useI18n();
  const [step, setStep] = useState<"params" | "offers" | "checkout">("params");

  // Для ЦІНИ достатньо типу авто; номер/марку/модель збираємо на кроці оформлення.
  const [carType, setCarType] = useState("B");

  const [territory, setTerritory] = useState("60");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [offers, setOffers] = useState<GreenCardOffer[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<GreenCardOffer | null>(null);
  const [offersLoading, setOffersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const maxStart = new Date();
  maxStart.setFullYear(maxStart.getFullYear() + 1);

  const startD = parseUaDate(startDate);
  const endD = parseUaDate(endDate);
  const period = startD && endD ? periodFromDays(daysBetween(startD, endD)) : null;
  const territoryDef = TERRITORIES.find((x) => x.value === territory);
  const territoryLabel = territoryDef ? t({ uk: territoryDef.label, en: territoryDef.en }) : "";
  const carTypeDef = CAR_TYPES.find((x) => x.value === carType);
  const carTypeLabel = carTypeDef ? t({ uk: carTypeDef.label, en: carTypeDef.en }) : "";

  // Розрахунок за явними параметрами (щоб можна було відновити з URL). Несенситивні
  // параметри (тип авто, територія, дати) пишемо в URL — reload одразу дасть пропозиції.
  const runCalc = async (ct: string, terr: string, sUa: string, eUa: string) => {
    const sD = parseUaDate(sUa);
    const eD = parseUaDate(eUa);
    const per = sD && eD ? periodFromDays(daysBetween(sD, eD)) : null;
    if (!sD || !per) return;
    setError(null);
    setOffers([]);
    setOffersLoading(true);
    setStep("offers");
    window.history.replaceState(null, "", `?step=offers&carType=${ct}&territory=${terr}&start=${encodeURIComponent(sUa)}&end=${encodeURIComponent(eUa)}`);
    trackEvent("calculate_cost", { product: "greencard" });
    trackCalc("greencard", { carType: ct, territory: terr, start: sUa, end: eUa });
    try {
      const iso = `${sD.getFullYear()}-${String(sD.getMonth() + 1).padStart(2, "0")}-${String(sD.getDate()).padStart(2, "0")}`;
      const res = await fetch("/api/greencard", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          country: Number(terr),
          userType: 1,
          startDate: iso,
          periodOption: per.value,
          carType: ct,
          // carNumber на калькуляторі не шлемо — ціна ЗК від номера не залежить
          // (лише тип авто + країна + період). Реальний номер збираємо на оформленні.
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) throw new Error(data?.error ?? t({ uk: "Не вдалося отримати пропозиції", en: "Could not fetch offers" }));
      const list: GreenCardOffer[] = (data.offers ?? []).filter((o: GreenCardOffer) => o && o.price > 0);
      list.sort((a, b) => a.price - b.price);
      setOffers(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : t({ uk: "Не вдалося отримати пропозиції.", en: "Could not fetch offers." }));
    } finally {
      setOffersLoading(false);
    }
  };

  const calc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startD || !period) return;
    void runCalc(carType, territory, startDate, endDate);
  };

  // Відновлення з URL при перезавантаженні (крок оформлення не відновлюємо).
  const didRestore = useRef(false);
  useEffect(() => {
    if (didRestore.current) return;
    didRestore.current = true;
    const sp = new URLSearchParams(window.location.search);
    const ct = sp.get("carType"); const terr = sp.get("territory");
    const s = sp.get("start"); const en = sp.get("end");
    if (sp.get("step") === "offers" && ct && terr && s && en) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCarType(ct); setTerritory(terr); setStartDate(s); setEndDate(en);
      void runCalc(ct, terr, s, en);
    }
     
  }, []);

  const checkoutCtx = (offer: GreenCardOffer): GreenCardContext => ({
    offer, country: Number(territory), periodOption: period?.value ?? 15,
    carType, startDate,
    // Дані авто (номер/марка/модель) користувач заповнить на кроці оформлення.
    vehicle: { number: "", vin: "", year: 0, model: "", mark: "", autoCategory: carType, cityId: 1, cityName: "", zone: 1 } as VehicleData,
  });

  // ── Світлий екран: пропозиції / оформлення (як OSAGO OffersSection) ──
  if ((step === "offers" || step === "checkout")) {
    return (
      <>
        <Navbar solid />
        <section className="min-h-screen pt-20 pb-10">
          <div className={`mx-auto px-4 sm:px-6 ${step === "offers" ? "max-w-[1200px]" : "max-w-3xl"}`}>
            {step === "offers" ? (
              <GreenCardOffers
                offers={offers}
                loading={offersLoading}
                error={error}
                vehicle={null}
                summary={[carTypeLabel, territoryLabel, period ? t(period.label) : ""].filter(Boolean).join(" · ")}
                onBack={() => { setError(null); setStep("params"); window.history.replaceState(null, "", window.location.pathname); }}
                onSelect={(o) => { setSelectedOffer(o); setStep("checkout"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              />
            ) : selectedOffer ? (
              <GreenCardCheckout ctx={checkoutCtx(selectedOffer)} onBack={() => setStep("offers")} />
            ) : null}
          </div>
        </section>
      </>
    );
  }

  // ── Темний герой: ввід номера / параметрів ──
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
                {t({ uk: "Зелена карта", en: "Green Card" })}
                <span className="mt-1 block bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                  {t({ uk: "страховка для виїзду за кордон", en: "insurance for travel abroad" })}
                </span>
              </h1>
              <p className="mx-auto max-w-xl text-base text-zinc-300">{t({ uk: "Оберіть тип авто, напрямок і дати — і побачите ціни страхових.", en: "Choose your vehicle type, destination and dates — and see insurers' prices." })}</p>
            </div>

            {step === "params" && <HeroSteps steps={GC_STEPS.map((s) => ({ icon: s.icon, label: t({ uk: s.label, en: s.en }) }))} />}

            {step === "params" && (
              <form onSubmit={calc} className="rounded-2xl bg-white dark:bg-zinc-900 p-5 text-left shadow-2xl sm:p-7">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400"><Car className="h-3.5 w-3.5" /> {t({ uk: "Тип авто", en: "Vehicle type" })}</label>
                    <select value={carType} onChange={(e) => setCarType(e.target.value)} className={selectClass}>
                      {CAR_TYPES.map((c) => <option key={c.value} value={c.value}>{t({ uk: c.label, en: c.en })}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400"><MapPin className="h-3.5 w-3.5" /> {t({ uk: "Куди прямуєте?", en: "Where are you heading?" })}</label>
                    <select value={territory} onChange={(e) => setTerritory(e.target.value)} className={selectClass}>
                      {TERRITORIES.map((z) => <option key={z.value} value={z.value}>{t({ uk: z.label, en: z.en })}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400"><CalendarDays className="h-3.5 w-3.5" /> {t({ uk: "Дати поїздки", en: "Trip dates" })}</label>
                    <DateRangeInput start={startDate} end={endDate} onChange={(s, e) => { setStartDate(s); setEndDate(e); }} minDate={today} maxDate={maxStart} />
                  </div>
                </div>

                {period && (
                  <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">{t({ uk: "Поліс Зелена карта: ", en: "Green Card policy: " })}<span className="font-semibold text-zinc-700 dark:text-zinc-200">{t(period.label)}</span> <span className="text-zinc-400 dark:text-zinc-500">{t({ uk: "(мінімальний термін — 15 днів)", en: "(minimum term — 15 days)" })}</span></p>
                )}

                {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

                <Button type="submit" variant="primary" size="lg" disabled={!period} className="mt-5 w-full">
                  <span className="flex items-center gap-2">
                    {t({ uk: "Розрахувати вартість", en: "Calculate cost" })} <ArrowRight className="h-5 w-5" />
                  </span>
                </Button>
              </form>
            )}
          </motion.div>
        </div>
      </section>
    </>
  );
}

// ── Світлий екран пропозицій (дзеркалить OSAGO OffersSection) ──
function GreenCardOffers({
  offers, loading, error, vehicle, summary, onBack, onSelect,
}: {
  offers: GreenCardOffer[];
  loading: boolean;
  error: string | null;
  vehicle: VehicleData | null;
  summary: string;
  onBack: () => void;
  onSelect: (o: GreenCardOffer) => void;
}) {
  const { t } = useI18n();
  const [sortBy, setSortBy] = useState<"price_asc" | "price_desc">("price_asc");
  const [sortOpen, setSortOpen] = useState(false);
  const SORT_OPTIONS = [
    { k: "price_asc", label: "Спершу дешевші", en: "Cheapest first", Icon: ArrowDownWideNarrow },
    { k: "price_desc", label: "Спершу дорожчі", en: "Most expensive first", Icon: ArrowUpWideNarrow },
  ] as const;
  const activeSort = SORT_OPTIONS.find((o) => o.k === sortBy) ?? SORT_OPTIONS[0];
  const sorted = [...offers].sort((a, b) => (sortBy === "price_desc" ? b.price - a.price : a.price - b.price));
  const auto = vehicle ? [vehicle.mark, vehicle.model].filter(Boolean).join(" ") + (vehicle.year ? `, ${vehicle.year}` : "") : t({ uk: "Авто", en: "Vehicle" });

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="flex flex-col items-start gap-6 lg:flex-row">
        <div className="min-w-0 flex-1">
      {/* Картка-підсумок */}
      <div className="mb-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-4 shadow-sm">
        <div className="mb-3 flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
          <button type="button" onClick={onBack} className="transition-colors hover:text-indigo-500" aria-label={t({ uk: "Змінити параметри", en: "Change parameters" })}>
            <Home className="h-3.5 w-3.5" />
          </button>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-zinc-600 dark:text-zinc-300">{t({ uk: "Зелена карта", en: "Green Card" })}</span>
        </div>
        <p className="font-bold text-zinc-900 dark:text-zinc-100" style={{ fontSize: 19 }}>
          {auto}{summary ? `, ${summary}` : ""}
        </p>
      </div>

      {/* Сортування — кастомний dropdown (як у ОСЦПВ) */}
      {!loading && offers.length > 0 && (
        <div className="mb-5 flex items-center justify-end gap-3">
          <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">{t({ uk: "Сортувати", en: "Sort" })}</span>
          <div className="relative">
            <button
              type="button"
              onClick={() => setSortOpen((o) => !o)}
              aria-expanded={sortOpen}
              aria-haspopup="menu"
              className="flex min-w-[190px] items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 shadow-sm transition-colors hover:border-indigo-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            >
              <span className="flex items-center gap-1.5"><activeSort.Icon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />{t({ uk: activeSort.label, en: activeSort.en })}</span>
              <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform dark:text-zinc-500 ${sortOpen ? "rotate-180" : ""}`} />
            </button>
            {sortOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                <div className="absolute right-0 top-full z-20 mt-2 w-[220px] overflow-hidden rounded-xl border border-zinc-100 bg-white p-1.5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
                  {SORT_OPTIONS.map(({ k, label, en, Icon }) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => { setSortBy(k); setSortOpen(false); }}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        sortBy === k ? "bg-indigo-50 font-semibold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300" : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800/60"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                      {t({ uk: label, en })}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <>
          <SearchingInsurers names={GC_INSURERS} />
          {Array.from({ length: 4 }).map((_, i) => <GreenCardSkeleton key={i} />)}
        </>
      ) : error || offers.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-6 py-12 text-center">
          <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{error ? t({ uk: "Не вдалося отримати пропозиції", en: "Could not fetch offers" }) : t({ uk: "Пропозицій не знайдено", en: "No offers found" })}</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
            {error ? t({ uk: "Спробуйте ще раз або змініть параметри поїздки.", en: "Try again or change your trip parameters." }) : t({ uk: "Спробуйте інший термін чи територію.", en: "Try a different term or territory." })}
          </p>
          <Button variant="secondary" size="md" onClick={onBack} className="mt-5">{t({ uk: "Змінити параметри", en: "Change parameters" })}</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((o, i) => (
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
        </div>{/* кінець лівої колонки */}

        {/* Права колонка: запросити друга */}
      </div>
    </div>
  );
}

// Мапимо офер Зеленої карти у форму InsuranceOffer, щоб переюзати OSAGO OfferCard
// (той самий дизайн: лого+назва, ціна, бонус, кнопка). Опцій ЗК не має.
function toInsuranceOffer(o: GreenCardOffer): InsuranceOffer {
  // Документи страхового продукту в ЗК приходять у company.docProduct/docCompany/
  // docAgent/docZusp (як в ОСЦПВ) — вони вже в об'єкті company, тож просто пробрасуємо.
  // Запасний варіант: якщо docProduct відсутній, а є companyLink — беремо його (щоб
  // не затирати справжні документи страховиків, що їх надають).
  const c = (o.company ?? {}) as { docProduct?: string; companyLink?: string; logo?: string | null };
  return {
    offerId: o.offerId,
    price: o.price,
    company: {
      ...c,
      publicName: o.companyNamePublic || o.companyName,
      logo: c.logo ?? null,
      ...(!c.docProduct && c.companyLink ? { docProduct: c.companyLink } : {}),
    },
    listDgo: [],
    listAutolawyer: [],
  } as unknown as InsuranceOffer;
}

function GreenCardSkeleton() {
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
