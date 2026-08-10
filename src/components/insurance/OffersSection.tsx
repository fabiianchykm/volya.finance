"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Pencil, Home, ArrowDownWideNarrow, ArrowUpWideNarrow, Percent } from "lucide-react";
import { OfferCard } from "./OfferCard";
import { SearchingInsurers } from "./SearchingInsurers";
import { InviteFriendCard } from "./InviteFriendCard";
import { Button } from "@/components/ui/Button";
import { PRIVILEGES } from "@/lib/constants";
import type { InsuranceOffer } from "@/types/api";
import { osagoStrikePrice } from "@/lib/osago-discounts";
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
  /** Період поліса (12 = рік, 6 = пів року) — показуємо в рядку авто. */
  periodId: number;
}

type SortKey = "price_asc" | "price_desc" | "discount_desc";

// Сума знижки в грн для офера (0, якщо для цієї страхової знижки нема).
function discountAmount(o: InsuranceOffer): number {
  const name = [o.company?.publicName, (o.company as { companyName?: string })?.companyName].filter(Boolean).join(" ");
  const strike = osagoStrikePrice(name, o.price);
  return strike ? strike - o.price : 0;
}

export function OffersSection({
  offers,
  loading = false,
  vehicle,
  buyer,
  onBack,
  onEdit,
  onEditBuyer,
  onSelectOffer,
  periodId,
}: OffersSectionProps) {
  const periodLabel = periodId === 6 ? "пів року" : "1 рік";
  // Чи заповнив користувач дані страхувальника (відрізняються від дефолтних)?
  const buyerSet = buyer.privilegeId !== DEFAULT_BUYER.privilegeId || buyer.birthDate !== DEFAULT_BUYER.birthDate;
  const privilegeLabel = PRIVILEGES.find((p) => p.id === buyer.privilegeId)?.label ?? "Без пільг";
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [dgoMap, setDgoMap] = useState<Record<string, string | null>>({});
  const [autolawyerMap, setAutolawyerMap] = useState<Record<string, string | null>>({});
  const [sortBy, setSortBy] = useState<SortKey>("price_asc");

  const sorted = [...offers].sort((a, b) => {
    if (sortBy === "price_desc") return b.price - a.price;
    if (sortBy === "discount_desc") {
      const d = discountAmount(b) - discountAmount(a);
      return d !== 0 ? d : a.price - b.price; // за рівної знижки — дешевші вище
    }
    return a.price - b.price; // price_asc
  });

  return (
    <section className="min-h-screen pt-20 pb-8">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Ліва колонка: пропозиції */}
        <div className="flex-1 min-w-0">
        {/* Картка авто + дані страхувальника (пільга/ДН) як інтегрована секція */}
        <div className="mb-6 overflow-hidden rounded-2xl bg-white border border-zinc-100 shadow-sm">
          <div className="px-6 pt-4 pb-4">
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
              {`, ${periodLabel}`}
              <button
                onClick={onEdit}
                aria-label="Змінити дані авто"
                className="text-zinc-300 hover:text-indigo-500 transition-colors"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </p>
          </div>

          {/* Пільга + дата народження — впливають на ціну. Прикріплено під авто. */}
          <button
            type="button"
            onClick={onEditBuyer}
            className="flex w-full items-center justify-between gap-3 border-t border-zinc-100 bg-indigo-50/40 px-6 py-3.5 text-left transition-colors hover:bg-indigo-50"
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                <Percent className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                {buyerSet ? (
                  <>
                    <span className="block text-sm font-semibold text-zinc-800">Дані страхувальника</span>
                    <span className="block truncate text-xs text-zinc-500">{privilegeLabel} · нар. {buyer.birthDate}</span>
                  </>
                ) : (
                  <>
                    <span className="block text-sm font-semibold text-zinc-800">Пільга та дата народження</span>
                    <span className="block text-xs text-zinc-500">Вкажіть — ціна може зменшитись</span>
                  </>
                )}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-indigo-600">
              {buyerSet ? "Змінити" : "Вказати"}
              <ChevronRight className="h-4 w-4" />
            </span>
          </button>
        </div>

        {!loading && offers.length > 0 && (
          <div className="mb-5 flex items-center justify-end gap-3">
            <span className="text-xs font-medium text-zinc-400">Сортувати</span>
            <div className="inline-flex items-center gap-1 rounded-full border border-zinc-200/70 bg-white p-1 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              {([
                { k: "price_asc", label: "Спершу дешевші", Icon: ArrowDownWideNarrow },
                { k: "price_desc", label: "Спершу дорожчі", Icon: ArrowUpWideNarrow },
                { k: "discount_desc", label: "Найбільша знижка", Icon: Percent },
              ] as const).map(({ k, label, Icon }) => {
                const active = sortBy === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setSortBy(k)}
                    className={`relative flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors duration-200 ${
                      active ? "text-white" : "text-zinc-500 hover:text-zinc-800"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="sortPill"
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 shadow-sm shadow-indigo-500/30"
                      />
                    )}
                    <Icon className="relative z-10 h-3.5 w-3.5" />
                    <span className="relative z-10">{label}</span>
                  </button>
                );
              })}
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
                discountEligible
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
        <InviteFriendCard />

      </div>{/* кінець flex row */}
      </div>
    </section>
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
