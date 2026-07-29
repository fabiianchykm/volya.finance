"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plane, MapPin, CalendarDays, Users, ArrowRight, ArrowLeft, Loader2, ShieldCheck, Coins } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DateInput, parseUaDate } from "@/components/ui/DateInput";
import { DateRangeInput, daysBetween } from "@/components/ui/DateRangeInput";
import { companyLogo } from "@/lib/logos";
import { formatPrice, formatCompanyName } from "@/lib/utils";
import { BONUS_RATE } from "@/lib/constants";
import { TourismCheckout, type TourismCheckoutCtx } from "./TourismCheckout";
import type { TourismOffer } from "@/types/api";

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

const selectClass =
  "h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-indigo-400";

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
  const setTourists = (n: number) => setBirthDates((arr) => {
    const next = arr.slice(0, n);
    while (next.length < n) next.push("");
    return next;
  });

  const startD = parseUaDate(startDate);
  const endD = parseUaDate(endDate);
  const days = startD && endD ? daysBetween(startD, endD) : 0;
  const valid = !!startD && !!endD && days > 0 && birthDates.every((b) => parseUaDate(b));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || loading) return;
    setLoading(true);
    setError(null);
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
              <Plane className="h-7 w-7 text-indigo-300" />
            </div>
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
              Туристичне страхування —
              <span className="mt-1 block bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                захист у подорожі за кордон
              </span>
            </h1>
            {step === "form" && (
              <p className="mx-auto max-w-xl text-base text-zinc-300">Оберіть параметри подорожі — і побачите пропозиції з цінами й покриттям.</p>
            )}
          </div>

          {step === "form" ? (
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

              <div className="mt-4">
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-500"><Users className="h-3.5 w-3.5" /> Туристи ({birthDates.length})</label>
                <div className="mb-2 flex items-center gap-2">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <button key={n} type="button" onClick={() => setTourists(n)}
                      className={`h-9 w-9 rounded-lg border text-sm font-medium transition-colors ${birthDates.length === n ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-zinc-200 text-zinc-600 hover:border-indigo-200"}`}>{n}</button>
                  ))}
                  <span className="ml-1 text-xs text-zinc-400">кількість туристів</span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {birthDates.map((b, i) => (
                    <DateInput key={i} label={`Дата народження ${i + 1}`} value={b} onChange={(v) => setBirth(i, v)} defaultYear={1990} required />
                  ))}
                </div>
              </div>

              <label className="mt-4 flex cursor-pointer items-center gap-2.5">
                <input type="checkbox" checked={multiVisa} onChange={(e) => setMultiVisa(e.target.checked)} className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm text-zinc-700">Річний поліс (мультивіза) — багато поїздок за рік</span>
              </label>

              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

              <Button type="submit" variant="primary" size="lg" loading={loading} disabled={!valid || loading} className="mt-5 w-full">
                <span className="flex items-center gap-2">
                  {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Шукаємо пропозиції…</> : <>Показати пропозиції <ArrowRight className="h-5 w-5" /></>}
                </span>
              </Button>
            </form>
          ) : step === "offers" ? (
            <TourismOffers
              offers={offers}
              onBack={() => setStep("form")}
              onSelect={(offer) => { setSelectedOffer(offer); setStep("checkout"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            />
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
        </motion.div>
      </div>
    </section>
  );
}

function TourismOffers({ offers, onBack, onSelect }: { offers: TourismOffer[]; onBack: () => void; onSelect: (offer: TourismOffer) => void }) {
  // Рівні покриття, наявні у відповіді (10к…100к EUR). Мінімум для Шенгену — 30 000.
  const coverages = Array.from(new Set(offers.map(coverageOf).filter((c) => c > 0))).sort((a, b) => a - b);
  const [coverage, setCoverage] = useState<number>(coverages.includes(30000) ? 30000 : coverages[0] ?? 0);
  const currency = offers.find((o) => coverageOf(o) === coverage)?.limit_currency || "EUR";

  // За обраним покриттям — найдешевший варіант для кожної пари «страхова + програма»
  // (Економ/Стандарт/Еліт як окремі пропозиції), щоб було з чого обирати.
  const best = new Map<string, TourismOffer>();
  for (const o of offers.filter((o) => coverageOf(o) === coverage)) {
    const key = [o.company?.publicName || o.company?.name, o.tripProgram].filter(Boolean).join("|") || o.offerId;
    const prev = best.get(key);
    if (!prev || o.price < prev.price) best.set(key, o);
  }
  const cards = Array.from(best.values()).sort((a, b) => a.price - b.price);

  return (
    <div className="rounded-2xl bg-white p-5 text-left shadow-2xl sm:p-7">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-zinc-900">{cards.length ? `Пропозицій: ${cards.length}` : "Пропозицій не знайдено"}</h2>
        <button type="button" onClick={onBack} className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-indigo-600 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Змінити параметри
        </button>
      </div>

      {coverages.length > 1 && (
        <div className="mb-5">
          <p className="mb-2 text-xs font-medium text-zinc-500">Сума покриття</p>
          <div className="flex flex-wrap gap-2">
            {coverages.map((c) => (
              <button key={c} type="button" onClick={() => setCoverage(c)}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${c === coverage ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-zinc-200 text-zinc-600 hover:border-indigo-200"}`}>
                {new Intl.NumberFormat("uk-UA").format(c)} {currency}
              </button>
            ))}
          </div>
        </div>
      )}

      {cards.length === 0 ? (
        <p className="text-sm text-zinc-500">За обраними параметрами пропозицій немає. Спробуйте інші дати чи зону.</p>
      ) : (
        <div className="space-y-3">
          {cards.map((o) => <TourismOfferCard key={o.offerId} offer={o} onSelect={() => onSelect(o)} />)}
        </div>
      )}
    </div>
  );
}

function TourismOfferCard({ offer, onSelect }: { offer: TourismOffer; onSelect: () => void }) {
  const publicName = offer.company?.publicName || offer.company?.name || "";
  const src = companyLogo(publicName) || offer.company?.logo || null;
  const displayName = formatCompanyName(publicName).toUpperCase();
  const program = offer.tripProgram ? PROGRAM_LABELS[offer.tripProgram.toLowerCase()] ?? offer.tripProgram : null;
  const cov = coverageOf(offer);
  const limit = cov ? `${new Intl.NumberFormat("uk-UA").format(cov)} ${offer.limit_currency || "EUR"}` : null;
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:gap-4">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-100 bg-white p-1.5">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={displayName || "logo"} className="max-h-full max-w-full object-contain" />
        ) : (
          <ShieldCheck className="h-6 w-6 text-zinc-300" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-zinc-900">{displayName}</p>
        <p className="text-xs text-zinc-500">
          {program && <span>{program}</span>}
          {program && limit && <span> · </span>}
          {limit && <span>покриття {limit}</span>}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end">
        <p className="text-lg font-bold text-zinc-900">{formatPrice(offer.price)}</p>
        <span title="1% від вартості полісу на бонусний рахунок" className="mt-0.5 flex items-center gap-1 whitespace-nowrap text-[11px] font-semibold text-emerald-600">
          <Coins className="h-3 w-3" /> +{formatPrice(Math.round(offer.price * BONUS_RATE))} бонус
        </span>
      </div>
      <button type="button" onClick={onSelect} className="flex shrink-0 items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700">
        Оформити
      </button>
    </div>
  );
}
