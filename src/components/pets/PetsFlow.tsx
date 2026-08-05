"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, ArrowRight, Home, ChevronRight, ArrowDownWideNarrow, ArrowUpWideNarrow } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { parseUaDate } from "@/components/ui/DateInput";
import { OfferCard } from "@/components/insurance/OfferCard";
import { InviteFriendCard } from "@/components/insurance/InviteFriendCard";
import { SearchingInsurers } from "@/components/insurance/SearchingInsurers";
import { PetsCheckout, type PetsCheckoutCtx } from "./PetsCheckout";
import type { PetsOffer, InsuranceOffer } from "@/types/api";
import { trackEvent } from "@/lib/analytics";

// Страхування тварин — потік і дизайн як у туристичному/зеленій карті: темний
// герой для форми (вид, дата, строк), далі світлий екран пропозицій.

const PET_TYPES = [
  { value: "cat", label: "Кіт / кішка", emoji: "🐱" },
  { value: "dog", label: "Собака", emoji: "🐶" },
];
const PERIODS = [
  { value: "6m", label: "6 місяців" },
  { value: "9m", label: "9 місяців" },
  { value: "12m", label: "12 місяців" },
] as const;
const PERIOD_LABEL: Record<string, string> = { "6m": "6 місяців", "9m": "9 місяців", "12m": "12 місяців" };

const selectClass =
  "h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-indigo-400";

function toPetsInsuranceOffer(o: PetsOffer): InsuranceOffer {
  return {
    offerId: o.offerId,
    price: o.price,
    company: { publicName: o.company?.publicName || o.companyNamePublic || o.companyName || "", logo: o.company?.logo ?? null },
    listDgo: [],
    listAutolawyer: [],
  } as unknown as InsuranceOffer;
}

export function PetsFlow() {
  const [step, setStep] = useState<"form" | "offers" | "checkout">("form");
  const [petType, setPetType] = useState("cat");
  // Дата початку зашита за замовчуванням (мінімум за API — через 10 днів), поле не показуємо.
  const [startDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 10);
    const p = (n: number) => String(n).padStart(2, "0");
    return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
  });
  const [period, setPeriod] = useState<"6m" | "9m" | "12m">("12m");

  const [offers, setOffers] = useState<PetsOffer[]>([]);
  const [earnings, setEarnings] = useState<number>(15);
  const [selectedOffer, setSelectedOffer] = useState<PetsOffer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = !!parseUaDate(startDate);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || loading) return;
    setError(null);
    setOffers([]);
    setLoading(true);
    setStep("offers");
    trackEvent("calculate_cost", { product: "pets" });
    try {
      const res = await fetch("/api/pets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ startFrom: startDate, insurancePeriod: period }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) throw new Error(data?.error ?? "Не вдалося отримати пропозиції");
      const list: PetsOffer[] = (data.offers ?? []).filter((o: PetsOffer) => o && o.price > 0);
      list.sort((a, b) => a.price - b.price);
      setOffers(list);
      if (typeof data.earnings === "number") setEarnings(data.earnings);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося отримати пропозиції.");
    } finally {
      setLoading(false);
    }
  };

  // ── Світлий екран: пропозиції / оформлення ──
  if (step === "offers" || step === "checkout") {
    return (
      <>
        <Navbar solid />
        <section className="min-h-screen pt-20 pb-10">
          <div className={`mx-auto px-4 sm:px-6 ${step === "offers" ? "max-w-[1200px]" : "max-w-3xl"}`}>
            {step === "offers" ? (
              <div className="flex flex-col items-start gap-6 lg:flex-row">
                <div className="min-w-0 flex-1">
                  <PetsOffers
                    offers={offers}
                    loading={loading}
                    error={error}
                    petLabel={PET_TYPES.find((p) => p.value === petType)?.label ?? ""}
                    periodLabel={PERIOD_LABEL[period]}
                    onBack={() => { setError(null); setStep("form"); }}
                    onSelect={(o) => { setSelectedOffer(o); setStep("checkout"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  />
                </div>
                <InviteFriendCard />
              </div>
            ) : selectedOffer ? (
              <PetsCheckout
                ctx={{ offer: selectedOffer, petType, insurancePeriod: period, startDate, earnings } satisfies PetsCheckoutCtx}
                onBack={() => setStep("offers")}
              />
            ) : null}
          </div>
        </section>
      </>
    );
  }

  // ── Темний герой: форма ──
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
                Страхування тварин
                <span className="mt-1 block bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                  захист вашого улюбленця
                </span>
              </h1>
              <p className="mx-auto max-w-xl text-base text-zinc-300">Оберіть параметри — і побачите пропозиції з цінами.</p>
            </div>

            <form onSubmit={submit} className="rounded-2xl bg-white p-5 text-left shadow-2xl sm:p-7">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-medium text-zinc-500">Вид улюбленця</label>
                  <div className="grid grid-cols-2 gap-2">
                    {PET_TYPES.map((p) => (
                      <button key={p.value} type="button" onClick={() => setPetType(p.value)}
                        className={`flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-medium transition-colors ${
                          petType === p.value ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200" : "border-zinc-200 bg-white text-zinc-600 hover:border-indigo-200"
                        }`}>
                        <span className="text-base">{p.emoji}</span> {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-zinc-500"><Clock className="h-3.5 w-3.5" /> Строк страхування</label>
                  <select value={period} onChange={(e) => setPeriod(e.target.value as typeof period)} className={selectClass}>
                    {PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
              </div>

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

function PetsOffers({ offers, loading, error, petLabel, periodLabel, onBack, onSelect }: {
  offers: PetsOffer[];
  loading: boolean;
  error: string | null;
  petLabel: string;
  periodLabel: string;
  onBack: () => void;
  onSelect: (o: PetsOffer) => void;
}) {
  const [sortBy, setSortBy] = useState<"price_asc" | "price_desc">("price_asc");
  const cards = [...offers].sort((a, b) => (sortBy === "price_desc" ? b.price - a.price : a.price - b.price));
  const summary = [petLabel, periodLabel].filter(Boolean).join(" · ");

  return (
    <div>
      {/* Картка-підсумок */}
      <div className="mb-6 rounded-2xl border border-zinc-100 bg-white px-6 py-4 shadow-sm">
        <div className="mb-3 flex items-center gap-1.5 text-xs text-zinc-400">
          <button type="button" onClick={onBack} className="transition-colors hover:text-indigo-500" aria-label="Змінити параметри">
            <Home className="h-3.5 w-3.5" />
          </button>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-zinc-600">Страхування тварин</span>
        </div>
        <p className="font-bold text-zinc-900" style={{ fontSize: 19 }}>{summary}</p>
      </div>

      {!loading && cards.length > 0 && (
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
                  <motion.span layoutId="petsSortPill" transition={{ type: "spring", stiffness: 420, damping: 34 }}
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
        <SearchingInsurers />
      ) : error || cards.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-12 text-center">
          <p className="text-base font-semibold text-zinc-900">{error ? "Не вдалося отримати пропозиції" : "Пропозицій не знайдено"}</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-500">{error ? "Спробуйте ще раз або змініть параметри." : "Спробуйте інший строк або дату."}</p>
          <Button variant="secondary" size="md" onClick={onBack} className="mt-5">Змінити параметри</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {cards.map((o, i) => (
            <OfferCard
              key={o.offerId}
              index={i}
              offer={toPetsInsuranceOffer(o)}
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
    </div>
  );
}
