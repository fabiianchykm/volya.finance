"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, CalendarDays, Users, ArrowRight, Plus, X, ArrowDownWideNarrow, ArrowUpWideNarrow, Home, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DateInput, parseUaDate } from "@/components/ui/DateInput";
import { DateRangeInput, daysBetween } from "@/components/ui/DateRangeInput";
import { OfferCard } from "@/components/insurance/OfferCard";
import { InviteFriendCard } from "@/components/insurance/InviteFriendCard";
import { Navbar } from "@/components/layout/Navbar";
import { TourismCheckout, type TourismCheckoutCtx } from "./TourismCheckout";
import type { TourismOffer, InsuranceOffer } from "@/types/api";
import { trackEvent } from "@/lib/analytics";

const PROGRAM_LABELS: Record<string, string> = {
  econom: "Економ", economy: "Економ", standart: "Стандарт", standard: "Стандарт", elit: "Еліт", elite: "Еліт",
};

const coverageOf = (o: TourismOffer) => Number(o.coverage ?? o.limit ?? 0);

// Туристичне страхування — калькулятор Ukasko (POST /insurance/calculator/tourism)
// повертає реальні пропозиції з покриттям і цінами. Зони — з /api/countries/list.

// Зони покриття (id + точна назва з довідника Ukasko).
const ZONES = [
  { id: 60, name: "Географічна Європа", label: "Європа (географічна)" },
  { id: 204, name: "Європа Шенген", label: "Європа (Шенген)" },
  { id: 34, name: "Всі країни світу (крім України)", label: "Весь світ" },
  { id: 208, name: "Всі країни світу (крім США та Канади)", label: "Весь світ (крім США/Канади)" },
  { id: 169, name: "Країни СНД", label: "Країни СНД" },
  { id: 199, name: "Чехія", label: "Чехія" },
];

// Той самий вигляд, що й тригер DateRangeInput (щоб «Куди прямуєте?» і «Дати поїздки»
// виглядали стандартно: однакові рамка, паддінги й фокус із ring).
const selectClass =
  "h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500";

export function TourismFlow() {
  const [step, setStep] = useState<"form" | "offers" | "checkout">("form");
  const [selectedOffer, setSelectedOffer] = useState<TourismOffer | null>(null);
  const [zoneId, setZoneId] = useState("60");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [birthDates, setBirthDates] = useState<string[]>([""]); // по туристу
  const [multiVisa, setMultiVisa] = useState(false);

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
  const days = startD && endD ? daysBetween(startD, endD) : 0;
  const valid = !!startD && !!endD && days > 0 && birthDates.every((b) => parseUaDate(b));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || loading) return;
    setLoading(true);
    setError(null);
    trackEvent("calculate_cost", { product: "tourism" });
    try {
      const zone = ZONES.find((z) => String(z.id) === zoneId)!;
      const res = await fetch("/api/tourism", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          birthDates,                       // dd.mm.yyyy = d.m.Y
          country: { id: zone.id, name: zone.name },
          date: startDate,
          days,
          multiVisa,
          tourists: birthDates.length,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) throw new Error(data?.error ?? "Не вдалося отримати пропозиції");
      const list: TourismOffer[] = (data.offers ?? []).filter((o: TourismOffer) => o && o.price > 0);
      list.sort((a, b) => a.price - b.price);
      setOffers(list);
      setStep("offers");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося отримати пропозиції.");
    } finally {
      setLoading(false);
    }
  };

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
                    zoneLabel={ZONES.find((z) => String(z.id) === zoneId)?.label ?? ""}
                    dates={startDate && endDate ? `${startDate} – ${endDate}` : ""}
                    days={days}
                    tourists={birthDates.length}
                    onBack={() => setStep("form")}
                    onSelect={(offer) => { setSelectedOffer(offer); setStep("checkout"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  />
                </div>
                <InviteFriendCard />
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
                Туристичне страхування
                <span className="mt-1 block bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                  захист у подорожі за кордон
                </span>
              </h1>
              <p className="mx-auto max-w-xl text-base text-zinc-300">Оберіть параметри подорожі — і побачите пропозиції з цінами й покриттям.</p>
            </div>

            <form onSubmit={submit} className="rounded-2xl bg-white p-5 text-left shadow-2xl sm:p-7">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-500"><MapPin className="h-3.5 w-3.5" /> Куди прямуєте?</label>
                  <select value={zoneId} onChange={(e) => setZoneId(e.target.value)} className={selectClass}>
                    {ZONES.map((z) => <option key={z.id} value={z.id}>{z.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-500"><CalendarDays className="h-3.5 w-3.5" /> Дати поїздки{days > 0 && <span className="text-zinc-400">· {days} дн.</span>}</label>
                  <DateRangeInput start={startDate} end={endDate} onChange={(s, e) => { setStartDate(s); setEndDate(e); }} minDate={today} maxDate={maxStart} />
                </div>
              </div>

              <div className="mt-5">
                <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-zinc-500"><Users className="h-3.5 w-3.5" /> Туристи</label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {birthDates.map((b, i) => (
                    <div key={i} className="flex items-end gap-2">
                      <div className="min-w-0 flex-1">
                        <DateInput label={birthDates.length > 1 ? `Дата народження · турист ${i + 1}` : "Дата народження"} value={b} onChange={(v) => setBirth(i, v)} defaultYear={1990} required />
                      </div>
                      {birthDates.length > 1 && (
                        <button type="button" aria-label={`Прибрати туриста ${i + 1}`} onClick={() => removeTourist(i)}
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-200 text-zinc-400 transition-colors hover:border-rose-300 hover:text-rose-500">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {birthDates.length < 6 && (
                  <button type="button" onClick={addTourist}
                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-300 py-2.5 text-sm font-medium text-indigo-600 transition-colors hover:border-indigo-400 hover:bg-indigo-50/50 sm:w-auto sm:px-5">
                    <Plus className="h-4 w-4" /> Додати туриста
                  </button>
                )}
              </div>

              <label className="mt-5 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-zinc-200 px-4 py-3 transition-colors hover:border-indigo-200">
                <span className="flex flex-col">
                  <span className="text-sm font-medium text-zinc-800">Річний поліс (мультивіза)</span>
                  <span className="text-xs text-zinc-400">Багато поїздок протягом року</span>
                </span>
                <input type="checkbox" checked={multiVisa} onChange={(e) => setMultiVisa(e.target.checked)} className="h-5 w-5 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500" />
              </label>

              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

              <Button type="submit" variant="primary" size="lg" loading={loading} disabled={!valid || loading} className="mt-5 w-full">
                <span className="flex items-center gap-2">
                  {loading ? "Шукаємо пропозиції…" : <>Розрахувати вартість <ArrowRight className="h-5 w-5" /></>}
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
    company: { publicName: o.company?.publicName || o.company?.name || "" },
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

  const touristsLabel = `${tourists} ${tourists === 1 ? "турист" : tourists < 5 ? "туристи" : "туристів"}`;
  const summary = [touristsLabel, zoneLabel, dates, days ? `${days} дн.` : ""].filter(Boolean).join(" · ");

  return (
    <div>
      {/* Картка-підсумок (breadcrumb + параметри) + сума покриття прикріплена знизу */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm">
        <div className="px-6 pt-4 pb-4">
          <div className="mb-3 flex items-center gap-1.5 text-xs text-zinc-400">
            <button type="button" onClick={onBack} className="transition-colors hover:text-indigo-500" aria-label="Змінити параметри">
              <Home className="h-3.5 w-3.5" />
            </button>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-zinc-600">Туристичне страхування</span>
          </div>
          <p className="font-bold text-zinc-900" style={{ fontSize: 19 }}>{summary}</p>
        </div>

        {/* Сума покриття — прикріплена смуга (як пільга/ДН в автоцивілці) */}
        {coverages.length > 1 && (
          <div className="border-t border-zinc-100 bg-indigo-50/40 px-6 py-3.5">
            <p className="mb-2 text-xs font-medium text-zinc-500">Сума покриття</p>
            <div className="flex flex-wrap gap-2">
              {coverages.map((c) => (
                <button key={c} type="button" onClick={() => setCoverage(c)}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${c === coverage ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-zinc-200 bg-white text-zinc-600 hover:border-indigo-200"}`}>
                  {new Intl.NumberFormat("uk-UA").format(c)} {currencySymbol(offers.find((o) => coverageOf(o) === c)?.limit_currency)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Сортування */}
      {cards.length > 0 && (
        <div className="mb-5 flex items-center justify-end gap-3">
          <span className="text-xs font-medium text-zinc-400">Сортувати</span>
          <div className="inline-flex items-center gap-1 rounded-full border border-zinc-200/70 bg-white p-1 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            {([
              { k: "price_asc", label: "Спершу дешевші", Icon: ArrowDownWideNarrow },
              { k: "price_desc", label: "Спершу дорожчі", Icon: ArrowUpWideNarrow },
            ] as const).map(({ k, label, Icon }) => (
              <button key={k} type="button" onClick={() => setSortBy(k)}
                className={`relative flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${sortBy === k ? "text-white" : "text-zinc-500 hover:text-zinc-800"}`}>
                {sortBy === k && (
                  <motion.span layoutId="tourSortPill" transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 shadow-sm shadow-indigo-500/30" />
                )}
                <Icon className="relative z-10 h-3.5 w-3.5" />
                <span className="relative z-10">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Картки (переюз OSAGO OfferCard) */}
      {cards.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-12 text-center">
          <p className="text-base font-semibold text-zinc-900">Пропозицій не знайдено</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-500">Спробуйте інші дати чи зону.</p>
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
              cornerBadge={o.tripProgram ? PROGRAM_LABELS[o.tripProgram.toLowerCase()] ?? o.tripProgram : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
