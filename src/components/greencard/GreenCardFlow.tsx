"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, CalendarDays, ArrowRight, Search, Car, Home, ChevronRight, ArrowDownWideNarrow, ArrowUpWideNarrow } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { parseUaDate } from "@/components/ui/DateInput";
import { DateRangeInput, daysBetween } from "@/components/ui/DateRangeInput";
import { SearchingInsurers } from "@/components/insurance/SearchingInsurers";
import { OfferCard } from "@/components/insurance/OfferCard";
import { InviteFriendCard } from "@/components/insurance/InviteFriendCard";
import { formatPlate } from "@/lib/utils";
import { GreenCardCheckout, type GreenCardContext } from "./GreenCardCheckout";
import type { GreenCardOffer, InsuranceOffer } from "@/types/api";
import type { VehicleData } from "@/types/insurance";

// Зелена карта — потік і дизайн як в ОСЦПВ: темний герой для вводу номера/параметрів,
// далі СВІТЛИЙ екран пропозицій (як OffersSection) з карткою-підсумком, сортуванням,
// лоадером перебору страхових і картками пропозицій.

const TERRITORIES = [
  { value: "60", label: "Європа" },
  { value: "117", label: "Молдова" },
];

// Страхові Зеленої карти — для лоадера (перебір назв).
const GC_INSURERS = ["УСГ", "ВУСО", "ТАС", "УТІКО", "ОРАНТА", "ІНГО", "АРКС", "КНЯЖА"];

// periodOption Зеленої карти дискретний: 15/21 = дні, 1..12 = місяці. Користувач
// обирає діапазон дат, а ми підбираємо НАЙМЕНШИЙ період ЗК, що покриває поїздку.
function periodFromDays(days: number): { value: number; label: string } {
  if (days <= 15) return { value: 15, label: "15 днів" };
  if (days <= 21) return { value: 21, label: "21 день" };
  const m = Math.min(12, Math.ceil(days / 30));
  return { value: m, label: `${m} ${m === 1 ? "місяць" : m < 5 ? "місяці" : "місяців"}` };
}

function toGcCarType(autoCategory?: string): string {
  const c = (autoCategory ?? "B")[0]?.toUpperCase();
  return ["A", "B", "C", "D", "E"].includes(c) ? c : "B";
}

const selectClass =
  "h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-indigo-400";

export function GreenCardFlow() {
  const [step, setStep] = useState<"plate" | "params" | "offers" | "checkout">("plate");

  const [plate, setPlate] = useState("");
  const [vehicle, setVehicle] = useState<VehicleData | null>(null);

  const [territory, setTerritory] = useState("60");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [offers, setOffers] = useState<GreenCardOffer[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<GreenCardOffer | null>(null);
  const [loading, setLoading] = useState(false);
  const [offersLoading, setOffersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const maxStart = new Date();
  maxStart.setFullYear(maxStart.getFullYear() + 1);

  const startD = parseUaDate(startDate);
  const endD = parseUaDate(endDate);
  const period = startD && endD ? periodFromDays(daysBetween(startD, endD)) : null;
  const territoryLabel = TERRITORIES.find((t) => t.value === territory)?.label ?? "";

  // Крок 1 — пошук авто за номером.
  const findCar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (plate.trim().replace(/\s/g, "").length < 6 || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/vehicle/${encodeURIComponent(formatPlate(plate))}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Авто не знайдено. Перевірте номер.");
      const car = json.data;
      setVehicle({
        number: car.number ?? formatPlate(plate),
        vin: car.vin ?? "",
        year: Number(car.year),
        model: car.model ?? "",
        mark: car.mark ?? "",
        autoCategory: car.autoCategory ?? "B1",
        capacity: car.additionalParameters?.capacity ? Number(car.additionalParameters.capacity) : undefined,
        numberOfSeats: car.additionalParameters?.numberOfSeats ? Number(car.additionalParameters.numberOfSeats) : undefined,
        ownWeight: car.additionalParameters?.ownWeight ? Number(car.additionalParameters.ownWeight) : undefined,
        totalWeight: car.additionalParameters?.totalWeight ? Number(car.additionalParameters.totalWeight) : undefined,
      });
      setStep("params");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Авто не знайдено. Перевірте номер.");
    } finally {
      setLoading(false);
    }
  };

  // Крок 2 — розрахунок: одразу переходимо на світлий екран пропозицій із лоадером.
  const calc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicle || !startD || !period || loading) return;
    setError(null);
    setOffers([]);
    setOffersLoading(true);
    setStep("offers");
    try {
      const iso = `${startD.getFullYear()}-${String(startD.getMonth() + 1).padStart(2, "0")}-${String(startD.getDate()).padStart(2, "0")}`;
      const res = await fetch("/api/greencard", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          country: Number(territory),
          userType: 1,
          startDate: iso,
          periodOption: period.value,
          carType: toGcCarType(vehicle.autoCategory),
          carNumber: vehicle.number,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) throw new Error(data?.error ?? "Не вдалося отримати пропозиції");
      const list: GreenCardOffer[] = (data.offers ?? []).filter((o: GreenCardOffer) => o && o.price > 0);
      list.sort((a, b) => a.price - b.price);
      setOffers(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося отримати пропозиції.");
    } finally {
      setOffersLoading(false);
    }
  };

  const checkoutCtx = (offer: GreenCardOffer): GreenCardContext => ({
    offer, country: Number(territory), periodOption: period?.value ?? 15,
    carType: toGcCarType(vehicle!.autoCategory), startDate, vehicle: vehicle!,
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
                vehicle={vehicle}
                summary={[territoryLabel, period?.label].filter(Boolean).join(" · ")}
                onBack={() => { setError(null); setStep("params"); }}
                onSelect={(o) => { setSelectedOffer(o); setStep("checkout"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              />
            ) : selectedOffer && vehicle ? (
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
                Зелена карта —
                <span className="mt-1 block bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                  страховка для виїзду за кордон
                </span>
              </h1>
              {step === "plate" && (
                <p className="mx-auto max-w-xl text-base text-zinc-300">Введіть номер авто — і побачите пропозиції страхових із цінами.</p>
              )}
            </div>

            {step === "plate" && (
              <form onSubmit={findCar} className="mx-auto flex max-w-md flex-col items-center gap-5">
                <div className="flex overflow-hidden rounded-xl border-4 border-zinc-300" style={{ height: 68 }}>
                  <div className="flex flex-col items-center justify-center gap-1 bg-blue-700" style={{ width: 42 }}>
                    <div className="grid grid-cols-3 gap-[3px]">
                      {Array.from({ length: 12 }).map((_, i) => <div key={i} className="h-[3px] w-[3px] rounded-full bg-yellow-300 opacity-90" />)}
                    </div>
                    <span className="font-bold text-white" style={{ fontSize: 9, letterSpacing: 1 }}>UA</span>
                  </div>
                  <div className="flex items-center bg-white px-3 sm:px-5">
                    <input
                      type="text" value={plate}
                      onChange={(e) => {
                        const raw = e.target.value.toUpperCase().replace(/\s/g, "");
                        let ff = raw;
                        if (raw.length > 2) ff = raw.slice(0, 2) + " " + raw.slice(2);
                        if (raw.length > 6) ff = raw.slice(0, 2) + " " + raw.slice(2, 6) + " " + raw.slice(6);
                        setPlate(ff);
                      }}
                      placeholder="AA 1234 BB" maxLength={11} autoComplete="off"
                      className="w-[210px] bg-transparent text-2xl font-bold uppercase tracking-[0.2em] text-zinc-900 placeholder:text-zinc-300 outline-none sm:w-[250px] sm:text-3xl"
                      style={{ fontFamily: "monospace" }} required
                    />
                  </div>
                </div>
                {error && <p className="text-sm font-medium text-rose-200">{error}</p>}
                <Button type="submit" size="xl" loading={loading} className="rounded-2xl bg-white px-10 font-bold text-indigo-700 hover:bg-indigo-50">
                  <span className="flex items-center gap-2"><Search className="h-5 w-5" /> Знайти авто</span>
                </Button>
              </form>
            )}

            {step === "params" && vehicle && (
              <form onSubmit={calc} className="rounded-2xl bg-white p-5 text-left shadow-2xl sm:p-7">
                <div className="mb-5 flex items-center gap-3 rounded-xl bg-zinc-50 p-3 ring-1 ring-zinc-100">
                  <Car className="h-5 w-5 shrink-0 text-indigo-500" />
                  <p className="text-sm text-zinc-700">
                    <span className="font-semibold text-zinc-900">{[vehicle.mark, vehicle.model].filter(Boolean).join(" ") || "Авто"}</span>
                    {vehicle.year ? `, ${vehicle.year}` : ""} · {vehicle.number}
                  </p>
                  <button type="button" onClick={() => { setVehicle(null); setStep("plate"); }} className="ml-auto text-xs font-medium text-indigo-600 hover:underline">Змінити</button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-500"><MapPin className="h-3.5 w-3.5" /> Куди прямуєте?</label>
                    <select value={territory} onChange={(e) => setTerritory(e.target.value)} className={selectClass}>
                      {TERRITORIES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-500"><CalendarDays className="h-3.5 w-3.5" /> Дати поїздки</label>
                    <DateRangeInput start={startDate} end={endDate} onChange={(s, e) => { setStartDate(s); setEndDate(e); }} minDate={today} maxDate={maxStart} />
                  </div>
                </div>

                {period && (
                  <p className="mt-3 text-xs text-zinc-500">Поліс Зелена карта: <span className="font-semibold text-zinc-700">{period.label}</span> <span className="text-zinc-400">(мінімальний термін — 15 днів)</span></p>
                )}

                {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

                <Button type="submit" variant="primary" size="lg" loading={loading} disabled={!period || loading} className="mt-5 w-full">
                  <span className="flex items-center gap-2">
                    Показати пропозиції <ArrowRight className="h-5 w-5" />
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
  const [sortBy, setSortBy] = useState<"price_asc" | "price_desc">("price_asc");
  const sorted = [...offers].sort((a, b) => (sortBy === "price_desc" ? b.price - a.price : a.price - b.price));
  const auto = vehicle ? [vehicle.mark, vehicle.model].filter(Boolean).join(" ") + (vehicle.year ? `, ${vehicle.year}` : "") : "Авто";

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
          <span className="font-medium text-zinc-600">Зелена карта</span>
        </div>
        <p className="font-bold text-zinc-900" style={{ fontSize: 19 }}>
          {auto}{summary ? `, ${summary}` : ""}
        </p>
      </div>

      {/* Сортування */}
      {!loading && offers.length > 0 && (
        <div className="mb-5 flex items-center justify-end gap-3">
          <span className="text-xs font-medium text-zinc-400">Сортувати</span>
          <div className="inline-flex items-center gap-1 rounded-full border border-zinc-200/70 bg-white p-1 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            {([
              { k: "price_asc", label: "Спершу дешевші", Icon: ArrowDownWideNarrow },
              { k: "price_desc", label: "Спершу дорожчі", Icon: ArrowUpWideNarrow },
            ] as const).map(({ k, label, Icon }) => (
              <button
                key={k}
                type="button"
                onClick={() => setSortBy(k)}
                className={`relative flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                  sortBy === k ? "text-white" : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                {sortBy === k && (
                  <motion.span layoutId="gcSortPill" transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 shadow-sm shadow-indigo-500/30" />
                )}
                <Icon className="relative z-10 h-3.5 w-3.5" />
                <span className="relative z-10">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <>
          <SearchingInsurers names={GC_INSURERS} />
          {Array.from({ length: 4 }).map((_, i) => <GreenCardSkeleton key={i} />)}
        </>
      ) : error || offers.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-12 text-center">
          <p className="text-base font-semibold text-zinc-900">{error ? "Не вдалося отримати пропозиції" : "Пропозицій не знайдено"}</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-500">
            {error ? "Спробуйте ще раз або змініть параметри поїздки." : "Спробуйте інший термін чи територію."}
          </p>
          <Button variant="secondary" size="md" onClick={onBack} className="mt-5">Змінити параметри</Button>
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
        <InviteFriendCard />
      </div>
    </div>
  );
}

// Мапимо офер Зеленої карти у форму InsuranceOffer, щоб переюзати OSAGO OfferCard
// (той самий дизайн: лого+назва, ціна, бонус, кнопка). Опцій ЗК не має.
function toInsuranceOffer(o: GreenCardOffer): InsuranceOffer {
  return {
    offerId: o.offerId,
    price: o.price,
    company: { publicName: o.companyNamePublic || o.companyName },
    listDgo: [],
    listAutolawyer: [],
  } as unknown as InsuranceOffer;
}

function GreenCardSkeleton() {
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
