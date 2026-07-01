"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Globe, MapPin, Car, CalendarDays, Clock, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

// Зелена карта — міжнародний поліс для виїзду за кордон. Збираємо вхідні дані
// (територія → ТЗ → початок дії → строк), а крок пропозицій поки заглушений:
// у поточній інтеграції Ukasko немає API-калькулятора Зеленої карти (лише ОСАГО).
// Коли з'явиться ендпоінт — підставимо реальні офери замість плейсхолдера.

const TERRITORIES = [
  { value: "europe", label: "Європа" },
  { value: "azerbaijan", label: "Азербайджан" },
  { value: "moldova", label: "Молдова" },
];

const VEHICLE_TYPES = [
  { value: "B", label: "Легковий автомобіль" },
  { value: "C", label: "Вантажний автомобіль" },
  { value: "D", label: "Автобус" },
  { value: "A", label: "Мотоцикл / скутер" },
  { value: "E", label: "Причіп" },
];

const DURATIONS = [
  { value: "15d", label: "15 днів" },
  { value: "1m", label: "1 місяць" },
  { value: "2m", label: "2 місяці" },
  { value: "3m", label: "3 місяці" },
  { value: "4m", label: "4 місяці" },
  { value: "5m", label: "5 місяців" },
  { value: "6m", label: "6 місяців" },
  { value: "1y", label: "1 рік" },
];

function tomorrowISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

const selectClass =
  "h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-indigo-400";

export function GreenCardFlow() {
  const [step, setStep] = useState<"form" | "offers">("form");

  const [territory, setTerritory] = useState("europe");
  const [vehicleType, setVehicleType] = useState("B");
  const [startDate, setStartDate] = useState(tomorrowISO());
  const [duration, setDuration] = useState("15d");

  const valid = !!territory && !!vehicleType && !!startDate && !!duration;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (valid) setStep("offers");
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
              Зелена карта —{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                страховка для виїзду за кордон
              </span>
            </h1>
            <p className="mx-auto max-w-xl text-base text-zinc-300">
              Заповніть дані поїздки — і ми покажемо доступні пропозиції.
            </p>
          </div>

          {step === "form" ? (
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl bg-white p-5 text-left shadow-2xl sm:p-7"
            >
              {/* Поля в ряд колонками зліва-направо; на мобільному згортаються. */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* 1. Територія */}
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

                {/* 2. Транспортний засіб */}
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

                {/* 3. Початок дії */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                    <CalendarDays className="h-3.5 w-3.5" /> Початок дії поліса
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={selectClass}
                  />
                </div>

                {/* 4. Строк перебування */}
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

              <Button type="submit" variant="primary" size="lg" disabled={!valid} className="mt-5 w-full">
                <span className="flex items-center gap-2">
                  Показати пропозиції
                  <ArrowRight className="h-5 w-5" />
                </span>
              </Button>
            </form>
          ) : (
            <div className="mx-auto max-w-lg">
              <OffersPlaceholder
                territory={TERRITORIES.find((t) => t.value === territory)?.label ?? ""}
                vehicle={VEHICLE_TYPES.find((v) => v.value === vehicleType)?.label ?? ""}
                startDate={startDate}
                duration={DURATIONS.find((d) => d.value === duration)?.label ?? ""}
                onBack={() => setStep("form")}
              />
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}

// Крок пропозицій. API-калькулятора Зеленої карти поки немає — показуємо зведення
// введених даних і стан «очікуємо підключення». Сюди підставляться реальні офери.
function OffersPlaceholder({
  territory, vehicle, startDate, duration, onBack,
}: {
  territory: string; vehicle: string; startDate: string; duration: string; onBack: () => void;
}) {
  const rows = [
    { label: "Територія", value: territory },
    { label: "Транспортний засіб", value: vehicle },
    { label: "Початок дії", value: startDate.split("-").reverse().join(".") },
    { label: "Строк перебування", value: duration },
  ];

  return (
    <div className="rounded-2xl bg-white p-6 text-left shadow-2xl sm:p-8">
      <h2 className="text-lg font-bold text-zinc-900">Ваші параметри</h2>
      <dl className="mt-4 divide-y divide-zinc-100">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between py-2.5 text-sm">
            <dt className="text-zinc-500">{r.label}</dt>
            <dd className="font-medium text-zinc-900">{r.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 flex items-start gap-3 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
        <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-indigo-500" />
        <p className="text-sm text-indigo-800">
          Підключення до пропозицій страхових у процесі. Тут зʼявляться доступні
          поліси Зеленої карти за вашими параметрами.
        </p>
      </div>

      <Button variant="outline" size="md" onClick={onBack} className="mt-5 flex items-center gap-2">
        <ArrowLeft className="h-4 w-4" />
        Змінити параметри
      </Button>
    </div>
  );
}
