"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Phone, Send, MessageCircle, Clock, Car, Route, Zap, Globe, BadgeCheck } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DateInput } from "@/components/ui/DateInput";
import { useI18n } from "@/lib/i18n";
import { useFlowReset } from "@/lib/nav-reset";
import { trackEvent, trackCalc } from "@/lib/analytics";
import { VIGNETTE_COUNTRIES, VIGNETTE_PERIODS, VIGNETTE_VEHICLES } from "./vignette-options";

// Віньєтка — оплата платних доріг Європи. Онлайн-оформлення через API ще
// готується, тож поки це заявка: країни, строк, дата, номер авто, телефон →
// менеджер купує е-віньєтку в офіційного оператора й надсилає підтвердження.

const selectClass =
  "h-11 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-indigo-400";

const TELEGRAM_URL = "https://t.me/volya_finance_bot?start=vignette";
const VIBER_URL = "viber://chat?number=%2B380965092400";

function formatUaPhone(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 9);
  return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(" ");
}
function fmtDate(d: Date): string {
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

type Step = "form" | "success";

export function VignetteFlow() {
  const { t } = useI18n();
  const [step, setStep] = useState<Step>("form");
  useFlowReset(() => setStep("form"));

  const [countries, setCountries] = useState<string[]>([]);
  const [period, setPeriod] = useState("10d");
  const [vehicle, setVehicle] = useState("car");
  const [startDate, setStartDate] = useState("");
  const [plate, setPlate] = useState("");
  const [name, setName] = useState("");
  const [digits, setDigits] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = useMemo(() => new Date(), []);
  const tomorrow = useMemo(() => new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1), [today]);
  const yearAhead = useMemo(() => new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()), [today]);

  const toggleCountry = (c: string) => setCountries((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  // Строки, доступні хоча б в одній з обраних країн (без вибору — усі).
  const periods = useMemo(() => {
    const chosen = VIGNETTE_COUNTRIES.filter((c) => countries.includes(c.code));
    if (chosen.length === 0) return VIGNETTE_PERIODS;
    const allowed = new Set(chosen.flatMap((c) => c.periods));
    return VIGNETTE_PERIODS.filter((p) => allowed.has(p.value));
  }, [countries]);
  const effectivePeriod = periods.some((p) => p.value === period) ? period : periods[0]?.value ?? "10d";

  const plateClean = plate.toUpperCase().replace(/[^A-ZА-ЯІЇЄ0-9]/g, "");
  const valid = countries.length > 0 && digits.length === 9 && plateClean.length >= 4 && /^\d{2}\.\d{2}\.\d{4}$/.test(startDate);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || loading) return;
    setLoading(true);
    setError(null);
    trackEvent("calculate_cost", { product: "vignette" });
    trackCalc("vignette", { countries: countries.join(","), period: effectivePeriod, vehicle });
    try {
      const res = await fetch("/api/vignette", {
        method: "POST",
        headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() },
        body: JSON.stringify({ phone: `+380${digits}`, countries, period: effectivePeriod, vehicle, plate: plateClean, startDate, name }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? t({ uk: "Не вдалося надіслати заявку", en: "Failed to submit the request" }));
      trackEvent("generate_lead", { form: "vignette", product: "vignette" });
      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : t({ uk: "Помилка надсилання", en: "Submission error" }));
    } finally {
      setLoading(false);
    }
  };

  if (step === "success") {
    return (
      <>
        <Navbar />
        <section className="flex min-h-[60vh] items-center justify-center px-4 pb-16 pt-32">
          <div className="w-full max-w-md rounded-2xl border border-zinc-100 bg-white px-6 py-12 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/40">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{t({ uk: "Заявку прийнято!", en: "Request received!" })}</h1>
            <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
              {t({
                uk: "Менеджер зв'яжеться, назве точну вартість і після оплати оформить е-віньєтку за номером авто. Підтвердження надійде в месенджер або на email.",
                en: "A manager will contact you with the exact price and, once paid, register the e-vignette for your plate. Confirmation arrives by messenger or email.",
              })}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className="flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 text-sm font-semibold text-zinc-800 hover:bg-sky-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-sky-950/40">
                <Send className="h-4 w-4 text-sky-500" /> Telegram
              </a>
              <a href={VIBER_URL} className="flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 text-sm font-semibold text-zinc-800 hover:bg-violet-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-violet-950/40">
                <MessageCircle className="h-4 w-4 text-violet-500" /> Viber
              </a>
            </div>
            <Button variant="outline" size="md" className="mx-auto mt-4 flex items-center gap-2" onClick={() => { setStep("form"); setDigits(""); }}>
              <Phone className="h-4 w-4" />
              {t({ uk: "Подати ще одну заявку", en: "Submit another request" })}
            </Button>
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
        <div className="relative mx-auto w-full max-w-3xl px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-8 text-center">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-indigo-100 ring-1 ring-white/15">
                <Route className="h-3.5 w-3.5" />
                {t({ uk: "Платні дороги Європи", en: "European toll roads" })}
              </span>
              <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
                {t({ uk: "Віньєтка онлайн", en: "Vignette online" })}
                <span className="mt-1 block bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                  {t({ uk: "оплата доріг Європи за номером авто", en: "European road tolls by plate number" })}
                </span>
              </h1>
              <p className="mx-auto max-w-xl text-base text-zinc-300">
                {t({
                  uk: "Австрія, Чехія, Словаччина, Угорщина, Словенія, Швейцарія, Румунія, Болгарія, Молдова. Електронна віньєтка реєструється на номер авто — без наліпок і кас на кордоні.",
                  en: "Austria, Czechia, Slovakia, Hungary, Slovenia, Switzerland, Romania, Bulgaria, Moldova. The e-vignette is registered to your plate — no stickers, no border queues.",
                })}
              </p>
              <div className="flex flex-wrap justify-center gap-2 text-xs font-medium text-indigo-100">
                {[
                  { Icon: Globe, uk: "9 країн", en: "9 countries" },
                  { Icon: Zap, uk: "діє з обраної дати", en: "valid from your date" },
                  { Icon: Car, uk: "за номером авто", en: "by plate number" },
                  { Icon: BadgeCheck, uk: "офіційні оператори", en: "official operators" },
                ].map(({ Icon, uk, en }) => (
                  <span key={uk} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/10">
                    <Icon className="h-3.5 w-3.5" />{t({ uk, en })}
                  </span>
                ))}
              </div>
            </div>

            <form onSubmit={submit} className="rounded-2xl bg-white p-5 text-left shadow-2xl dark:bg-zinc-900 sm:p-7">
              <div>
                <label className="mb-2 block text-xs font-medium text-zinc-500 dark:text-zinc-400">{t({ uk: "Країни (можна кілька)", en: "Countries (select several)" })}</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {VIGNETTE_COUNTRIES.map((c) => {
                    const on = countries.includes(c.code);
                    return (
                      <button key={c.code} type="button" onClick={() => toggleCountry(c.code)} aria-pressed={on}
                        className={`flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm font-medium leading-tight transition-colors ${
                          on ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:ring-indigo-900" : "border-zinc-200 bg-white text-zinc-600 hover:border-indigo-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                        }`}>
                        <span className="text-lg leading-none">{c.flag}</span>
                        <span className="min-w-0">
                          <span className="block">{t(c.name)}</span>
                          <span className="block text-[11px] font-normal text-zinc-400 dark:text-zinc-500">{t(c.hint)}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400"><Clock className="h-3.5 w-3.5" />{t({ uk: "Строк", en: "Period" })}</label>
                  <select value={effectivePeriod} onChange={(e) => setPeriod(e.target.value)} className={selectClass}>
                    {periods.map((o) => <option key={o.value} value={o.value}>{t(o.label)}</option>)}
                  </select>
                </div>
                <DateInput
                  label={t({ uk: "Дата початку дії", en: "Start date" })}
                  value={startDate}
                  onChange={setStartDate}
                  minDate={today}
                  maxDate={yearAhead}
                  quickAction={{ label: t({ uk: "Завтра", en: "Tomorrow" }), date: tomorrow }}
                />
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400"><Car className="h-3.5 w-3.5" />{t({ uk: "Тип авто", en: "Vehicle" })}</label>
                  <select value={vehicle} onChange={(e) => setVehicle(e.target.value)} className={selectClass}>
                    {VIGNETTE_VEHICLES.map((o) => <option key={o.value} value={o.value}>{t(o.label)}</option>)}
                  </select>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label={t({ uk: "Номер авто", en: "Plate number" })}
                  value={plate}
                  onChange={(e) => setPlate(e.target.value.toUpperCase())}
                  placeholder="AA 1234 BB"
                  autoComplete="off"
                  maxLength={12}
                  className="font-semibold uppercase tracking-wider"
                />
                <Input label={t({ uk: "Імʼя (необовʼязково)", en: "Name (optional)" })} value={name} onChange={(e) => setName(e.target.value)} placeholder={t({ uk: "Як до вас звертатись", en: "How to address you" })} autoComplete="given-name" maxLength={80} />
              </div>

              <div className="mt-4">
                <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">{t({ uk: "Номер телефону", en: "Phone number" })}</label>
                <div className="flex items-center rounded-xl border border-zinc-200 bg-white px-4 transition-all focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 dark:border-zinc-700 dark:bg-zinc-900 dark:focus-within:ring-indigo-900">
                  <span className="select-none pr-3 text-lg font-semibold text-zinc-500 dark:text-zinc-400">+380</span>
                  <span className="mr-3 h-6 w-px bg-zinc-200 dark:bg-zinc-700" />
                  <input
                    type="tel" inputMode="numeric" autoComplete="tel-national"
                    aria-label={t({ uk: "Номер телефону", en: "Phone number" })}
                    value={formatUaPhone(digits)}
                    onChange={(e) => setDigits(e.target.value.replace(/\D/g, "").slice(0, 9))}
                    placeholder="67 123 45 67"
                    className="h-11 w-full bg-transparent text-lg font-semibold tracking-wider text-zinc-900 outline-none placeholder:font-normal placeholder:tracking-normal placeholder:text-zinc-300 dark:text-zinc-100 dark:placeholder:text-zinc-600"
                  />
                </div>
              </div>

              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

              <Button type="submit" variant="primary" size="lg" loading={loading} disabled={!valid || loading} className="mt-5 w-full">
                <span className="flex items-center gap-2">
                  {t({ uk: "Оформити віньєтку", en: "Get the vignette" })} <ArrowRight className="h-5 w-5" />
                </span>
              </Button>
              <p className="mt-3 text-center text-xs text-zinc-400 dark:text-zinc-500">
                {t({ uk: `Старт не раніше ${fmtDate(today)}. Менеджер назве точну вартість у гривні й після оплати зареєструє віньєтку на номер авто. Натискаючи кнопку, ви погоджуєтесь на обробку персональних даних.`, en: `Start no earlier than ${fmtDate(today)}. The manager quotes the exact price in UAH and registers the vignette to your plate after payment. By clicking you agree to the processing of personal data.` })}
              </p>
            </form>
          </motion.div>
        </div>
      </section>
    </>
  );
}
