"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Globe, MapPin, Car, CalendarDays, Clock, Phone, ArrowRight, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

// Зелена карта — міжнародний поліс для виїзду за кордон. Онлайн-калькулятора в
// Ukasko поки немає (лише ОСАГО), тож це ЛІД-форма: клієнт лишає параметри поїздки
// + телефон, заявка йде менеджеру в Telegram (/api/greencard), він передзвонює.

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
  const [step, setStep] = useState<"form" | "done">("form");

  const [territory, setTerritory] = useState("europe");
  const [vehicleType, setVehicleType] = useState("B");
  const [startDate, setStartDate] = useState(tomorrowISO());
  const [duration, setDuration] = useState("15d");
  const [phone, setPhone] = useState(""); // 9 цифр після +380

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const phoneValid = phone.replace(/\D/g, "").length === 9;
  const valid = !!territory && !!vehicleType && !!startDate && !!duration && phoneValid;

  const labelOf = (arr: { value: string; label: string }[], v: string) =>
    arr.find((x) => x.value === v)?.label ?? "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/greencard", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          phone: `+380${phone.replace(/\D/g, "")}`,
          params: {
            territory: labelOf(TERRITORIES, territory),
            vehicle: labelOf(VEHICLE_TYPES, vehicleType),
            startDate: startDate.split("-").reverse().join("."),
            duration: labelOf(DURATIONS, duration),
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        throw new Error(data?.error ?? "Не вдалося надіслати заявку");
      }
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося надіслати заявку. Спробуйте пізніше.");
    } finally {
      setSubmitting(false);
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
              Зелена карта —{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                страховка для виїзду за кордон
              </span>
            </h1>
            <p className="mx-auto max-w-xl text-base text-zinc-300">
              Залиште параметри поїздки й телефон — менеджер підбере пропозиції та передзвонить.
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

              {/* 5. Телефон — +380 префікс, 9 цифр (як в інших формах сайту). */}
              <div className="mt-4">
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                  <Phone className="h-3.5 w-3.5" /> Ваш телефон
                </label>
                <div className="flex items-center rounded-xl border border-zinc-200 bg-white focus-within:border-indigo-400">
                  <span className="pl-3 pr-1 text-sm text-zinc-500">+380</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="67 123 45 67"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 9))}
                    className="h-11 w-full rounded-r-xl bg-transparent px-2 text-sm text-zinc-900 outline-none"
                  />
                </div>
              </div>

              {error && (
                <p className="mt-3 text-sm text-red-600">{error}</p>
              )}

              <Button type="submit" variant="primary" size="lg" disabled={!valid || submitting} className="mt-5 w-full">
                <span className="flex items-center gap-2">
                  {submitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Надсилаємо…
                    </>
                  ) : (
                    <>
                      Залишити заявку
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </span>
              </Button>
            </form>
          ) : (
            <div className="mx-auto max-w-lg">
              <LeadReceived phone={`+380${phone.replace(/\D/g, "")}`} onBack={() => setStep("form")} />
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}

// Підтвердження прийнятої заявки. Менеджер отримав лід у Telegram і передзвонить.
function LeadReceived({ phone, onBack }: { phone: string; onBack: () => void }) {
  return (
    <div className="rounded-2xl bg-white p-6 text-left shadow-2xl sm:p-8">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-500" />
        <div>
          <h2 className="text-lg font-bold text-zinc-900">Заявку прийнято!</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Ми зателефонуємо на <span className="font-medium text-zinc-900">{phone}</span>, підберемо
            вигідну Зелену карту за вашими параметрами й допоможемо оформити.
          </p>
        </div>
      </div>

      <Button variant="outline" size="md" onClick={onBack} className="mt-6 flex items-center gap-2">
        <ArrowLeft className="h-4 w-4" />
        Нова заявка
      </Button>
    </div>
  );
}
