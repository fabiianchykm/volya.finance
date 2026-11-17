"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Clock, Phone, ShieldCheck, Send, MessageCircle, BadgeCheck, Banknote, MapPin } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useI18n } from "@/lib/i18n";
import { useFlowReset } from "@/lib/nav-reset";
import { trackEvent, trackCalc } from "@/lib/analytics";
import { WEAPON_TYPES, WEAPON_TERMS, WEAPON_SUMS, WEAPON_MAX_UNITS } from "./weapon-options";

// Страхування відповідальності власника зброї — обовʼязкове для дозволу. Онлайн-
// розрахунку в Ukasko немає, тож це заявка: параметри зброї + телефон → менеджер
// оформлює поліс у страховій і надсилає його на email. Форма одразу в герої,
// без модалок — поліс дешевий (від ~100 ₴), людина має залишити заявку за хвилину.

const selectClass =
  "h-11 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-indigo-400";

const TELEGRAM_URL = "https://t.me/volya_finance_bot?start=weapon";
const VIBER_URL = "viber://chat?number=%2B380965092400";

function formatUaPhone(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 9);
  return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(" ");
}

type Step = "form" | "success";

export function WeaponFlow() {
  const { t } = useI18n();
  const [step, setStep] = useState<Step>("form");
  useFlowReset(() => setStep("form"));

  const [types, setTypes] = useState<string[]>([WEAPON_TYPES[0].value]);
  const [units, setUnits] = useState(1);
  const [term, setTerm] = useState(WEAPON_TERMS[1].value);
  const [sum, setSum] = useState(WEAPON_SUMS[0].value);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [digits, setDigits] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleType = (v: string) =>
    setTypes((prev) => (prev.includes(v) ? (prev.length > 1 ? prev.filter((x) => x !== v) : prev) : [...prev, v]));

  const valid = types.length > 0 && digits.length === 9 && units >= 1;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || loading) return;
    setLoading(true);
    setError(null);
    trackEvent("calculate_cost", { product: "weapon" });
    trackCalc("weapon", { types: types.join(","), units, term, sum });
    try {
      const res = await fetch("/api/weapon", {
        method: "POST",
        headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() },
        body: JSON.stringify({ phone: `+380${digits}`, types, units, term, sum, name, city }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? t({ uk: "Не вдалося надіслати заявку", en: "Failed to submit the request" }));
      trackEvent("generate_lead", { form: "weapon", product: "weapon" });
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
                uk: "Менеджер зв'яжеться з вами найближчим часом, уточнить дані з дозволу й надішле поліс на email. Зазвичай це займає до 30 хвилин у робочий час.",
                en: "A manager will contact you shortly, confirm the details from your permit and email the policy. This usually takes up to 30 minutes during business hours.",
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
                <ShieldCheck className="h-3.5 w-3.5" />
                {t({ uk: "Обовʼязкове для дозволу на зброю", en: "Required for a firearms permit" })}
              </span>
              <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
                {t({ uk: "Страхування зброї", en: "Firearms liability insurance" })}
                <span className="mt-1 block bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                  {t({ uk: "поліс власника за 15 хвилин", en: "owner's policy in 15 minutes" })}
                </span>
              </h1>
              <p className="mx-auto max-w-xl text-base text-zinc-300">
                {t({
                  uk: "Цивільна відповідальність власника зброї — поліс, який вимагають при отриманні й продовженні дозволу. Залиште дані — менеджер оформить і надішле на email.",
                  en: "Civil liability of a firearm owner — the policy required when obtaining or renewing a permit. Leave your details and a manager will issue it and email it to you.",
                })}
              </p>
              <div className="flex flex-wrap justify-center gap-2 text-xs font-medium text-indigo-100">
                {[
                  { Icon: Banknote, uk: "від 100 ₴ на рік", en: "from UAH 100 a year" },
                  { Icon: Clock, uk: "1 або 3 роки", en: "1 or 3 years" },
                  { Icon: MapPin, uk: "діє по всій Україні", en: "valid across Ukraine" },
                  { Icon: BadgeCheck, uk: "приймає дозвільна система", en: "accepted by the permit office" },
                ].map(({ Icon, uk, en }) => (
                  <span key={uk} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/10">
                    <Icon className="h-3.5 w-3.5" />{t({ uk, en })}
                  </span>
                ))}
              </div>
            </div>

            <form onSubmit={submit} className="rounded-2xl bg-white p-5 text-left shadow-2xl dark:bg-zinc-900 sm:p-7">
              <div>
                <label className="mb-2 block text-xs font-medium text-zinc-500 dark:text-zinc-400">{t({ uk: "Вид зброї (можна кілька)", en: "Type of weapon (select several)" })}</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {WEAPON_TYPES.map((w) => {
                    const on = types.includes(w.value);
                    return (
                      <button key={w.value} type="button" onClick={() => toggleType(w.value)} aria-pressed={on}
                        className={`flex min-h-11 items-center justify-center rounded-xl border px-2 py-2 text-center text-sm font-medium leading-tight transition-colors ${
                          on ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:ring-indigo-900" : "border-zinc-200 bg-white text-zinc-600 hover:border-indigo-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                        }`}>
                        {t(w.label)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">{t({ uk: "Кількість одиниць", en: "Number of units" })}</label>
                  <div className="flex h-11 items-center rounded-xl border border-zinc-200 dark:border-zinc-700">
                    <button type="button" aria-label="−" onClick={() => setUnits((u) => Math.max(1, u - 1))} className="h-full w-11 text-lg text-zinc-500 hover:text-indigo-600">−</button>
                    <span className="flex-1 text-center text-sm font-semibold text-zinc-900 dark:text-zinc-100">{units}</span>
                    <button type="button" aria-label="+" onClick={() => setUnits((u) => Math.min(WEAPON_MAX_UNITS, u + 1))} className="h-full w-11 text-lg text-zinc-500 hover:text-indigo-600">+</button>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400"><Clock className="h-3.5 w-3.5" />{t({ uk: "Строк", en: "Term" })}</label>
                  <select value={term} onChange={(e) => setTerm(e.target.value)} className={selectClass}>
                    {WEAPON_TERMS.map((o) => <option key={o.value} value={o.value}>{t(o.label)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400"><ShieldCheck className="h-3.5 w-3.5" />{t({ uk: "Страхова сума", en: "Sum insured" })}</label>
                  <select value={sum} onChange={(e) => setSum(Number(e.target.value))} className={selectClass}>
                    {WEAPON_SUMS.map((o) => <option key={o.value} value={o.value}>{t(o.label)}</option>)}
                  </select>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input label={t({ uk: "Імʼя (необовʼязково)", en: "Name (optional)" })} value={name} onChange={(e) => setName(e.target.value)} placeholder={t({ uk: "Як до вас звертатись", en: "How to address you" })} autoComplete="given-name" maxLength={80} />
                <Input label={t({ uk: "Місто (необовʼязково)", en: "City (optional)" })} value={city} onChange={(e) => setCity(e.target.value)} placeholder={t({ uk: "Київ", en: "Kyiv" })} autoComplete="address-level2" maxLength={80} />
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
                  {t({ uk: "Оформити поліс", en: "Get the policy" })} <ArrowRight className="h-5 w-5" />
                </span>
              </Button>
              <p className="mt-3 text-center text-xs text-zinc-400 dark:text-zinc-500">
                {t({ uk: "Менеджер зв'яжеться, уточнить дані з дозволу й надішле поліс на email. Натискаючи кнопку, ви погоджуєтесь на обробку персональних даних.", en: "A manager will contact you, confirm the permit details and email the policy. By clicking you agree to the processing of personal data." })}
              </p>
            </form>
          </motion.div>
        </div>
      </section>
    </>
  );
}
