"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Globe, MapPin, CalendarDays, Clock, ArrowRight, ArrowLeft, Loader2, Search, Car } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DateInput, parseUaDate } from "@/components/ui/DateInput";
import { companyLogo } from "@/lib/logos";
import { formatPrice, formatPlate } from "@/lib/utils";
import { GreenCardCheckout, type GreenCardContext } from "./GreenCardCheckout";
import type { GreenCardOffer } from "@/types/api";
import type { VehicleData } from "@/types/insurance";

// Зелена карта — потік як в ОСЦПВ: 1) номер авто (тип ТЗ і дані з реєстру),
// 2) куди / дата / термін, 3) пропозиції з цінами, 4) анкета оформлення.

const TERRITORIES = [
  { value: "60", label: "Європа" },
  { value: "117", label: "Молдова" },
];

// periodOption: 15/21 = дні, 1..12 = місяці.
const DURATIONS = [
  { value: "15", label: "15 днів" },
  { value: "21", label: "21 день" },
  ...Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: `${i + 1} ${i === 0 ? "місяць" : i < 4 ? "місяці" : "місяців"}` })),
];

// Категорія ТЗ Ukasko (B1/B2/C1/D1/A1/E…) → тип для Зеленої карти (B/C/D/A/E).
function toGcCarType(autoCategory?: string): string {
  const c = (autoCategory ?? "B")[0]?.toUpperCase();
  return ["A", "B", "C", "D", "E"].includes(c) ? c : "B";
}

function tomorrowUa(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
}

const selectClass =
  "h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-indigo-400";

export function GreenCardFlow() {
  const [step, setStep] = useState<"plate" | "params" | "offers" | "checkout">("plate");

  const [plate, setPlate] = useState("");
  const [vehicle, setVehicle] = useState<VehicleData | null>(null);

  const [territory, setTerritory] = useState("60");
  const [startDate, setStartDate] = useState(tomorrowUa());
  const [duration, setDuration] = useState("15");

  const [offers, setOffers] = useState<GreenCardOffer[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<GreenCardOffer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const maxStart = new Date();
  maxStart.setFullYear(maxStart.getFullYear() + 1);

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

  // Крок 2 — розрахунок пропозицій.
  const calc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicle || !parseUaDate(startDate) || loading) return;
    setLoading(true);
    setError(null);
    try {
      const d = parseUaDate(startDate)!;
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const res = await fetch("/api/greencard", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          country: Number(territory),
          userType: 1,
          startDate: iso,
          periodOption: Number(duration),
          carType: toGcCarType(vehicle.autoCategory),
          carNumber: vehicle.number,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) throw new Error(data?.error ?? "Не вдалося отримати пропозиції");
      const list: GreenCardOffer[] = (data.offers ?? []).filter((o: GreenCardOffer) => o && o.price > 0);
      list.sort((a, b) => a.price - b.price);
      setOffers(list);
      setStep("offers");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося отримати пропозиції.");
    } finally {
      setLoading(false);
    }
  };

  const checkoutCtx = (offer: GreenCardOffer): GreenCardContext => ({
    offer, country: Number(territory), periodOption: Number(duration),
    carType: toGcCarType(vehicle!.autoCategory), startDate, vehicle: vehicle!,
  });

  return (
    <section
      className="relative overflow-x-hidden pb-20 pt-32 sm:pb-28 sm:pt-40 animate-gradient"
      style={{ backgroundImage: "linear-gradient(135deg, #06040f, #0f0c29, #1e1060, #4f46e5, #7c3aed, #1e1060, #06040f)" }}
    >
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 60% at 50% 48%, transparent 0%, rgba(0,0,0,0.1) 100%)" }} />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 w-full">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-8 text-center">
          <div className="space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15 backdrop-blur-sm">
              <Globe className="h-7 w-7 text-indigo-300" />
            </div>
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

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-500"><MapPin className="h-3.5 w-3.5" /> Куди прямуєте?</label>
                  <select value={territory} onChange={(e) => setTerritory(e.target.value)} className={selectClass}>
                    {TERRITORIES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-500"><CalendarDays className="h-3.5 w-3.5" /> Дата початку</label>
                  <DateInput value={startDate} onChange={setStartDate} minDate={today} maxDate={maxStart} defaultYear={today.getFullYear()} />
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-500"><Clock className="h-3.5 w-3.5" /> Термін перебування</label>
                  <select value={duration} onChange={(e) => setDuration(e.target.value)} className={selectClass}>
                    {DURATIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
              </div>

              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

              <Button type="submit" variant="primary" size="lg" loading={loading} className="mt-5 w-full">
                <span className="flex items-center gap-2">
                  {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Шукаємо пропозиції…</> : <>Показати пропозиції <ArrowRight className="h-5 w-5" /></>}
                </span>
              </Button>
            </form>
          )}

          {step === "offers" && (
            <GreenCardOffers offers={offers} onBack={() => setStep("params")} onSelect={(o) => { setSelectedOffer(o); setStep("checkout"); }} />
          )}

          {step === "checkout" && selectedOffer && vehicle && (
            <GreenCardCheckout ctx={checkoutCtx(selectedOffer)} onBack={() => setStep("offers")} />
          )}
        </motion.div>
      </div>
    </section>
  );
}

function GreenCardOffers({ offers, onBack, onSelect }: { offers: GreenCardOffer[]; onBack: () => void; onSelect: (o: GreenCardOffer) => void }) {
  return (
    <div className="rounded-2xl bg-white p-5 text-left shadow-2xl sm:p-7">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-zinc-900">{offers.length ? `Знайдено пропозицій: ${offers.length}` : "Пропозицій не знайдено"}</h2>
        <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Змінити параметри
        </button>
      </div>
      {offers.length === 0 ? (
        <p className="text-sm text-zinc-500">За обраними параметрами пропозицій немає. Спробуйте інший термін чи територію.</p>
      ) : (
        <div className="space-y-3">
          {offers.map((o) => <GreenCardOfferCard key={o.offerId} offer={o} onSelect={() => onSelect(o)} />)}
        </div>
      )}
    </div>
  );
}

function GreenCardOfferCard({ offer, onSelect }: { offer: GreenCardOffer; onSelect: () => void }) {
  const src = companyLogo(offer.companyNamePublic || offer.companyName);
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:gap-4">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50 p-1.5">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={offer.companyNamePublic} className="max-h-full max-w-full object-contain" />
        ) : (
          <span className="text-xs font-bold text-zinc-400">{(offer.companyNamePublic || offer.companyName).slice(0, 2).toUpperCase()}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold uppercase text-zinc-900">{offer.companyNamePublic || offer.companyName}</p>
        <p className="text-xs text-zinc-500">Зелена карта</p>
      </div>
      <p className="shrink-0 text-lg font-bold text-zinc-900">{formatPrice(offer.price)}</p>
      <button type="button" onClick={onSelect} className="flex shrink-0 items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700">
        Оформити
      </button>
    </div>
  );
}
