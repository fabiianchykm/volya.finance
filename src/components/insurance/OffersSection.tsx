"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Gift, Users, ChevronRight, Pencil, Home } from "lucide-react";
import { OfferCard } from "./OfferCard";
import { Button } from "@/components/ui/Button";
import type { InsuranceOffer } from "@/types/api";
import type { VehicleData } from "@/types/insurance";
import { formatPrice } from "@/lib/utils";
import { PERIODS } from "@/lib/constants";

interface OffersSectionProps {
  offers: InsuranceOffer[];
  vehicle: VehicleData;
  periodId: number;
  onPeriodChange: (id: number) => void;
  onBack: () => void;
  onSelectOffer: (offer: InsuranceOffer, dgoId: string | null, autolawyerId: string | null) => void;
}

type SortKey = "price_asc" | "price_desc" | "options";

export function OffersSection({
  offers,
  vehicle,
  periodId,
  onPeriodChange,
  onBack,
  onSelectOffer,
}: OffersSectionProps) {
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [dgoMap, setDgoMap] = useState<Record<string, string | null>>({});
  const [autolawyerMap, setAutolawyerMap] = useState<Record<string, string | null>>({});
  const [sortBy, setSortBy] = useState<SortKey>("price_asc");

  const sorted = [...offers].sort((a, b) => {
    if (sortBy === "price_asc") return a.price - b.price;
    if (sortBy === "price_desc") return b.price - a.price;
    if (sortBy === "options")
      return ((b.listDgo?.length ?? 0) + (b.listAutolawyer?.length ?? 0)) -
             ((a.listDgo?.length ?? 0) + (a.listAutolawyer?.length ?? 0));
    return 0;
  });

  const activePeriods = [1, 3, 6, 12] as const;

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
              onClick={onBack}
              className="text-zinc-300 hover:text-indigo-500 transition-colors"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </p>
        </div>

        {/* Банер індивідуальної пропозиції */}
        <div className="mb-5 relative overflow-hidden rounded-2xl px-6 py-5 cursor-pointer group"
          style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)' }}
        >
          {/* Glow ефект */}
          <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-6 -left-4 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

          <div className="relative flex items-center justify-between gap-4">
            <div>
              <p className="text-white font-bold text-base mb-0.5">Знайдіть найвигіднішу пропозицію</p>
              <p className="text-indigo-200 text-sm leading-snug">
                Заповніть форму та миттєво отримайте знижку.
              </p>
            </div>
            <div className="shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 group-hover:bg-white/30 transition-colors">
              <ChevronRight className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>

        <div className="mb-5 flex items-center justify-end gap-2">
          <span className="text-xs font-medium text-zinc-500">Сортувати:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 hover:border-zinc-300 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 transition-colors cursor-pointer"
          >
            <option value="price_asc">Дешевше</option>
            <option value="price_desc">Дорожче</option>
            <option value="options">Кількість опцій</option>
          </select>
        </div>


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

        <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-center gap-6 text-center">
            {[
              { label: "Офіційні поліси", sub: "Реєстрація в МТСБУ" },
              { label: "Безпечна оплата", sub: "Через LiqPay" },
              { label: "Поліс на email", sub: "Протягом 5 хвилин" },
            ].map(({ label, sub }) => (
              <div key={label}>
                <div className="text-sm font-semibold text-zinc-900">{label}</div>
                <div className="text-xs text-zinc-500">{sub}</div>
              </div>
            ))}
          </div>
        </div>
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
                { icon: Users, text: "Запроси друга за своїм посиланням" },
                { icon: Gift, text: "Друг оформлює поліс на Volya" },
                { icon: Gift, text: "Ти отримуєш бонус на рахунок" },
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold">
                    {i + 1}
                  </div>
                  <p className="text-sm text-zinc-600 leading-snug pt-0.5">{text}</p>
                </div>
              ))}

              <button className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-indigo-200">
                Отримати посилання
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

          </div>
        </div>

      </div>{/* кінець flex row */}
      </div>
    </section>
  );
}
