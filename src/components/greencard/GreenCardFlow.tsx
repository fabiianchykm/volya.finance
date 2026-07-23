"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Globe, MapPin, Car, CalendarDays, Clock, ArrowRight, ArrowLeft, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DateInput, parseUaDate } from "@/components/ui/DateInput";
import { companyLogo } from "@/lib/logos";
import { formatPrice } from "@/lib/utils";
import type { GreenCardOffer } from "@/types/api";

// Зелена карта — міжнародний поліс. Калькулятор Ukasko (POST greencard/calculator)
// повертає реальні пропозиції з цінами. Оформлення (order/OTP/оплата) — наступний етап.

const TELEGRAM_BOT = "https://t.me/volya_finance_bot";

// country ID з довідника Ukasko: 60 = Європа, 117 = Молдова (інших для ЗК немає).
const TERRITORIES = [
  { value: "60", label: "Європа" },
  { value: "117", label: "Молдова" },
];

const VEHICLE_TYPES = [
  { value: "B", label: "Легковий автомобіль" },
  { value: "C", label: "Вантажний автомобіль" },
  { value: "D", label: "Автобус" },
  { value: "A", label: "Мотоцикл / скутер" },
  { value: "E", label: "Причіп" },
];

// periodOption: 15/21 = дні, 1..12 = місяці.
const DURATIONS = [
  { value: "15", label: "15 днів" },
  { value: "21", label: "21 день" },
  { value: "1", label: "1 місяць" },
  { value: "2", label: "2 місяці" },
  { value: "3", label: "3 місяці" },
  { value: "4", label: "4 місяці" },
  { value: "5", label: "5 місяців" },
  { value: "6", label: "6 місяців" },
  { value: "7", label: "7 місяців" },
  { value: "8", label: "8 місяців" },
  { value: "9", label: "9 місяців" },
  { value: "10", label: "10 місяців" },
  { value: "11", label: "11 місяців" },
  { value: "12", label: "12 місяців" },
];

function tomorrowUa(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
}

const selectClass =
  "h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-indigo-400";

export function GreenCardFlow() {
  const [step, setStep] = useState<"form" | "offers">("form");

  const [territory, setTerritory] = useState("60");
  const [vehicleType, setVehicleType] = useState("B");
  const [startDate, setStartDate] = useState(tomorrowUa()); // "ДД.ММ.РРРР"
  const [duration, setDuration] = useState("15");

  const [offers, setOffers] = useState<GreenCardOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const maxStart = new Date();
  maxStart.setFullYear(maxStart.getFullYear() + 1);

  const valid = !!territory && !!vehicleType && !!duration && parseUaDate(startDate) != null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || loading) return;
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
          carType: vehicleType,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) throw new Error(data?.error ?? "Не вдалося отримати пропозиції");
      const list: GreenCardOffer[] = (data.offers ?? []).filter((o: GreenCardOffer) => o && o.price > 0);
      list.sort((a, b) => a.price - b.price);
      setOffers(list);
      setStep("offers");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося отримати пропозиції. Спробуйте пізніше.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      className="relative overflow-x-hidden pb-20 pt-32 sm:pb-28 sm:pt-40 animate-gradient"
      style={{
        backgroundImage: "linear-gradient(135deg, #06040f, #0f0c29, #1e1060, #4f46e5, #7c3aed, #1e1060, #06040f)",
      }}
    >
      <div className="pointer-events-none absolute inset-0" style={{
        background: "radial-gradient(ellipse 70% 60% at 50% 48%, transparent 0%, rgba(0,0,0,0.1) 100%)",
      }} />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 w-full">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8 text-center"
        >
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
            <p className="mx-auto max-w-xl text-base text-zinc-300">
              Оберіть параметри поїздки — і побачите пропозиції страхових із цінами.
            </p>
          </div>

          {step === "form" ? (
            <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-5 text-left shadow-2xl sm:p-7">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                    <MapPin className="h-3.5 w-3.5" /> Куди прямуєте?
                  </label>
                  <select value={territory} onChange={(e) => setTerritory(e.target.value)} className={selectClass}>
                    {TERRITORIES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                    <Car className="h-3.5 w-3.5" /> Транспортний засіб
                  </label>
                  <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} className={selectClass}>
                    {VEHICLE_TYPES.map((v) => (
                      <option key={v.value} value={v.value}>{v.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                    <CalendarDays className="h-3.5 w-3.5" /> Початок дії поліса
                  </label>
                  <DateInput
                    value={startDate}
                    onChange={setStartDate}
                    minDate={today}
                    maxDate={maxStart}
                    defaultYear={today.getFullYear()}
                  />
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                    <Clock className="h-3.5 w-3.5" /> Строк перебування
                  </label>
                  <select value={duration} onChange={(e) => setDuration(e.target.value)} className={selectClass}>
                    {DURATIONS.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

              <Button type="submit" variant="primary" size="lg" disabled={!valid || loading} className="mt-5 w-full">
                <span className="flex items-center gap-2">
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Шукаємо пропозиції…
                    </>
                  ) : (
                    <>
                      Показати пропозиції
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </span>
              </Button>
            </form>
          ) : (
            <GreenCardOffers offers={offers} onBack={() => setStep("form")} />
          )}
        </motion.div>
      </div>
    </section>
  );
}

function GreenCardOffers({ offers, onBack }: { offers: GreenCardOffer[]; onBack: () => void }) {
  return (
    <div className="rounded-2xl bg-white p-5 text-left shadow-2xl sm:p-7">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-zinc-900">
          {offers.length ? `Знайдено пропозицій: ${offers.length}` : "Пропозицій не знайдено"}
        </h2>
        <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Змінити параметри
        </button>
      </div>

      {offers.length === 0 ? (
        <p className="text-sm text-zinc-500">
          За обраними параметрами пропозицій немає. Спробуйте інший строк чи територію, або звʼяжіться з нами.
        </p>
      ) : (
        <div className="space-y-3">
          {offers.map((o) => (
            <GreenCardOfferCard key={o.offerId} offer={o} />
          ))}
        </div>
      )}
    </div>
  );
}

function GreenCardOfferCard({ offer }: { offer: GreenCardOffer }) {
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

      <div className="shrink-0 text-right">
        <p className="text-lg font-bold text-zinc-900">{formatPrice(offer.price)}</p>
      </div>

      <a
        href={TELEGRAM_BOT}
        target="_blank"
        rel="noopener noreferrer"
        className="flex shrink-0 items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
      >
        <Send className="h-4 w-4" />
        Оформити
      </a>
    </div>
  );
}
