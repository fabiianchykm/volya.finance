"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { signIn } from "next-auth/react";
import { Gift, ChevronRight, Pencil, Home, Copy, Check, Loader2, ArrowDownWideNarrow, ArrowUpWideNarrow } from "lucide-react";
import { OfferCard } from "./OfferCard";
import { Button } from "@/components/ui/Button";
import { PRIVILEGES } from "@/lib/constants";
import type { InsuranceOffer } from "@/types/api";
import { DEFAULT_BUYER, type BuyerData, type VehicleData } from "@/types/insurance";

interface OffersSectionProps {
  offers: InsuranceOffer[];
  loading?: boolean;
  vehicle: VehicleData;
  buyer: BuyerData;
  onBack: () => void;
  onEdit: () => void;
  onEditBuyer: () => void;
  onSelectOffer: (offer: InsuranceOffer, dgoId: string | null, autolawyerId: string | null) => void;
}

type SortKey = "price_asc" | "price_desc";

export function OffersSection({
  offers,
  loading = false,
  vehicle,
  buyer,
  onBack,
  onEdit,
  onEditBuyer,
  onSelectOffer,
}: OffersSectionProps) {
  // Чи заповнив користувач дані страхувальника (відрізняються від дефолтних)?
  const buyerSet = buyer.privilegeId !== DEFAULT_BUYER.privilegeId || buyer.birthDate !== DEFAULT_BUYER.birthDate;
  const privilegeLabel = PRIVILEGES.find((p) => p.id === buyer.privilegeId)?.label ?? "Без пільг";
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [dgoMap, setDgoMap] = useState<Record<string, string | null>>({});
  const [autolawyerMap, setAutolawyerMap] = useState<Record<string, string | null>>({});
  const [sortBy, setSortBy] = useState<SortKey>("price_asc");

  // Реферальний банер: за кліком тягнемо посилання залогіненого користувача;
  // гостю пропонуємо вхід через Google (без нього нема кому нараховувати бонус).
  const [refLink, setRefLink] = useState<string | null>(null);
  const [refLoading, setRefLoading] = useState(false);
  const [refCopied, setRefCopied] = useState(false);

  const handleGetLink = async () => {
    if (refLink || refLoading) return;
    setRefLoading(true);
    try {
      const res = await fetch("/api/referral");
      const data = await res.json();
      if (data.loggedIn && data.available) setRefLink(data.link);
      else if (!data.loggedIn) signIn("google");
    } catch {
      // тимчасовий збій — користувач може спробувати ще раз
    } finally {
      setRefLoading(false);
    }
  };

  const copyRefLink = async () => {
    if (!refLink) return;
    try {
      await navigator.clipboard.writeText(refLink);
      setRefCopied(true);
      setTimeout(() => setRefCopied(false), 2000);
    } catch {
      // clipboard недоступний
    }
  };

  const sorted = [...offers].sort((a, b) => {
    if (sortBy === "price_desc") return b.price - a.price;
    return a.price - b.price; // price_asc
  });

  return (
    <section className="min-h-screen pt-20 pb-8">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Ліва колонка: пропозиції */}
        <div className="flex-1 min-w-0">
        {/* Картка авто */}
        <div className="mb-6 rounded-2xl bg-white border border-zinc-100 shadow-sm px-6 py-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-3">
            <button onClick={onBack} className="hover:text-indigo-500 transition-colors">
              <Home className="h-3.5 w-3.5" />
            </button>
            <ChevronRight className="h-3 w-3" />
            <span className="text-zinc-600 font-medium">Автоцивілка</span>
          </div>

          <p className="font-bold text-zinc-900 inline-flex items-center gap-2 flex-wrap" style={{ fontSize: 19 }}>
            {vehicle.mark} {vehicle.model}
            {vehicle.year && `, ${vehicle.year}`}
            {vehicle.cityName && `, ${vehicle.cityName.replace(/,?\s*Україна$/i, '')}`}
            <button
              onClick={onEdit}
              aria-label="Змінити дані авто"
              className="text-zinc-300 hover:text-indigo-500 transition-colors"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </p>
        </div>

        {/* Банер даних страхувальника (впливають на ціну) */}
        <div
          onClick={onEditBuyer}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onEditBuyer(); }}
          className="mb-5 relative overflow-hidden rounded-2xl px-6 py-5 cursor-pointer group outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
          style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)' }}
        >
          {/* Glow ефект */}
          <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-6 -left-4 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

          <div className="relative flex items-center justify-between gap-4">
            {buyerSet ? (
              <div>
                <p className="text-white font-bold text-base mb-0.5">Дані страхувальника</p>
                <p className="text-indigo-100 text-sm leading-snug">
                  {privilegeLabel} · нар. {buyer.birthDate}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-white font-bold text-base mb-0.5">Знайдіть найвигіднішу пропозицію</p>
                <p className="text-indigo-200 text-sm leading-snug">
                  Вкажіть пільгу й дату народження — ціна може зменшитись.
                </p>
              </div>
            )}
            <div className="shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 group-hover:bg-white/30 transition-colors">
              {buyerSet
                ? <Pencil className="h-4 w-4 text-white" />
                : <ChevronRight className="h-5 w-5 text-white" />}
            </div>
          </div>
        </div>

        {!loading && offers.length > 0 && (
          <div className="mb-5 flex items-center justify-end gap-2.5">
            <span className="text-xs font-medium text-zinc-400">Сортувати</span>
            <div className="inline-flex rounded-xl border border-zinc-200 bg-zinc-100/70 p-0.5">
              {([
                { k: "price_asc", label: "Спершу дешевші", Icon: ArrowDownWideNarrow },
                { k: "price_desc", label: "Спершу дорожчі", Icon: ArrowUpWideNarrow },
              ] as const).map(({ k, label, Icon }) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setSortBy(k)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    sortBy === k
                      ? "bg-white text-indigo-600 shadow-sm ring-1 ring-black/5"
                      : "text-zinc-500 hover:text-zinc-700"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}


        {loading ? (
          <div className="space-y-3">
            <SearchingInsurers />
            {Array.from({ length: 5 }).map((_, i) => (
              <OfferCardSkeleton key={i} />
            ))}
          </div>
        ) : offers.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-12 text-center">
            <p className="text-base font-semibold text-zinc-900">Пропозицій не знайдено</p>
            <p className="mt-1 text-sm text-zinc-500">Спробуйте змінити параметри авто.</p>
            <Button variant="secondary" size="md" onClick={onBack} className="mt-5">
              Назад
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((offer, i) => (
              <OfferCard
                key={offer.offerId}
                offer={offer}
                index={i}
                selected={selectedOfferId === offer.offerId}
                selectedDgoId={dgoMap[offer.offerId] ?? null}
                selectedAutolawyerId={autolawyerMap[offer.offerId] ?? null}
                onSelect={() => setSelectedOfferId(offer.offerId)}
                onSelectDgo={(id) => setDgoMap((m) => ({ ...m, [offer.offerId]: id }))}
                onSelectAutolawyer={(id) => setAutolawyerMap((m) => ({ ...m, [offer.offerId]: id }))}
                onBuy={() =>
                  onSelectOffer(
                    offer,
                    dgoMap[offer.offerId] ?? null,
                    autolawyerMap[offer.offerId] ?? null
                  )
                }
              />
            ))}
          </div>
        )}

        </div>{/* кінець лівої колонки */}

        {/* Права колонка: реферальний банер */}
        <div className="w-full lg:w-72 shrink-0 lg:sticky lg:top-8">
          <div className="rounded-2xl overflow-hidden border border-zinc-100 shadow-sm bg-white">

            {/* Шапка банера */}
            <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-6 text-white">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white/20 mb-4">
                <Gift className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-bold leading-tight mb-1">
                Запрошуй друзів — отримуй бонуси
              </h3>
              <p className="text-sm text-indigo-100 leading-relaxed">
                Діліться своїм посиланням і заробляйте за кожного нового клієнта
              </p>
            </div>

            {/* Кроки */}
            <div className="p-5 flex flex-col gap-4">
              {[
                { text: "Запроси друга за своїм посиланням" },
                { text: "Друг оформлює поліс на Volya" },
                { text: "Ти отримуєш бонус на рахунок" },
              ].map(({ text }, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold">
                    {i + 1}
                  </div>
                  <p className="text-sm text-zinc-600 leading-snug pt-0.5">{text}</p>
                </div>
              ))}

              {refLink ? (
                <div className="mt-2">
                  <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white p-1.5">
                    <input
                      readOnly
                      value={refLink}
                      onFocus={(e) => e.currentTarget.select()}
                      className="w-full bg-transparent px-2 text-xs text-zinc-600 outline-none"
                    />
                    <button
                      type="button"
                      onClick={copyRefLink}
                      className="flex shrink-0 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                    >
                      {refCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {refCopied ? "Готово" : "Копі"}
                    </button>
                  </div>
                  <p className="mt-2 text-center text-xs text-zinc-400">Діліться посиланням — отримуйте 5% з полісів друзів</p>
                </div>
              ) : (
                <button
                  onClick={handleGetLink}
                  disabled={refLoading}
                  className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-indigo-200 disabled:opacity-70"
                >
                  {refLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Отримуємо…
                    </>
                  ) : (
                    <>
                      Отримати посилання
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              )}
            </div>

          </div>
        </div>

      </div>{/* кінець flex row */}
      </div>
    </section>
  );
}

// Placeholder card shown while offers are loading.
// Динамічний індикатор пошуку: «опитуємо» страховиків по черзі — реальні назви
// компаній змінюються, щоб було відчуття живого порівняння тарифів.
const SEARCHED_INSURERS = [
  "ІНГО", "PZU", "УНІКА", "ARX", "Оранта", "ТАС", "Княжа", "УСГ",
  "VUSO", "Euroins", "Guardian", "Арсенал", "Експрес", "EIA", "UTICO", "BBS Insurance",
];

function SearchingInsurers() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => v + 1), 480);
    return () => clearInterval(t);
  }, []);
  const name = SEARCHED_INSURERS[i % SEARCHED_INSURERS.length];
  return (
    <div className="mb-4 flex items-center justify-center gap-2.5 rounded-2xl border border-indigo-100 bg-indigo-50/40 px-4 py-3">
      <span className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-500" />
      <p className="flex flex-wrap items-center justify-center gap-x-1.5 text-sm text-zinc-600">
        <span>Порівнюємо тарифи страховиків —</span>
        <span className="inline-flex min-w-[7rem] justify-center overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={name + i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="font-semibold text-indigo-600"
            >
              {name}
            </motion.span>
          </AnimatePresence>
        </span>
      </p>
    </div>
  );
}

function OfferCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl bg-white border border-zinc-100 shadow-sm px-6 py-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-zinc-100" />
          <div className="space-y-2">
            <div className="h-4 w-32 rounded bg-zinc-100" />
            <div className="h-3 w-20 rounded bg-zinc-100" />
          </div>
        </div>
        <div className="space-y-2 text-right">
          <div className="ml-auto h-6 w-24 rounded bg-zinc-100" />
          <div className="ml-auto h-3 w-16 rounded bg-zinc-100" />
        </div>
      </div>
      <div className="mt-4 h-10 w-full rounded-xl bg-zinc-100" />
    </div>
  );
}
