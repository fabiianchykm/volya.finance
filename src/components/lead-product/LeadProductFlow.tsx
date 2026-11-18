"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Phone, Send, MessageCircle, BadgeCheck } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useI18n } from "@/lib/i18n";
import { useFlowReset } from "@/lib/nav-reset";
import { trackEvent, trackCalc } from "@/lib/analytics";
import { LEAD_PRODUCTS, type LeadField } from "@/lib/lead-products";

// Спільний флоу для продуктів «через менеджера»: герой з формою, поля за конфігом
// продукту, телефон → POST /api/lead-product → екран «Заявку прийнято».

const selectClass =
  "h-11 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-indigo-400";
const VIBER_URL = "viber://chat?number=%2B380965092400";

function formatUaPhone(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 9);
  return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(" ");
}

type Values = Record<string, string | string[] | number | "">;

function initialValues(fields: LeadField[]): Values {
  const v: Values = {};
  for (const f of fields) {
    if (f.type === "chips") v[f.key] = f.multiple ? [] : "";
    else if (f.type === "select") v[f.key] = f.required ? f.options[0].value : "";
    else v[f.key] = "";
  }
  return v;
}

function isFilled(f: LeadField, v: Values[string]): boolean {
  if (Array.isArray(v)) return v.length > 0;
  return v !== "" && v !== undefined && v !== null;
}

export function LeadProductFlow({ slug }: { slug: string }) {
  const cfg = LEAD_PRODUCTS[slug];
  const { t } = useI18n();
  const [step, setStep] = useState<"form" | "success">("form");
  useFlowReset(() => setStep("form"));
  const [values, setValues] = useState<Values>(() => initialValues(cfg.fields));
  const [digits, setDigits] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: string, v: Values[string]) => setValues((prev) => ({ ...prev, [key]: v }));
  const toggleChip = (f: Extract<LeadField, { type: "chips" }>, value: string) => {
    const cur = values[f.key];
    if (f.multiple) {
      const arr = Array.isArray(cur) ? cur : [];
      set(f.key, arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value]);
    } else {
      set(f.key, cur === value ? "" : value);
    }
  };

  const valid = digits.length === 9 && cfg.fields.every((f) => !f.required || isFilled(f, values[f.key]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || loading) return;
    setLoading(true);
    setError(null);
    trackEvent("calculate_cost", { product: slug });
    trackCalc(slug, Object.fromEntries(Object.entries(values).map(([k, v]) => [k, Array.isArray(v) ? v.join(",") : v])));
    try {
      const res = await fetch("/api/lead-product", {
        method: "POST",
        headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() },
        body: JSON.stringify({ slug, phone: `+380${digits}`, fields: values }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? t({ uk: "Не вдалося надіслати заявку", en: "Failed to submit the request" }));
      trackEvent("generate_lead", { form: slug, product: slug });
      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : t({ uk: "Помилка надсилання", en: "Submission error" }));
    } finally {
      setLoading(false);
    }
  };

  const telegramUrl = `https://t.me/volya_finance_bot?start=${slug.replace(/-/g, "_")}`;

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
            <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">{t(cfg.afterSubmit)}</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <a href={telegramUrl} target="_blank" rel="noopener noreferrer" className="flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 text-sm font-semibold text-zinc-800 hover:bg-sky-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-sky-950/40">
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
                <BadgeCheck className="h-3.5 w-3.5" />{t(cfg.badge)}
              </span>
              <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
                {t(cfg.titleLead)}
                <span className="mt-1 block bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">{t(cfg.titleHighlight)}</span>
              </h1>
              <p className="mx-auto max-w-xl text-base text-zinc-300">{t(cfg.subtitle)}</p>
              <div className="flex flex-wrap justify-center gap-2 text-xs font-medium text-indigo-100">
                {cfg.pills.map((p) => (
                  <span key={p.uk} className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/10">{t(p)}</span>
                ))}
              </div>
            </div>

            <form onSubmit={submit} className="rounded-2xl bg-white p-5 text-left shadow-2xl dark:bg-zinc-900 sm:p-7">
              <div className="space-y-4">
                {cfg.fields.map((f) => {
                  const v = values[f.key];
                  if (f.type === "chips") {
                    return (
                      <div key={f.key}>
                        <label className="mb-2 block text-xs font-medium text-zinc-500 dark:text-zinc-400">{t(f.label)}</label>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {f.options.map((o) => {
                            const on = Array.isArray(v) ? v.includes(o.value) : v === o.value;
                            return (
                              <button key={o.value} type="button" onClick={() => toggleChip(f, o.value)} aria-pressed={on}
                                className={`flex min-h-11 items-center justify-center rounded-xl border px-2 py-2 text-center text-sm font-medium leading-tight transition-colors ${
                                  on ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:ring-indigo-900" : "border-zinc-200 bg-white text-zinc-600 hover:border-indigo-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                                }`}>
                                {t(o.label)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                  if (f.type === "select") {
                    return (
                      <div key={f.key}>
                        <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">{t(f.label)}</label>
                        <select value={String(v ?? "")} onChange={(e) => set(f.key, e.target.value)} className={selectClass}>
                          {!f.required && <option value="">{t({ uk: "— не вказано —", en: "— not specified —" })}</option>}
                          {f.options.map((o) => <option key={o.value} value={o.value}>{t(o.label)}</option>)}
                        </select>
                      </div>
                    );
                  }
                  if (f.type === "number") {
                    return (
                      <Input key={f.key} label={t(f.label)} type="number" inputMode="numeric" min={f.min} max={f.max} placeholder={f.placeholder}
                        value={String(v ?? "")} onChange={(e) => set(f.key, e.target.value)} suffix={f.suffix ? t(f.suffix) : undefined} />
                    );
                  }
                  return (
                    <Input key={f.key} label={t(f.label)} value={String(v ?? "")} onChange={(e) => set(f.key, e.target.value)}
                      placeholder={f.placeholder ? t(f.placeholder) : undefined} maxLength={f.maxLength ?? 200} />
                  );
                })}

                <div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">{t({ uk: "Номер телефону", en: "Phone number" })}</label>
                    <div className="flex items-center rounded-xl border border-zinc-200 bg-white px-4 transition-all focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 dark:border-zinc-700 dark:bg-zinc-900 dark:focus-within:ring-indigo-900">
                      <span className="select-none pr-3 text-base font-semibold text-zinc-500 dark:text-zinc-400">+380</span>
                      <span className="mr-3 h-6 w-px bg-zinc-200 dark:bg-zinc-700" />
                      <input type="tel" inputMode="numeric" autoComplete="tel-national" aria-label={t({ uk: "Номер телефону", en: "Phone number" })}
                        value={formatUaPhone(digits)} onChange={(e) => setDigits(e.target.value.replace(/\D/g, "").slice(0, 9))} placeholder="67 123 45 67"
                        className="h-11 w-full bg-transparent text-base font-semibold tracking-wider text-zinc-900 outline-none placeholder:font-normal placeholder:tracking-normal placeholder:text-zinc-300 dark:text-zinc-100 dark:placeholder:text-zinc-600" />
                    </div>
                  </div>
                </div>
              </div>

              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

              <Button type="submit" variant="primary" size="lg" loading={loading} disabled={!valid || loading} className="mt-5 w-full">
                <span className="flex items-center gap-2">{t(cfg.cta)} <ArrowRight className="h-5 w-5" /></span>
              </Button>
              <p className="mt-3 text-center text-xs text-zinc-400 dark:text-zinc-500">
                {t({ uk: "Менеджер зв'яжеться в робочий час і назве вартість. Натискаючи кнопку, ви погоджуєтесь на обробку персональних даних.", en: "A manager will contact you during business hours with a quote. By clicking you agree to the processing of personal data." })}
              </p>
            </form>
          </motion.div>
        </div>
      </section>
    </>
  );
}
