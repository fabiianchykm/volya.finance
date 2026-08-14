"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { MapPin, CalendarDays, Users, ArrowRight, Plus, X, Home, ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DateInput, parseUaDate } from "@/components/ui/DateInput";
import { DateRangeInput, daysBetween } from "@/components/ui/DateRangeInput";
import { OfferCard } from "@/components/insurance/OfferCard";
import { Navbar } from "@/components/layout/Navbar";
import { TourismCheckout, type TourismCheckoutCtx } from "./TourismCheckout";
import type { TourismOffer, InsuranceOffer } from "@/types/api";
import { trackEvent } from "@/lib/analytics";
import { useI18n } from "@/lib/i18n";

const PROGRAM_LABELS: Record<string, string> = {
  econom: "Економ", economy: "Економ", standart: "Стандарт", standard: "Стандарт", elit: "Еліт", elite: "Еліт",
};
const PROGRAM_LABELS_EN: Record<string, string> = {
  econom: "Economy", economy: "Economy", standart: "Standard", standard: "Standard", elit: "Elite", elite: "Elite",
};

const coverageOf = (o: TourismOffer) => Number(o.coverage ?? o.limit ?? 0);

// Туристичне страхування — калькулятор Ukasko (POST /insurance/calculator/tourism)
// повертає реальні пропозиції з покриттям і цінами. Зони — з /api/countries/list.

// Зони покриття (id + точна назва з довідника Ukasko).
const ZONES = [
  { id: 60, name: "Географічна Європа", label: "Європа (географічна)", en: "Europe (geographic)", desc: "Уся географічна Європа, а також Туреччина, Єгипет, Ізраїль, Марокко, Туніс, Алжир.", descEn: "All of geographic Europe, plus Turkey, Egypt, Israel, Morocco, Tunisia, Algeria." },
  { id: 204, name: "Європа Шенген", label: "Європа (Шенген)", en: "Europe (Schengen)", desc: "Для шенгенської візи. Країни: Великобританія, Ірландія, Австрія, Бельгія, Угорщина, Німеччина, Греція, Данія, Ісландія, Іспанія, Італія, Латвія, Литва, Ліхтенштейн, Люксембург, Мальта, Нідерланди, Норвегія, Польща, Португалія, Словаччина, Словенія, Фінляндія, Франція, Чехія, Швейцарія, Швеція, Естонія.", descEn: "For a Schengen visa. Countries: United Kingdom, Ireland, Austria, Belgium, Hungary, Germany, Greece, Denmark, Iceland, Spain, Italy, Latvia, Lithuania, Liechtenstein, Luxembourg, Malta, Netherlands, Norway, Poland, Portugal, Slovakia, Slovenia, Finland, France, Czechia, Switzerland, Sweden, Estonia." },
  { id: 34, name: "Всі країни світу (крім України)", label: "Весь світ", en: "Worldwide", desc: "Усі країни світу, крім України.", descEn: "All countries worldwide, except Ukraine." },
  { id: 208, name: "Всі країни світу (крім США та Канади)", label: "Весь світ (крім США/Канади)", en: "Worldwide (except USA/Canada)", desc: "Усі країни світу, крім України, США та Канади.", descEn: "All countries worldwide, except Ukraine, the USA and Canada." },
  { id: 169, name: "Країни СНД", label: "Країни СНД", en: "CIS countries", desc: "Країни Співдружності Незалежних Держав.", descEn: "Countries of the Commonwealth of Independent States." },
  { id: 199, name: "Чехія", label: "Чехія", en: "Czechia", desc: "Покриття лише для Чехії.", descEn: "Coverage for Czechia only." },
];

// Той самий вигляд, що й тригер DateRangeInput (щоб «Куди прямуєте?» і «Дати поїздки»
// виглядали стандартно: однакові рамка, паддінги й фокус із ring).
const selectClass =
  "h-11 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 text-sm text-zinc-900 dark:text-zinc-100 outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500";

// Кастомний вибір зони: у списку кожен пункт = назва зони + опис (які країни входять)
// прямо під нею (нативний <select> так не вміє).
function ZoneSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onEsc); };
  }, [open]);

  const cur = ZONES.find((z) => String(z.id) === value) ?? ZONES[0];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`${selectClass} flex cursor-pointer items-center justify-between gap-2 pr-3 text-left`}
      >
        <span className="truncate">{t({ uk: cur.label, en: cur.en })}</span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-zinc-400 transition-transform dark:text-zinc-500 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div role="listbox" className="absolute left-0 right-0 z-30 mt-2 max-h-80 overflow-auto rounded-xl border border-zinc-200 bg-white p-1 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
          {ZONES.map((z) => {
            const active = String(z.id) === value;
            return (
              <button
                key={z.id}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => { onChange(String(z.id)); setOpen(false); }}
                className={`flex w-full flex-col gap-0.5 rounded-lg px-3 py-2 text-left transition-colors ${active ? "bg-indigo-50 dark:bg-indigo-950/40" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/60"}`}
              >
                <span className={`text-sm font-medium ${active ? "text-indigo-700 dark:text-indigo-300" : "text-zinc-800 dark:text-zinc-200"}`}>{t({ uk: z.label, en: z.en })}</span>
                <span className="text-xs leading-snug text-zinc-400 dark:text-zinc-500">{t({ uk: z.desc, en: z.descEn })}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function TourismFlow() {
  const { t } = useI18n();
  const [step, setStep] = useState<"form" | "offers" | "checkout">("form");
  const [selectedOffer, setSelectedOffer] = useState<TourismOffer | null>(null);
  const [zoneId, setZoneId] = useState("60");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [birthDates, setBirthDates] = useState<string[]>([""]); // по туристу
  const [multiVisa, setMultiVisa] = useState(false);
  // Ліміт днів на поїздку для річного поліса (мультивіза) — річний поліс не має дати
  // завершення, натомість страховику передається макс. кількість днів на одну поїздку.
  const [tripDays, setTripDays] = useState(30);

  const [offers, setOffers] = useState<TourismOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const maxStart = new Date();
  maxStart.setFullYear(maxStart.getFullYear() + 1);

  const setBirth = (i: number, v: string) => setBirthDates((arr) => arr.map((b, idx) => (idx === i ? v : b)));
  const addTourist = () => setBirthDates((arr) => (arr.length < 6 ? [...arr, ""] : arr));
  const removeTourist = (i: number) => setBirthDates((arr) => (arr.length > 1 ? arr.filter((_, idx) => idx !== i) : arr));

  const startD = parseUaDate(startDate);
  const endD = parseUaDate(endDate);
  // Мультивіза: days = обраний ліміт (без дати завершення). Звичайний: з діапазону дат.
  const days = multiVisa ? tripDays : (startD && endD ? daysBetween(startD, endD) : 0);
  const birthOk = birthDates.every((b) => parseUaDate(b));
  const valid = multiVisa
    ? !!startD && days > 0 && birthOk
    : !!startD && !!endD && days > 0 && birthOk;

  const runCalc = async (zid: string, sUa: string, eUa: string, births: string[], multi: boolean, tDays: number) => {
    const sD = parseUaDate(sUa);
    const eD = parseUaDate(eUa);
    const d = multi ? tDays : (sD && eD ? daysBetween(sD, eD) : 0);
    if (!sD || d <= 0 || !births.every((b) => parseUaDate(b)) || (!multi && !eD)) return;
    setLoading(true);
    setError(null);
    // Параметри в URL (у т.ч. дати народження туристів — на прохання).
    const qs = `?step=offers&zone=${zid}&start=${encodeURIComponent(sUa)}&end=${encodeURIComponent(eUa)}&multi=${multi ? 1 : 0}&tripDays=${tDays}&births=${encodeURIComponent(births.join(","))}`;
    window.history.replaceState(null, "", qs);
    trackEvent("calculate_cost", { product: "tourism" });
    try {
      const zone = ZONES.find((z) => String(z.id) === zid)!;
      const res = await fetch("/api/tourism", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          birthDates: births,               // dd.mm.yyyy = d.m.Y
          country: { id: zone.id, name: zone.name },
          date: sUa,
          days: d,
          multiVisa: multi,
          tourists: births.length,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) throw new Error(data?.error ?? t({ uk: "Не вдалося отримати пропозиції", en: "Could not fetch offers" }));
      const list: TourismOffer[] = (data.offers ?? []).filter((o: TourismOffer) => o && o.price > 0);
      list.sort((a, b) => a.price - b.price);
      setOffers(list);
      setStep("offers");
    } catch (err) {
      setError(err instanceof Error ? err.message : t({ uk: "Не вдалося отримати пропозиції.", en: "Could not fetch offers." }));
    } finally {
      setLoading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || loading) return;
    void runCalc(zoneId, startDate, endDate, birthDates, multiVisa, tripDays);
  };

  // Відновлення з URL при перезавантаженні (крок оформлення не відновлюємо).
  const didRestore = useRef(false);
  useEffect(() => {
    if (didRestore.current) return;
    didRestore.current = true;
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("step") !== "offers") return;
    const zid = sp.get("zone") || "60";
    const s = sp.get("start") || "";
    const en = sp.get("end") || "";
    const multi = sp.get("multi") === "1";
    const tDays = Number(sp.get("tripDays")) || 30;
    const births = (sp.get("births") || "").split(",").filter(Boolean);
    if (!s || births.length === 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setZoneId(zid); setStartDate(s); setEndDate(en); setMultiVisa(multi); setTripDays(tDays); setBirthDates(births);
    void runCalc(zid, s, en, births, multi, tDays);
     
  }, []);

  // ── Світлий екран: пропозиції / оформлення (як в автоцивілці) ──
  if (step === "offers" || step === "checkout") {
    return (
      <>
        <Navbar solid />
        <section className="min-h-screen pt-20 pb-10">
          <div className={`mx-auto px-4 sm:px-6 ${step === "offers" ? "max-w-[1200px]" : "max-w-3xl"}`}>
            {step === "offers" ? (
              <div className="flex flex-col items-start gap-6 lg:flex-row">
                <div className="min-w-0 flex-1">
                  <TourismOffers
                    offers={offers}
                    zoneLabel={(() => { const z = ZONES.find((z) => String(z.id) === zoneId); return z ? t({ uk: z.label, en: z.en }) : ""; })()}
                    dates={startDate && endDate ? `${startDate} – ${endDate}` : ""}
                    days={days}
                    tourists={birthDates.length}
                    onBack={() => { setStep("form"); window.history.replaceState(null, "", window.location.pathname); }}
                    onSelect={(offer) => { setSelectedOffer(offer); setStep("checkout"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  />
                </div>
              </div>
            ) : selectedOffer ? (
              <TourismCheckout
                ctx={{
                  offer: selectedOffer,
                  countryId: Number(zoneId),
                  countryName: ZONES.find((z) => String(z.id) === zoneId)?.name ?? "",
                  startDate,
                  endDate,
                  days,
                  multiVisa,
                  birthDates,
                } satisfies TourismCheckoutCtx}
                onBack={() => setStep("offers")}
              />
            ) : null}
          </div>
        </section>
      </>
    );
  }

  // ── Темний герой: форма підбору ──
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
                {t({ uk: "Туристичне страхування", en: "Travel insurance" })}
                <span className="mt-1 block bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                  {t({ uk: "захист у подорожі за кордон", en: "protection on trips abroad" })}
                </span>
              </h1>
              <p className="mx-auto max-w-xl text-base text-zinc-300">{t({ uk: "Оберіть параметри подорожі — і побачите пропозиції з цінами й покриттям.", en: "Choose your trip details — and see offers with prices and coverage." })}</p>
            </div>

            <form onSubmit={submit} className="rounded-2xl bg-white dark:bg-zinc-900 p-5 text-left shadow-2xl sm:p-7">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400"><MapPin className="h-3.5 w-3.5" /> {t({ uk: "Куди прямуєте?", en: "Where are you heading?" })}</label>
                  <ZoneSelect value={zoneId} onChange={setZoneId} />
                </div>
                {multiVisa ? (
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400"><CalendarDays className="h-3.5 w-3.5" /> {t({ uk: "Дата початку", en: "Start date" })}</label>
                    <DateInput value={startDate} onChange={setStartDate} minDate={today} maxDate={maxStart} />
                  </div>
                ) : (
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400"><CalendarDays className="h-3.5 w-3.5" /> {t({ uk: "Дати поїздки", en: "Trip dates" })}{days > 0 && <span className="text-zinc-400 dark:text-zinc-500">· {days} {t({ uk: "дн.", en: "days" })}</span>}</label>
                    <DateRangeInput start={startDate} end={endDate} onChange={(s, e) => { setStartDate(s); setEndDate(e); }} minDate={today} maxDate={maxStart} />
                  </div>
                )}
                {multiVisa && (
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400"><CalendarDays className="h-3.5 w-3.5" /> {t({ uk: "Днів на поїздку", en: "Days per trip" })}</label>
                    <div className="relative">
                      <select value={tripDays} onChange={(e) => setTripDays(Number(e.target.value))} className={`${selectClass} cursor-pointer appearance-none pr-10`}>
                        {[30, 60, 90, 180].map((d) => <option key={d} value={d}>{t({ uk: `до ${d} днів на поїздку`, en: `up to ${d} days per trip` })}</option>)}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-5">
                <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400"><Users className="h-3.5 w-3.5" /> {t({ uk: "Туристи", en: "Travellers" })}</label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {birthDates.map((b, i) => (
                    <div key={i} className="flex items-end gap-2">
                      <div className="min-w-0 flex-1">
                        <DateInput label={birthDates.length > 1 ? t({ uk: `Дата народження · турист ${i + 1}`, en: `Date of birth · traveller ${i + 1}` }) : t({ uk: "Дата народження", en: "Date of birth" })} value={b} onChange={(v) => setBirth(i, v)} defaultYear={1990} required />
                      </div>
                      {birthDates.length > 1 && (
                        <button type="button" aria-label={t({ uk: `Прибрати туриста ${i + 1}`, en: `Remove traveller ${i + 1}` })} onClick={() => removeTourist(i)}
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500 transition-colors hover:border-rose-300 hover:text-rose-500">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {/* Кнопка «Додати туриста» — збоку в сітці, як окрема комірка, а не знизу */}
                  {birthDates.length < 6 && (
                    <button type="button" onClick={addTourist}
                      className="flex h-11 items-center justify-center gap-1.5 self-end rounded-xl border border-dashed border-zinc-300 dark:border-zinc-600 px-4 text-sm font-medium text-indigo-600 dark:text-indigo-400 transition-colors hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40">
                      <Plus className="h-4 w-4" /> {t({ uk: "Додати туриста", en: "Add traveller" })}
                    </button>
                  )}
                </div>
              </div>

              <label className="mt-5 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-3 transition-colors hover:border-indigo-200">
                <span className="flex flex-col">
                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{t({ uk: "Річний поліс (мультивіза)", en: "Annual policy (multi-visa)" })}</span>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">{t({ uk: "Багато поїздок протягом року", en: "Multiple trips within a year" })}</span>
                </span>
                <input type="checkbox" checked={multiVisa} onChange={(e) => setMultiVisa(e.target.checked)} className="h-5 w-5 rounded border-zinc-300 dark:border-zinc-600 text-indigo-600 focus:ring-indigo-500" />
              </label>

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

// EUR → €, USD → $ для суми покриття.
const currencySymbol = (cur?: string) => (cur === "USD" ? "$" : "€");

// Мапимо офер туристичного у форму InsuranceOffer, щоб переюзати OSAGO OfferCard.
function toTourismInsuranceOffer(o: TourismOffer): InsuranceOffer {
  return {
    offerId: o.offerId,
    price: o.price,
    company: { ...(o.company ?? {}), publicName: o.company?.publicName || o.company?.name || "", logo: o.company?.logo ?? null },
    listDgo: [],
    listAutolawyer: [],
  } as unknown as InsuranceOffer;
}

function TourismOffers({ offers, zoneLabel, dates, days, tourists, onBack, onSelect }: {
  offers: TourismOffer[];
  zoneLabel: string;
  dates: string;
  days: number;
  tourists: number;
  onBack: () => void;
  onSelect: (offer: TourismOffer) => void;
}) {
  const { t } = useI18n();
  // Рівні покриття (10к…100к EUR). Мінімум для Шенгену — 30 000. Виносимо зверху.
  const coverages = Array.from(new Set(offers.map(coverageOf).filter((c) => c > 0))).sort((a, b) => a - b);
  const [coverage, setCoverage] = useState<number>(coverages.includes(30000) ? 30000 : coverages[0] ?? 0);
  const [sortBy, setSortBy] = useState<"price_asc" | "price_desc">("price_asc");

  // За обраним покриттям — найдешевший варіант для кожної пари «страхова + програма».
  const best = new Map<string, TourismOffer>();
  for (const o of offers.filter((o) => coverageOf(o) === coverage)) {
    const key = [o.company?.publicName || o.company?.name, o.tripProgram].filter(Boolean).join("|") || o.offerId;
    const prev = best.get(key);
    if (!prev || o.price < prev.price) best.set(key, o);
  }
  const cards = Array.from(best.values()).sort((a, b) => (sortBy === "price_desc" ? b.price - a.price : a.price - b.price));

  const touristsLabel = `${tourists} ${t({ uk: tourists === 1 ? "турист" : tourists < 5 ? "туристи" : "туристів", en: tourists === 1 ? "traveller" : "travellers" })}`;
  const summary = [touristsLabel, zoneLabel, dates, days ? `${days} ${t({ uk: "дн.", en: "days" })}` : ""].filter(Boolean).join(" · ");

  return (
    <div>
      {/* Картка-підсумок (breadcrumb + параметри) + сума покриття прикріплена знизу */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        <div className="px-6 pt-4 pb-4">
          <div className="mb-3 flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
            <button type="button" onClick={onBack} className="transition-colors hover:text-indigo-500" aria-label={t({ uk: "Змінити параметри", en: "Change parameters" })}>
              <Home className="h-3.5 w-3.5" />
            </button>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-zinc-600 dark:text-zinc-300">{t({ uk: "Туристичне страхування", en: "Travel insurance" })}</span>
          </div>
          <p className="font-bold text-zinc-900 dark:text-zinc-100" style={{ fontSize: 19 }}>{summary}</p>
        </div>

        {/* Сума покриття — випадний список */}
        {coverages.length > 1 && (
          <div className="border-t border-zinc-100 dark:border-zinc-800 bg-indigo-50/40 dark:bg-indigo-950/40 px-6 py-3.5">
            <label htmlFor="tour-coverage" className="mb-2 block text-xs font-medium text-zinc-500 dark:text-zinc-400">{t({ uk: "Сума покриття", en: "Coverage amount" })}</label>
            <select
              id="tour-coverage"
              value={coverage}
              onChange={(e) => setCoverage(Number(e.target.value))}
              className="h-11 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-sm font-medium text-zinc-900 dark:text-zinc-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:w-72"
            >
              {coverages.map((c) => (
                <option key={c} value={c}>
                  {new Intl.NumberFormat("uk-UA").format(c)} {currencySymbol(offers.find((o) => coverageOf(o) === c)?.limit_currency)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Сортування — випадний список */}
      {cards.length > 0 && (
        <div className="mb-5 flex items-center justify-end gap-2">
          <label htmlFor="tour-sort" className="text-xs font-medium text-zinc-400 dark:text-zinc-500">{t({ uk: "Сортувати", en: "Sort" })}</label>
          <select
            id="tour-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "price_asc" | "price_desc")}
            className="h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-xs font-semibold text-zinc-700 dark:text-zinc-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="price_asc">{t({ uk: "Спершу дешевші", en: "Cheapest first" })}</option>
            <option value="price_desc">{t({ uk: "Спершу дорожчі", en: "Most expensive first" })}</option>
          </select>
        </div>
      )}

      {/* Картки (переюз OSAGO OfferCard) */}
      {cards.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-6 py-12 text-center">
          <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{t({ uk: "Пропозицій не знайдено", en: "No offers found" })}</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">{t({ uk: "Спробуйте інші дати чи зону.", en: "Try different dates or a zone." })}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cards.map((o, i) => (
            <OfferCard
              key={o.offerId}
              index={i}
              offer={toTourismInsuranceOffer(o)}
              selected={false}
              selectedDgoId={null}
              selectedAutolawyerId={null}
              onSelect={() => {}}
              onSelectDgo={() => {}}
              onSelectAutolawyer={() => {}}
              onBuy={() => onSelect(o)}
              hideExtras
              cornerBadge={o.tripProgram ? t({ uk: PROGRAM_LABELS[o.tripProgram.toLowerCase()] ?? o.tripProgram, en: PROGRAM_LABELS_EN[o.tripProgram.toLowerCase()] ?? o.tripProgram }) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
