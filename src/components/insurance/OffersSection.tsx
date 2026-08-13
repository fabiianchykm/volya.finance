"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, Pencil, Home, ArrowDownWideNarrow, ArrowUpWideNarrow, Percent } from "lucide-react";
import { OfferCard } from "./OfferCard";
import { SearchingInsurers } from "./SearchingInsurers";
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

// Опис ОСЦПВ для «Детальніше» (продукт стандартизований законом — текст однаковий).
const OSAGO_INFO = (
  <div>
    {/* Ліміти виплат — простим текстом, без іконок */}
    <div className="flex flex-col gap-2">
      <div>
        <p className="text-sm font-bold leading-tight text-zinc-900">до 250 000 ₴</p>
        <p className="text-[11px] text-zinc-500">Майно потерпілих — авто, споруди</p>
      </div>
      <div>
        <p className="text-sm font-bold leading-tight text-zinc-900">до 500 000 ₴</p>
        <p className="text-[11px] text-zinc-500">Життя і здоровʼя потерпілих</p>
      </div>
    </div>
  </div>
);

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
  const [sortOpen, setSortOpen] = useState(false);
  const SORT_OPTIONS = [
    { k: "price_asc", label: "Спершу дешевші", Icon: ArrowDownWideNarrow },
    { k: "price_desc", label: "Спершу дорожчі", Icon: ArrowUpWideNarrow },
    { k: "discount_desc", label: "Найбільша знижка", Icon: Percent },
  ] as const;
  const activeSort = SORT_OPTIONS.find((o) => o.k === sortBy) ?? SORT_OPTIONS[0];

  const sorted = [...offers].sort((a, b) => {
    if (sortBy === "price_desc") return b.price - a.price;
    if (sortBy === "discount_desc") {
      const d = discountAmount(b) - discountAmount(a);
      return d !== 0 ? d : a.price - b.price; // за рівної знижки — дешевші вище
    }
    return a.price - b.price; // price_asc
  });

  return (
    <section className="min-h-screen bg-[#F5F5F7] pt-20 pb-8">
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
                    {/* З реєстру приходить лише ВІК (день/місяць фейкові = сьогодні), тож
                        показуємо рік народження, а не повну дату. */}
                    <span className="block truncate text-xs text-zinc-500">{privilegeLabel}{buyer.birthDate ? ` · ${buyer.birthDate.split(".")[2]} р.н.` : ""}</span>
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
            <div className="relative">
              <button
                type="button"
                onClick={() => setSortOpen((o) => !o)}
                aria-expanded={sortOpen}
                className="flex min-w-[190px] items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 shadow-sm transition-colors hover:border-indigo-300"
              >
                <span className="flex items-center gap-1.5"><activeSort.Icon className="h-4 w-4 text-indigo-600" />{activeSort.label}</span>
                <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform ${sortOpen ? "rotate-180" : ""}`} />
              </button>
              {sortOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                  <div className="absolute right-0 top-full z-20 mt-2 w-[220px] overflow-hidden rounded-xl border border-zinc-100 bg-white p-1.5 shadow-xl">
                    {SORT_OPTIONS.map(({ k, label, Icon }) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => { setSortBy(k); setSortOpen(false); }}
                        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                          sortBy === k ? "bg-indigo-50 font-semibold text-indigo-700" : "text-zinc-700 hover:bg-zinc-50"
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0 text-indigo-600" />
                        {label}
                      </button>
                    ))}
                  </div>
                </>
              )}
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
                productDescription={OSAGO_INFO}
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
