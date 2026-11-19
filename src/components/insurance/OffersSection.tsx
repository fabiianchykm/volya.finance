"use client";

import { useState, useMemo } from "react";
import { insurerFailuresText, type InsurerFailure } from "@/lib/insurer-errors";
import { AlertTriangle } from "lucide-react";
import { ChevronRight, ChevronDown, Pencil, Home, ArrowDownWideNarrow, ArrowUpWideNarrow, Sparkles, Info, Car, MapPin, CalendarDays, Columns3, CalendarRange } from "lucide-react";
import { rankOffers, offerBadges, badgeText, type OfferSortKey } from "@/lib/offer-ranking";
import { installmentEligibleOffers } from "@/lib/installment";
import { usePopularity } from "@/lib/use-popularity";
import { OfferCard } from "./OfferCard";
import { CompareOffersModal } from "./CompareOffersModal";
import { SearchingInsurers } from "./SearchingInsurers";
import { Button } from "@/components/ui/Button";
import { PRIVILEGES } from "@/lib/constants";
import type { InsuranceOffer } from "@/types/api";
import { Tooltip } from "@/components/ui/Tooltip";
import { useI18n } from "@/lib/i18n";
import { DEFAULT_BUYER, type BuyerData, type VehicleData } from "@/types/insurance";

interface OffersSectionProps {
  offers: InsuranceOffer[];
  /** СК, що не порахували (тимчасовий збій / не приймає формат номера). */
  failures?: InsurerFailure[];
  loading?: boolean;
  /** Відкрито обовʼязковий діалог ДН і ще не рахували — показуємо спокійний плейсхолдер, не «пошук». */
  awaitingBuyer?: boolean;
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

type SortKey = OfferSortKey;

// Прибираємо «Україна» та (коли відомий район) — область, щоб не захаращувати рядок.
function cityLabel(city: string): string {
  const parts = city.replace(/,?\s*Україна\.?$/i, "").split(",").map((s) => s.trim()).filter(Boolean);
  const hasRaion = parts.some((p) => /р-?н|район/i.test(p));
  const kept = hasRaion ? parts.filter((p) => !/\bобл(асть|\.)?/i.test(p)) : parts;
  return kept.join(", ");
}

export function OffersSection({
  offers,
  failures = [],
  loading = false,
  awaitingBuyer = false,
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
  const failuresText = insurerFailuresText(failures);
  const unavailableNames = failures.filter((f) => f.reason === "unavailable").map((f) => f.name);
  const [dgoMap, setDgoMap] = useState<Record<string, string | null>>({});
  const [autolawyerMap, setAutolawyerMap] = useState<Record<string, string | null>>({});
  const [sortBy, setSortBy] = useState<SortKey>("recommended");
  const [compareOpen, setCompareOpen] = useState(false);
  const [onlyInstallment, setOnlyInstallment] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const SORT_OPTIONS = [
    { k: "recommended", label: "Рекомендовані", en: "Recommended", Icon: Sparkles },
    { k: "price_asc", label: "Спершу дешевші", en: "Cheapest first", Icon: ArrowDownWideNarrow },
    { k: "price_desc", label: "Спершу дорожчі", en: "Most expensive first", Icon: ArrowUpWideNarrow },
  ] as const;
  // «Рекомендовані» = ціна + популярність СК серед наших клієнтів (див. lib/offer-ranking).
  const popularity = usePopularity();
  const activeSort = SORT_OPTIONS.find((o) => o.k === sortBy) ?? SORT_OPTIONS[0];

  const rankable = (o: InsuranceOffer) => ({ id: o.offerId, price: o.price, company: o.company?.publicName || o.companyNamePublic || o.companyName });
  const sorted = rankOffers(offers, rankable, sortBy, popularity);
  // Право на розстрочку: дорожча з пари пропозицій у страхових зі списку (лише ОСЦПВ).
  const installmentIds = useMemo(() => installmentEligibleOffers(offers), [offers]);
  const badges = offerBadges(offers, rankable, popularity);

  return (
    <section className="min-h-screen bg-[#F5F5F7] pt-20 pb-8 dark:bg-[#0a0a0b]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
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

            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 font-bold text-zinc-900 dark:text-zinc-100" style={{ fontSize: 18 }}>
              <span className="inline-flex items-center gap-1.5">
                <Car className="h-4 w-4 shrink-0 text-indigo-500 dark:text-indigo-400" />
                {vehicle.mark} {vehicle.model}{vehicle.year ? `, ${vehicle.year}` : ""}
              </span>
              {vehicle.cityName && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 shrink-0 text-indigo-500 dark:text-indigo-400" />
                  {cityLabel(vehicle.cityName)}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 shrink-0 text-indigo-500 dark:text-indigo-400" />
                {periodLabel}
              </span>
              <button
                onClick={onEdit}
                aria-label={t({ uk: "Змінити дані авто", en: "Edit vehicle data" })}
                className="text-zinc-300 hover:text-indigo-500 transition-colors dark:text-zinc-600 dark:hover:text-indigo-400"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Індивідуальна пропозиція: знижка + введені дані (впливають на ціну). */}
          <button
            type="button"
            onClick={onEditBuyer}
            className="flex w-full items-center justify-between gap-3 border-t border-zinc-100 bg-indigo-50/40 px-6 py-4 text-left transition-colors hover:bg-indigo-50 dark:border-zinc-800 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50"
          >
            <span className="min-w-0">
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">{t({ uk: "Індивідуальна пропозиція", en: "Personalised offer" })}</span>
              </span>

              {/* Введені дані як чіпи (з реєстру приходить лише ВІК власника → рік). */}
              <span className="mt-3 flex flex-wrap gap-2">
              {/* Страхувальник і наймолодший водій — та сама людина (дати збігаються) → один чип. */}
              {buyer.policyholderBirthDate && buyer.policyholderBirthDate === buyer.youngestBirthDate ? (
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/80 px-3 py-1.5 text-sm text-zinc-500 ring-1 ring-zinc-200 dark:bg-zinc-900/70 dark:text-zinc-400 dark:ring-zinc-700">{t({ uk: "Страхувальник і водій", en: "Policyholder & driver" })} <span className="font-semibold text-zinc-800 dark:text-zinc-200">{buyer.policyholderBirthDate}</span></span>
              ) : buyer.policyholderBirthDate && (
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/80 px-3 py-1.5 text-sm text-zinc-500 ring-1 ring-zinc-200 dark:bg-zinc-900/70 dark:text-zinc-400 dark:ring-zinc-700">{t({ uk: "Страхувальник", en: "Policyholder" })} <span className="font-semibold text-zinc-800 dark:text-zinc-200">{buyer.policyholderBirthDate}</span></span>
              )}
              {buyer.youngestBirthDate && buyer.youngestBirthDate !== buyer.policyholderBirthDate && (
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/80 px-3 py-1.5 text-sm text-zinc-500 ring-1 ring-zinc-200 dark:bg-zinc-900/70 dark:text-zinc-400 dark:ring-zinc-700">{t({ uk: "Наймолодший водій", en: "Youngest driver" })} <span className="font-semibold text-zinc-800 dark:text-zinc-200">{buyer.youngestBirthDate}</span></span>
              )}
              {buyer.identificationCode && (
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/80 px-3 py-1.5 text-sm text-zinc-500 ring-1 ring-zinc-200 dark:bg-zinc-900/70 dark:text-zinc-400 dark:ring-zinc-700">{t({ uk: "Ідентифікаційний код", en: "Tax ID" })} <span className="font-semibold text-zinc-800 dark:text-zinc-200">{buyer.identificationCode}</span></span>
              )}
              {buyer.birthDate && (
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/80 px-3 py-1.5 text-sm text-zinc-500 ring-1 ring-zinc-200 dark:bg-zinc-900/70 dark:text-zinc-400 dark:ring-zinc-700">{t({ uk: "Власник", en: "Owner" })} <span className="font-semibold text-zinc-800 dark:text-zinc-200">{t({ uk: `${buyer.birthDate.split(".")[2]} р.н.`, en: `b. ${buyer.birthDate.split(".")[2]}` })}</span></span>
              )}
              {buyerSet && (
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-600 ring-1 ring-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:ring-indigo-900">{privilegeLabel}</span>
              )}
            </span>
            </span>
            <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
              {buyerSet ? t({ uk: "Змінити", en: "Edit" }) : t({ uk: "Вказати", en: "Specify" })}
              <ChevronRight className="h-4 w-4" />
            </span>
          </button>
        </div>

        {!loading && offers.length > 0 && (
          <div className="mb-5 flex flex-wrap items-center justify-end gap-3">
            {offers.length > 1 && (
              <button
                type="button"
                onClick={() => setCompareOpen(true)}
                className="mr-auto flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm transition-colors hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-950/70"
              >
                <Columns3 className="h-4 w-4" />
                {t({ uk: "Порівняти пропозиції", en: "Compare offers" })}
                <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-zinc-900 dark:text-indigo-300">{offers.length}</span>
              </button>
            )}
            {installmentIds.size > 0 && (
              <button
                type="button"
                onClick={() => setOnlyInstallment((v) => !v)}
                aria-pressed={onlyInstallment}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold shadow-sm transition-colors ${onlyInstallment ? "border-indigo-600 bg-indigo-600 text-white" : "border-zinc-200 bg-white text-zinc-800 hover:border-indigo-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"}`}
              >
                <CalendarRange className="h-4 w-4" />
                {t({ uk: "Оплата частинами", en: "Instalments" })}
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${onlyInstallment ? "bg-white/20 text-white" : "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"}`}>{installmentIds.size}</span>
              </button>
            )}
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


        <CompareOffersModal
          open={compareOpen}
          onClose={() => setCompareOpen(false)}
          offers={offers}
          badges={badges}
          installmentIds={installmentIds}
          onPick={(o) => {
            setCompareOpen(false);
            const dgoId = dgoMap[o.offerId] !== undefined ? dgoMap[o.offerId] : o.dgoRequired ? (o.listDgo?.[0]?.id ?? null) : null;
            onSelectOffer({ ...o, installmentEligible: installmentIds.has(o.offerId) }, dgoId, autolawyerMap[o.offerId] ?? null);
          }}
        />

        {awaitingBuyer && offers.length === 0 && !loading ? (
          <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{t({ uk: "Заповніть дати народження", en: "Enter the birth dates" })}</p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t({ uk: "Щоб розрахувати персональну ціну по кожній страховій.", en: "So we can calculate a personalised price for each insurer." })}</p>
          </div>
        ) : loading ? (
          <div className="space-y-3">
            <SearchingInsurers />
            {Array.from({ length: 5 }).map((_, i) => (
              <OfferCardSkeleton key={i} />
            ))}
          </div>
        ) : offers.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{failuresText ? t({ uk: "Страхові не змогли порахувати", en: "Insurers could not calculate" }) : t({ uk: "Пропозицій не знайдено", en: "No offers found" })}</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-zinc-500 dark:text-zinc-400">{failuresText ? t({ uk: `${failuresText}. Спробуйте ще раз за кілька хвилин.`, en: `${failuresText}. Please try again in a few minutes.` }) : t({ uk: "Спробуйте змінити параметри авто.", en: "Try changing the vehicle parameters." })}</p>
            <Button variant="secondary" size="md" onClick={onBack} className="mt-5">
              {t({ uk: "Назад", en: "Back" })}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {failuresText && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  {unavailableNames.length === failures.length
                    ? t({ uk: `Не відповіли: ${unavailableNames.join(", ")}. Їхні ціни зʼявляться після повторного розрахунку.`, en: `No response from: ${unavailableNames.join(", ")}. Their prices will appear after a recalculation.` })
                    : t({ uk: `Не всі страхові порахували: ${failuresText}.`, en: `Some insurers did not calculate: ${failuresText}.` })}
                </span>
              </div>
            )}
            {(onlyInstallment ? sorted.filter((o) => installmentIds.has(o.offerId)) : sorted).map((offer, i) => {
              // v2: СК оформлює поліс ЛИШЕ з ДЦВ (dgoRequired) → за замовчуванням
              // найдешевший варіант, «без покриття» недоступне.
              const dgoId = dgoMap[offer.offerId] !== undefined
                ? dgoMap[offer.offerId]
                : offer.dgoRequired ? (offer.listDgo?.[0]?.id ?? null) : null;
              const canInstallment = installmentIds.has(offer.offerId);
              return (
              <OfferCard
                key={offer.offerId}
                offer={offer}
                index={i}
                cornerBadge={[badgeText(badges.get(offer.offerId), t), canInstallment ? t({ uk: "Оплата частинами", en: "Instalments" }) : null].filter(Boolean).join(" · ") || undefined}
                faceNote={canInstallment ? t({ uk: "Можна оплатити частинами", en: "Instalments available" }) : undefined}
                faceNoteMuted
                faceNoteHint={canInstallment ? t({ uk: "Для цієї пропозиції доступна оплата частинами — оберіть її на кроці оплати. У розстрочку бонуси й промокод не застосовуються.", en: "Instalments are available for this offer — choose them at the payment step. Bonuses and promo codes do not apply to instalments." }) : undefined}
                selected={selectedOfferId === offer.offerId}
                discountEligible
                showAgeBasis
                productDescription={<OsagoInfo />}
                selectedDgoId={dgoId}
                selectedAutolawyerId={autolawyerMap[offer.offerId] ?? null}
                onSelect={() => setSelectedOfferId(offer.offerId)}
                onSelectDgo={(id) => setDgoMap((m) => ({ ...m, [offer.offerId]: id }))}
                onSelectAutolawyer={(id) => setAutolawyerMap((m) => ({ ...m, [offer.offerId]: id }))}
                onBuy={() =>
                  onSelectOffer(
                    { ...offer, installmentEligible: canInstallment },
                    dgoId,
                    autolawyerMap[offer.offerId] ?? null
                  )
                }
              />
              );
            })}
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
