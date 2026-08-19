"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, Pencil, Home, ArrowDownWideNarrow, ArrowUpWideNarrow, Percent, Info } from "lucide-react";
import { OfferCard } from "./OfferCard";
import { SearchingInsurers } from "./SearchingInsurers";
import { Button } from "@/components/ui/Button";
import { PRIVILEGES } from "@/lib/constants";
import type { InsuranceOffer } from "@/types/api";
import { Tooltip } from "@/components/ui/Tooltip";
import { useI18n } from "@/lib/i18n";
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
function OsagoInfo() {
  const { t } = useI18n();
  return (
  <div>
    <div className="mb-2">
      <Tooltip
        className="cursor-help text-zinc-400 transition-colors hover:text-indigo-500 dark:text-zinc-500 dark:hover:text-indigo-400"
        content={t({ uk: "Покриває шкоду, яку ви заподіяли іншим учасникам у ДТП.", en: "Covers the damage you caused to other participants in an accident." })}
      >
        <span className="inline-flex items-center gap-1.5">
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">{t({ uk: "Ліміти", en: "Limits" })}</span>
          <Info className="h-3.5 w-3.5" />
        </span>
      </Tooltip>
    </div>
    {/* Ліміти виплат — простим текстом, без іконок */}
    <div className="flex flex-col gap-2">
      <div>
        <p className="text-sm font-medium leading-tight text-zinc-900 dark:text-zinc-100">{t({ uk: "до 250 000 ₴", en: "up to 250,000 ₴" })}</p>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{t({ uk: "Майно потерпілих — авто, споруди", en: "Victims' property — vehicles, structures" })}</p>
      </div>
      <div>
        <p className="text-sm font-medium leading-tight text-zinc-900 dark:text-zinc-100">{t({ uk: "до 500 000 ₴", en: "up to 500,000 ₴" })}</p>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{t({ uk: "Життя і здоровʼя потерпілих", en: "Life and health of victims" })}</p>
      </div>
    </div>
  </div>
  );
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
  periodId,
}: OffersSectionProps) {
  const { t } = useI18n();
  const periodLabel = periodId === 6 ? t({ uk: "пів року", en: "6 months" }) : t({ uk: "1 рік", en: "1 year" });
  // Чи заповнив користувач дані страхувальника (відрізняються від дефолтних)?
  const buyerSet = buyer.privilegeId !== DEFAULT_BUYER.privilegeId || buyer.birthDate !== DEFAULT_BUYER.birthDate;
  const privilege = PRIVILEGES.find((p) => p.id === buyer.privilegeId);
  const privilegeLabel = privilege ? t({ uk: privilege.label, en: privilege.labelEn }) : t({ uk: "Без пільг", en: "No benefits" });
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [dgoMap, setDgoMap] = useState<Record<string, string | null>>({});
  const [autolawyerMap, setAutolawyerMap] = useState<Record<string, string | null>>({});
  const [sortBy, setSortBy] = useState<SortKey>("price_asc");
  const [sortOpen, setSortOpen] = useState(false);
  const SORT_OPTIONS = [
    { k: "price_asc", label: "Спершу дешевші", en: "Cheapest first", Icon: ArrowDownWideNarrow },
    { k: "price_desc", label: "Спершу дорожчі", en: "Most expensive first", Icon: ArrowUpWideNarrow },
  ] as const;
  const activeSort = SORT_OPTIONS.find((o) => o.k === sortBy) ?? SORT_OPTIONS[0];

  const sorted = [...offers].sort((a, b) => {
    if (sortBy === "price_desc") return b.price - a.price;
    return a.price - b.price; // price_asc
  });

  return (
    <section className="min-h-screen bg-[#F5F5F7] pt-20 pb-8 dark:bg-[#0a0a0b]">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Ліва колонка: пропозиції */}
        <div className="flex-1 min-w-0">
        {/* Картка авто + дані страхувальника (пільга/ДН) як інтегрована секція */}
        <div className="mb-6 overflow-hidden rounded-2xl bg-white border border-zinc-100 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
          <div className="px-6 pt-4 pb-4">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-3 dark:text-zinc-500">
              <button onClick={onBack} aria-label={t({ uk: "На головну", en: "Home" })} className="hover:text-indigo-500 transition-colors dark:hover:text-indigo-400">
                <Home className="h-3.5 w-3.5" />
              </button>
              <ChevronRight className="h-3 w-3" />
              <span className="text-zinc-600 font-medium dark:text-zinc-300">{t({ uk: "Автоцивілка", en: "OSAGO" })}</span>
            </div>

            <p className="font-bold text-zinc-900 inline-flex items-center gap-2 flex-wrap dark:text-zinc-100" style={{ fontSize: 19 }}>
              {vehicle.mark} {vehicle.model}
              {vehicle.year && `, ${vehicle.year}`}
              {vehicle.cityName && `, ${vehicle.cityName.replace(/,?\s*Україна$/i, '')}`}
              {`, ${periodLabel}`}
              <button
                onClick={onEdit}
                aria-label={t({ uk: "Змінити дані авто", en: "Edit vehicle data" })}
                className="text-zinc-300 hover:text-indigo-500 transition-colors dark:text-zinc-600 dark:hover:text-indigo-400"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </p>
          </div>

          {/* Пільга + дата народження — впливають на ціну. Прикріплено під авто. */}
          <button
            type="button"
            onClick={onEditBuyer}
            className="flex w-full items-center justify-between gap-3 border-t border-zinc-100 bg-indigo-50/40 px-6 py-3.5 text-left transition-colors hover:bg-indigo-50 dark:border-zinc-800 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/60"
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400">
                <Percent className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-zinc-800 dark:text-zinc-200">{t({ uk: "Індивідуальна пропозиція", en: "Personalised offer" })}</span>
                {/* Дані, введені на попередньому кроці (впливають на ціну по кожній СК).
                    З реєстру приходить лише ВІК власника (день/місяць фейкові) → рік. */}
                <span className="mt-0.5 block space-y-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {buyer.policyholderBirthDate && (
                    <span className="block">{t({ uk: "Страхувальник: ", en: "Policyholder: " })}<span className="font-medium text-zinc-700 dark:text-zinc-300">{buyer.policyholderBirthDate}</span></span>
                  )}
                  {buyer.youngestBirthDate && (
                    <span className="block">{t({ uk: "Наймолодший водій: ", en: "Youngest driver: " })}<span className="font-medium text-zinc-700 dark:text-zinc-300">{buyer.youngestBirthDate}</span></span>
                  )}
                  {buyer.birthDate && (
                    <span className="block">{t({ uk: "Власник авто: ", en: "Vehicle owner: " })}<span className="font-medium text-zinc-700 dark:text-zinc-300">{t({ uk: `${buyer.birthDate.split(".")[2]} р.н.`, en: `b. ${buyer.birthDate.split(".")[2]}` })}</span></span>
                  )}
                  {buyerSet && <span className="block">{privilegeLabel}</span>}
                </span>
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              {buyerSet ? t({ uk: "Змінити", en: "Edit" }) : t({ uk: "Вказати", en: "Specify" })}
              <ChevronRight className="h-4 w-4" />
            </span>
          </button>
        </div>

        {!loading && offers.length > 0 && (
          <div className="mb-5 flex items-center justify-end gap-3">
            <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">{t({ uk: "Сортувати", en: "Sort" })}</span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setSortOpen((o) => !o)}
                aria-expanded={sortOpen}
                aria-haspopup="menu"
                className="flex min-w-[190px] items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 shadow-sm transition-colors hover:border-indigo-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              >
                <span className="flex items-center gap-1.5"><activeSort.Icon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />{t({ uk: activeSort.label, en: activeSort.en })}</span>
                <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform dark:text-zinc-500 ${sortOpen ? "rotate-180" : ""}`} />
              </button>
              {sortOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                  <div className="absolute right-0 top-full z-20 mt-2 w-[220px] overflow-hidden rounded-xl border border-zinc-100 bg-white p-1.5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
                    {SORT_OPTIONS.map(({ k, label, en, Icon }) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => { setSortBy(k); setSortOpen(false); }}
                        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                          sortBy === k ? "bg-indigo-50 font-semibold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300" : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800/60"
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                        {t({ uk: label, en })}
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
          <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{t({ uk: "Пропозицій не знайдено", en: "No offers found" })}</p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t({ uk: "Спробуйте змінити параметри авто.", en: "Try changing the vehicle parameters." })}</p>
            <Button variant="secondary" size="md" onClick={onBack} className="mt-5">
              {t({ uk: "Назад", en: "Back" })}
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
                showAgeBasis
                productDescription={<OsagoInfo />}
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
    <div className="animate-pulse rounded-2xl bg-white border border-zinc-100 shadow-sm px-6 py-5 dark:bg-zinc-900 dark:border-zinc-800">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
          <div className="space-y-2">
            <div className="h-4 w-32 rounded bg-zinc-100 dark:bg-zinc-800" />
            <div className="h-3 w-20 rounded bg-zinc-100 dark:bg-zinc-800" />
          </div>
        </div>
        <div className="space-y-2 text-right">
          <div className="ml-auto h-6 w-24 rounded bg-zinc-100 dark:bg-zinc-800" />
          <div className="ml-auto h-3 w-16 rounded bg-zinc-100 dark:bg-zinc-800" />
        </div>
      </div>
      <div className="mt-4 h-10 w-full rounded-xl bg-zinc-100 dark:bg-zinc-800" />
    </div>
  );
}
