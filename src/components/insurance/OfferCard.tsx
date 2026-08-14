"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, FileText, ExternalLink, Info } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatPrice, formatCompanyName, cn } from "@/lib/utils";
import { osagoStrikePrice, osagoDiscountPct } from "@/lib/osago-discounts";
import { BONUS_RATE } from "@/lib/constants";
import { logoSrc } from "@/lib/logos";
import { useI18n } from "@/lib/i18n";
import type { InsuranceCompany, InsuranceOffer } from "@/types/api";

interface OfferCardProps {
  offer: InsuranceOffer;
  selected: boolean;
  onSelect: () => void;
  onBuy: () => void;
  selectedDgoId: string | null;
  selectedAutolawyerId: string | null;
  onSelectDgo: (id: string | null) => void;
  onSelectAutolawyer: (id: string | null) => void;
  index: number;
  /** Приховати «скоро»-опції (евакуатор/страхування) — напр. для Зеленої карти. */
  hideExtras?: boolean;
  /** Підпис під назвою страхової (напр. програма туристичного «Економ»). */
  subtitle?: string;
  /** Бейдж у верхньому лівому куті рамки картки (напр. програма «Економ»). */
  cornerBadge?: string;
  /** Показати «стару» ціну закресленою (знижки ОСЦПВ уже враховані в price). */
  discountEligible?: boolean;
  /** Опис продукту в «Детальніше» (напр. пояснення ОСЦПВ). Передається лише де треба. */
  productDescription?: ReactNode;
  /** Що покриває — короткі теги по центру картки (напр. міні-КАСКО: «Воєнні ризики», «З вини»). */
  coverageTags?: string[];
}

function transliterate(text: string) {
  const map: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'h', 'ґ': 'g', 'д': 'd', 'е': 'e', 'є': 'ye', 'ж': 'zh',
    'з': 'z', 'и': 'y', 'і': 'i', 'ї': 'yi', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
    'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ь': '', 'ю': 'yu', 'я': 'ya'
  };
  return text
    .toLowerCase()
    .split('')
    .map(char => map[char] ?? char)
    .join('')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function CompanyLogo({ company, cleanName }: { company: InsuranceCompany; cleanName: string }) {
  const [failed, setFailed] = useState(false);
  // Локальний SVG за назвою → фолбек на лого з API (company.logo) → ініціали.
  const src = logoSrc(transliterate(cleanName)) || company.logo || null;

  if (!src || failed) {
    return <span className="text-sm font-bold text-zinc-400 dark:text-zinc-500">{cleanName.slice(0, 2).toUpperCase()}</span>;
  }

  return (
    <img
      src={src}
      alt={cleanName}
      className="max-h-full max-w-full object-contain"
      onError={() => setFailed(true)}
    />
  );
}

// Акордеон «Детальніше»: спільний стор — відкрита лише ОДНА картка за раз. За раз
// показується список одного продукту, тож глобальний ключ безпечний. Розгортання
// іншої картки автоматично згортає попередню.
let accordionOpenKey: string | null = null;
const accordionListeners = new Set<() => void>();
function setAccordionOpenKey(k: string | null) {
  accordionOpenKey = k;
  accordionListeners.forEach((l) => l());
}
function subscribeAccordion(cb: () => void) {
  accordionListeners.add(cb);
  return () => { accordionListeners.delete(cb); };
}

// Згорнутий список у «Детальніше» (напр. «Базові опції», «Документи»).
// Розмір/вигляд як у рядка «Автоюрист»: rounded-xl, border-zinc-200, bg-white,
// px-3.5 py-2.5, text-sm, ширина до 340px.
// Керований (акордеон): відкритий лише один блок за раз — стан тримає картка.
function DetailsDropdown({ label, children, open, onToggle, bodyClassName = "px-3.5 py-3" }: { label: string; children: ReactNode; open: boolean; onToggle: () => void; bodyClassName?: string }) {
  return (
    <div className="w-full max-w-[280px] overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
      >
        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{label}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-zinc-400 transition-transform dark:text-zinc-500", open && "rotate-180")} />
      </button>
      {open && <div className={cn("flex flex-col gap-3 border-t border-zinc-100 dark:border-zinc-800", bodyClassName)}>{children}</div>}
    </div>
  );
}

export function OfferCard({
  offer,
  selected,
  onSelect,
  onBuy,
  selectedDgoId,
  selectedAutolawyerId,
  onSelectDgo,
  onSelectAutolawyer,
  index,
  subtitle,
  cornerBadge,
  discountEligible,
  productDescription,
  coverageTags,
}: OfferCardProps) {
  const { t } = useI18n();
  // Розгортання «Детальніше» — через спільний стор (акордеон): відкрита лише одна.
  const cardKey = offer.offerId ?? `idx-${index}`;
  const openKey = useSyncExternalStore(subscribeAccordion, () => accordionOpenKey, () => null);
  const expanded = openKey === cardKey;
  const setExpanded = (next: boolean | ((v: boolean) => boolean)) => {
    const val = typeof next === "function" ? next(expanded) : next;
    setAccordionOpenKey(val ? cardKey : null);
  };

  // Внутрішній акордеон розгорнутої секції: відкритий лише один блок за раз.
  const [openDetail, setOpenDetail] = useState<string | null>(null);
  const toggleDetail = (key: string) => setOpenDetail((cur) => (cur === key ? null : key));

  const cleanCompanyName = formatCompanyName(offer.company.publicName);

  // Ukasko інколи повертає listDgo/listAutolawyer не масивом — нормалізуємо,
  // щоб .find/.map/.length були безпечні скрізь.
  const dgoList = Array.isArray(offer.listDgo) ? offer.listDgo : [];
  const lawyerList = Array.isArray(offer.listAutolawyer) ? offer.listAutolawyer : [];

  const totalPrice =
    offer.price +
    (selectedDgoId ? Number(dgoList.find((d) => d.id === selectedDgoId)?.cost ?? 0) : 0) +
    (selectedAutolawyerId ? lawyerList.find((a) => a.id === selectedAutolawyerId)?.price ?? 0 : 0);

  // Бонус 1% від вартості полісу — нараховується на бонусний рахунок клієнта.
  const bonus = Math.round(totalPrice * BONUS_RATE);

  // «Стара» ціна (до знижки) + відсоток — лише для ОСЦПВ (discountEligible).
  const companyMatchName = [offer.company.publicName, (offer.company as { companyName?: string }).companyName].filter(Boolean).join(" ");
  const strikePrice = discountEligible ? osagoStrikePrice(companyMatchName, totalPrice) : null;
  const discountPct = discountEligible ? osagoDiscountPct(companyMatchName) : null;
  // Спецпропозиція VOLYA.FINANCE — коли знижка перевищує 25%.
  const specialOffer = discountPct != null && discountPct > 25;

  const hasOptions = dgoList.length > 0 || lawyerList.length > 0;
  // Блок опцій (у картці) показуємо лише за наявності реальних опцій.
  const showOptionsBlock = hasOptions;

  // Обов'язкові інформаційні документи продукту (показуємо ті, що прийшли з API).
  const docs = [
    { label: "Інформація про страховий продукт", en: "Insurance product information", url: offer.company.docProduct },
    { label: "Інформація про страхову компанію", en: "Insurance company information", url: offer.company.docCompany },
    { label: "Інформація про страхового посередника", en: "Insurance intermediary information", url: offer.company.docAgent },
    { label: "Загальні умови страхового продукту", en: "General insurance product terms", url: offer.company.docZusp },
  ].filter((d): d is { label: string; en: string; url: string } => !!d.url && d.url.trim().length > 0);
  const hasDocs = docs.length > 0;
  const hasFacts = offer.company.directSettlement === 1 || offer.company.compensationDays > 0;

  // Рейтинг страховика прибрано: API віддавав некоректні/уніфіковані дані.

  // Розгортання доступне, якщо є що показати: опис, характеристики, документи.
  const canExpand = !!productDescription || hasFacts || hasDocs;

  // Короткі теги «що покриває» (напр. міні-КАСКО) — чипи по центру картки.
  const coverageChips = coverageTags && coverageTags.length > 0 ? (
    <div className="flex flex-wrap justify-center gap-1.5">
      {coverageTags.map((t) => (
        <span key={t} className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:ring-indigo-900">
          {t}
        </span>
      ))}
    </div>
  ) : null;

  const autolawyer = lawyerList[0] ?? null;
  const rowClass = (active: boolean) =>
    cn(
      "flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-all",
      active ? "border-indigo-300 bg-indigo-50/60 ring-1 ring-indigo-200 dark:border-indigo-700 dark:bg-indigo-950/40 dark:ring-indigo-800" : "border-zinc-200 bg-white hover:border-indigo-200 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800/60"
    );

  const optionsBlock = (
    <div className="flex w-full max-w-[240px] flex-col gap-2">
      {autolawyer && (
        <button type="button" onClick={() => onSelectAutolawyer(selectedAutolawyerId === autolawyer.id ? null : autolawyer.id)} className={rowClass(selectedAutolawyerId === autolawyer.id)}>
          <span className="flex min-w-0 flex-col">
            <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{t({ uk: "Автоюрист", en: "Auto lawyer" })}</span>
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500">{t({ uk: "Додаткова опція", en: "Additional option" })}</span>
          </span>
          <span className="shrink-0 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
            {autolawyer.price > 0 ? `+${formatPrice(autolawyer.price)}` : t({ uk: "Безкоштовно", en: "Free" })}
          </span>
        </button>
      )}

      {/* «Додаткове покриття» — єдиний dropdown: перший пункт-плейсхолдер, далі варіанти. */}
      {dgoList.length > 0 && (
        <div className="relative w-full">
          <select
            aria-label={t({ uk: "Додаткове покриття", en: "Additional coverage" })}
            value={selectedDgoId || ""}
            onChange={(e) => onSelectDgo(e.target.value || null)}
            className={cn(
              "w-full cursor-pointer appearance-none rounded-xl border py-2.5 pl-3.5 pr-9 text-sm font-medium outline-none transition-all",
              selectedDgoId
                ? "border-indigo-300 bg-indigo-50/60 text-zinc-800 ring-1 ring-indigo-200 dark:border-indigo-700 dark:bg-indigo-950/40 dark:text-zinc-200 dark:ring-indigo-800"
                : "border-zinc-200 bg-white text-zinc-700 hover:border-indigo-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            )}
          >
            <option value="">{t({ uk: "Додаткове покриття", en: "Additional coverage" })}</option>
            {dgoList.map((dgo) => (
              <option key={dgo.id} value={dgo.id}>
                +{Number(dgo.coverage).toLocaleString()} {t({ uk: "грн", en: "UAH" })} — {formatPrice(Number(dgo.cost))}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
        </div>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`relative rounded-2xl border bg-white shadow-sm transition-all duration-200 dark:bg-zinc-900 ${
        selected
          ? "border-indigo-400 shadow-md shadow-indigo-100 ring-1 ring-indigo-400"
          : "border-zinc-100 hover:border-zinc-200 hover:shadow-md dark:border-zinc-800 dark:hover:border-zinc-700"
      }`}
    >
      {specialOffer && (
        <span className="absolute left-0 top-0 z-10 inline-flex items-center rounded-br-xl rounded-tl-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
          {t({ uk: "Спеціальна пропозиція від VOLYA.FINANCE", en: "Special offer from VOLYA.FINANCE" })}
        </span>
      )}
      {cornerBadge && !specialOffer && (
        <span className="absolute left-0 top-0 z-10 rounded-br-xl rounded-tl-2xl bg-indigo-600 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
          {cornerBadge}
        </span>
      )}

      {/* ── MOBILE layout (< lg) ── */}
      <div className={`p-4 lg:hidden ${specialOffer ? "pt-8" : ""}`}>
        {/* Ряд 1: лого + назва + ціна */}
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50 p-1.5 dark:border-zinc-800 dark:bg-zinc-100">
            <CompanyLogo company={offer.company} cleanName={cleanCompanyName} />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold uppercase text-zinc-900 leading-snug dark:text-zinc-100">
              {cleanCompanyName}
            </p>
            {subtitle && <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">{subtitle}</p>}
          </div>

          <div className="flex shrink-0 flex-col items-end">
            {strikePrice && (
              <span className="flex items-center gap-1.5">
                <span className="text-xs text-zinc-400 line-through tabular-nums dark:text-zinc-500">{formatPrice(strikePrice)}</span>
                {discountPct != null && <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">−{Math.round(discountPct)}%</span>}
              </span>
            )}
            <span className="text-lg font-bold text-zinc-900 tabular-nums dark:text-zinc-100">
              {formatPrice(totalPrice)}
            </span>
            {bonus > 0 && (
              <span title={t({ uk: "1% від вартості полісу на бонусний рахунок", en: "1% of the policy price to your bonus account" })} className="mt-0.5 whitespace-nowrap text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                +{formatPrice(bonus)} {t({ uk: "бонус", en: "bonus" })}
              </span>
            )}
          </div>
        </div>

        {/* Що покриває — чипи (напр. міні-КАСКО) */}
        {coverageChips && (
          <div className="mt-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
            {coverageChips}
          </div>
        )}

        {/* Опції (автоюрист / ДГО / Допомога) */}
        {showOptionsBlock && (
          <div className="mt-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
            {optionsBlock}
          </div>
        )}

        {/* Ряд 2: кнопка купити (на всю ширину) + детальніше окремим рядком */}
        <div className="mt-4 flex flex-col gap-2">
          <Button
            variant="primary"
            size="md"
            onClick={() => { onSelect(); onBuy(); }}
            className="w-full"
          >
            {t({ uk: "Купити", en: "Buy" })}
          </Button>
          {canExpand && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="flex items-center justify-center gap-0.5 text-xs text-zinc-400 hover:text-indigo-600 transition-colors dark:text-zinc-500 dark:hover:text-indigo-400"
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {t({ uk: "Детальніше", en: "Details" })}
            </button>
          )}
        </div>
      </div>

      {/* ── DESKTOP layout (≥ lg) ── */}
      <div className={`hidden lg:flex items-stretch gap-6 p-5 ${specialOffer ? "pt-8" : ""}`}>

        {/* Блок 1: лого + назва */}
        <div className="flex flex-col items-center justify-center gap-3 w-48 shrink-0">
          <div className="flex h-[152px] w-[152px] items-center justify-center overflow-hidden">
            <CompanyLogo company={offer.company} cleanName={cleanCompanyName} />
          </div>
          <span className="text-sm uppercase text-zinc-900 leading-tight text-center dark:text-zinc-100">
            {cleanCompanyName}
          </span>
          {subtitle && <span className="text-xs text-zinc-400 text-center dark:text-zinc-500">{subtitle}</span>}
        </div>

        {/* Блок 2: кількість опцій / документи. Фіксована ширина = ширина розгорнутих
            dropdown-ів під ним; так блок 3 (опції) зсувається праворуч і не перекривається. */}
        {canExpand && (
          <div className="flex w-[280px] flex-col items-center shrink-0">
            <div className="flex flex-col items-center gap-2 flex-1 justify-center">
              {hasOptions && (
                <>
                  <span className="text-3xl text-zinc-900 dark:text-zinc-100">
                    {(dgoList.length ? 1 : 0) + (lawyerList.length ? 1 : 0)}
                  </span>
                  <span className="text-xs text-zinc-400 font-medium dark:text-zinc-500">{t({ uk: "опції", en: "options" })}</span>
                </>
              )}
            </div>
            <button
              onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-indigo-600 transition-colors mt-auto dark:text-zinc-500 dark:hover:text-indigo-400"
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {t({ uk: "Додатково", en: "More" })}
            </button>
          </div>
        )}

        {/* Блок 3: що покриває (чипи) або автоюрист/ДГО. Вирівнюємо ліворуч, щоб вміст
            не тулився до блоку «Купити» (вільний простір лишається праворуч). */}
        <div className="flex flex-1 flex-col items-start justify-center">
          {coverageChips ?? optionsBlock}
        </div>

        {/* Блок 4: ціна + купити */}
        <div className="flex flex-col items-center justify-center gap-3 shrink-0" style={{ width: 200 }}>
          <div className="flex flex-col items-center gap-1">
            {strikePrice && (
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-zinc-400 line-through tabular-nums dark:text-zinc-500">{formatPrice(strikePrice)}</span>
                {discountPct != null && <span className="rounded-full bg-rose-600 px-2 py-0.5 text-xs font-bold text-white">−{Math.round(discountPct)}%</span>}
              </div>
            )}
            <div className="text-2xl text-zinc-900 tabular-nums dark:text-zinc-100">
              {formatPrice(totalPrice)}
            </div>
            {bonus > 0 && (
              <span title={t({ uk: "1% від вартості полісу на бонусний рахунок", en: "1% of the policy price to your bonus account" })} className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                +{formatPrice(bonus)} {t({ uk: "бонус", en: "bonus" })}
              </span>
            )}
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={() => { onSelect(); onBuy(); }}
            className="w-full"
          >
            {t({ uk: "Купити", en: "Buy" })}
          </Button>
        </div>
      </div>

      {/* Розгорнута секція (Базові опції / Документи). На десктопі зсунута ліворуч
          так, щоб починалась під 2-м блоком «опис» (після колонки з лого w-48). */}
      {expanded && (
        <div className="border-t border-zinc-100 px-4 lg:pl-[14.75rem] lg:pr-5 py-4 flex flex-col gap-4 dark:border-zinc-800">
          {/* «Базові опції» — покриття продукту (напр. ОСЦПВ) + пряме врегулювання */}
          {(productDescription || offer.company.directSettlement === 1) && (
            <DetailsDropdown label={t({ uk: "Базові опції", en: "Basic options" })} open={openDetail === "basic"} onToggle={() => toggleDetail("basic")}>
              {productDescription}
              {offer.company.directSettlement === 1 && (
                <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3 dark:border-zinc-700 dark:bg-zinc-800/40">
                  <div
                    title={t({ uk: "Можливість потерпілої особи звернутися за страховим відшкодуванням безпосередньо до своєї страхової компанії, яка здійснює виплату та надалі врегульовує взаєморозрахунки зі страховиком винуватця ДТП.", en: "The injured party can claim insurance compensation directly from their own insurance company, which pays out and then settles accounts with the insurer of the party at fault in the accident." })}
                    className="inline-flex cursor-help items-center gap-1.5 text-zinc-400 transition-colors hover:text-indigo-500 dark:text-zinc-500 dark:hover:text-indigo-400"
                  >
                    <span className="text-xs font-medium text-zinc-700 dark:text-zinc-200">{t({ uk: "Пряме врегулювання", en: "Direct settlement" })}</span>
                    <Info className="h-3.5 w-3.5" />
                  </div>
                </div>
              )}
            </DetailsDropdown>
          )}

          {/* «Умови виплат» — окремий dropdown (між Базові опції та Документи) */}
          {offer.company.compensationDays > 0 && (
            <DetailsDropdown label={t({ uk: "Умови виплат", en: "Payout terms" })} open={openDetail === "term"} onToggle={() => toggleDetail("term")}>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3 dark:border-zinc-700 dark:bg-zinc-800/40">
                <span className="text-xs text-zinc-700 dark:text-zinc-200">
                  {t({ uk: `Виплата до ${offer.company.compensationDays} днів`, en: `Payout within ${offer.company.compensationDays} days` })}
                </span>
              </div>
            </DetailsDropdown>
          )}

          {/* Документи — окремий dropdown */}
          {hasDocs && (
            <DetailsDropdown label={t({ uk: "Документи страхового продукту", en: "Insurance product documents" })} open={openDetail === "docs"} onToggle={() => toggleDetail("docs")} bodyClassName="px-2 py-2">
              <div className="flex flex-col gap-2">
                {docs.map((d) => (
                  <a
                    key={d.label}
                    href={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-xs font-medium text-zinc-700 transition-colors hover:border-indigo-200 hover:text-indigo-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:text-indigo-400"
                  >
                    <span className="flex min-w-0 items-start gap-2">
                      <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-500" />
                      <span className="leading-snug">{t({ uk: d.label, en: d.en })}</span>
                    </span>
                    <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-zinc-500" />
                  </a>
                ))}
              </div>
            </DetailsDropdown>
          )}
        </div>
      )}

    </motion.div>
  );
}
