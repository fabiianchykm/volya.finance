"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatPrice, formatCompanyName, cn } from "@/lib/utils";
import { logoSrc } from "@/lib/logos";
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
    .map(char => map[char] || char)
    .join('')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function CompanyLogo({ cleanName }: { company: InsuranceCompany; cleanName: string }) {
  const [failed, setFailed] = useState(false);
  const src = logoSrc(transliterate(cleanName));

  if (!src || failed) {
    return <span className="text-sm font-bold text-zinc-400">{cleanName.slice(0, 2).toUpperCase()}</span>;
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
}: OfferCardProps) {
  const [expanded, setExpanded] = useState(false);

  const cleanCompanyName = formatCompanyName(offer.company.publicName);

  // Ukasko інколи повертає listDgo/listAutolawyer не масивом — нормалізуємо,
  // щоб .find/.map/.length були безпечні скрізь.
  const dgoList = Array.isArray(offer.listDgo) ? offer.listDgo : [];
  const lawyerList = Array.isArray(offer.listAutolawyer) ? offer.listAutolawyer : [];

  const totalPrice =
    offer.price +
    (selectedDgoId ? Number(dgoList.find((d) => d.id === selectedDgoId)?.cost ?? 0) : 0) +
    (selectedAutolawyerId ? lawyerList.find((a) => a.id === selectedAutolawyerId)?.price ?? 0 : 0);

  const hasOptions = dgoList.length > 0 || lawyerList.length > 0;

  const autolawyer = lawyerList[0] ?? null;
  const rowClass = (active: boolean) =>
    cn(
      "flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-all",
      active ? "border-indigo-300 bg-indigo-50/60 ring-1 ring-indigo-200" : "border-zinc-200 bg-white hover:border-indigo-200 hover:bg-zinc-50"
    );

  const optionsBlock = (
    <div className="flex w-full max-w-[260px] flex-col gap-2">
      {autolawyer && (
        <button type="button" onClick={() => onSelectAutolawyer(selectedAutolawyerId === autolawyer.id ? null : autolawyer.id)} className={rowClass(selectedAutolawyerId === autolawyer.id)}>
          <span className="flex min-w-0 flex-col">
            <span className="text-sm font-medium text-zinc-800">Автоюрист</span>
            <span className="text-[11px] text-zinc-400">Юридичний захист при ДТП</span>
          </span>
          <span className="shrink-0 text-sm font-semibold text-indigo-600">
            {autolawyer.price > 0 ? `+${formatPrice(autolawyer.price)}` : "Безкоштовно"}
          </span>
        </button>
      )}

      {/* «Додаткове покриття» — єдиний dropdown: перший пункт-плейсхолдер, далі варіанти. */}
      {dgoList.length > 0 && (
        <div className="relative w-full">
          <select
            value={selectedDgoId || ""}
            onChange={(e) => onSelectDgo(e.target.value || null)}
            className={cn(
              "w-full cursor-pointer appearance-none rounded-xl border py-2.5 pl-3.5 pr-9 text-sm font-medium outline-none transition-all",
              selectedDgoId
                ? "border-indigo-300 bg-indigo-50/60 text-zinc-800 ring-1 ring-indigo-200"
                : "border-zinc-200 bg-white text-zinc-700 hover:border-indigo-200"
            )}
          >
            <option value="">Додаткове покриття</option>
            {dgoList.map((dgo) => (
              <option key={dgo.id} value={dgo.id}>
                +{Number(dgo.coverage).toLocaleString()} грн — {formatPrice(Number(dgo.cost))}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        </div>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`rounded-2xl border bg-white shadow-sm transition-all duration-200 ${
        selected
          ? "border-indigo-400 shadow-md shadow-indigo-100 ring-1 ring-indigo-400"
          : "border-zinc-100 hover:border-zinc-200 hover:shadow-md"
      }`}
    >

      {/* ── MOBILE layout (< lg) ── */}
      <div className="p-4 lg:hidden">
        {/* Ряд 1: лого + назва + ціна */}
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50 p-1.5">
            <CompanyLogo company={offer.company} cleanName={cleanCompanyName} />
          </div>

          <p className="flex-1 min-w-0 text-sm font-semibold text-zinc-900 leading-snug">
            {cleanCompanyName}
          </p>

          <span
            className="shrink-0 text-lg font-bold text-zinc-900 tabular-nums"
            style={{ fontFamily: 'var(--font-roboto)' }}
          >
            {formatPrice(totalPrice)}
          </span>
        </div>

        {/* Опції */}
        {hasOptions && (
          <div className="mt-3 border-t border-zinc-100 pt-3">
            {optionsBlock}
          </div>
        )}

        {/* Ряд 2: кнопка купити + детальніше */}
        <div className="mt-4 flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={() => { onSelect(); onBuy(); }}
            className="flex-1"
          >
            Купити
          </Button>
          {hasOptions && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="flex shrink-0 items-center gap-0.5 px-2 text-xs text-zinc-400 hover:text-indigo-600 transition-colors"
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              Детальніше
            </button>
          )}
        </div>
      </div>

      {/* ── DESKTOP layout (≥ lg) ── */}
      <div className="hidden lg:flex items-stretch gap-6 p-5">

        {/* Блок 1: лого + назва */}
        <div className="flex flex-col items-center justify-center gap-3 w-48 shrink-0">
          <div className="flex h-[152px] w-[152px] items-center justify-center overflow-hidden">
            <CompanyLogo company={offer.company} cleanName={cleanCompanyName} />
          </div>
          <span className="text-sm text-zinc-900 leading-tight text-center">
            {cleanCompanyName}
          </span>
        </div>

        {/* Блок 2: кількість опцій */}
        {hasOptions && (
          <div className="flex flex-col items-center shrink-0">
            <div className="flex flex-col items-center gap-2 flex-1 justify-center">
              <span className="text-3xl text-zinc-900">
                {(dgoList.length ? 1 : 0) + (lawyerList.length ? 1 : 0)}
              </span>
              <span className="text-xs text-zinc-400 font-medium">опції</span>
            </div>
            <button
              onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-indigo-600 transition-colors mt-auto"
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              Додатково
            </button>
          </div>
        )}

        {/* Блок 3: автоюрист + ДГО */}
        <div className="flex flex-1 flex-col justify-center">
          {optionsBlock}
        </div>

        {/* Блок 4: ціна + купити */}
        <div className="flex flex-col items-center justify-center gap-3 shrink-0" style={{ width: 200 }}>
          <div className="text-2xl text-zinc-900" style={{ fontFamily: 'var(--font-roboto)' }}>
            {formatPrice(totalPrice)}
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={() => { onSelect(); onBuy(); }}
            className="w-full"
          >
            Купити
          </Button>
        </div>
      </div>

      {/* Розгорнута секція — однакова для обох */}
      {expanded && (
        <div className="border-t border-zinc-100 px-4 lg:px-5 py-4 flex flex-col gap-4">
          {lawyerList.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-zinc-700 mb-1">Автоюрист</p>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Юридична допомога у випадку ДТП: консультації, представництво інтересів, допомога з оформленням документів та відшкодуванням збитків.
              </p>
            </div>
          )}
          {dgoList.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-zinc-700 mb-1">Додаткове покриття (ДГО)</p>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Розширення ліміту цивільної відповідальності понад базове ОСЦПВ. Доступні варіанти покриття: від{" "}
                {Number(dgoList[0].coverage).toLocaleString()} до{" "}
                {Number(dgoList[dgoList.length - 1].coverage).toLocaleString()} грн.
              </p>
            </div>
          )}
          {offer.company.directSettlement === 1 && (
            <div>
              <p className="text-xs font-semibold text-zinc-700 mb-1">Пряме врегулювання</p>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Можливість звернутись до своєї страхової компанії за відшкодуванням, незалежно від того, хто є винуватцем ДТП.
              </p>
            </div>
          )}
          {offer.company.compensationDays > 0 && (
            <div>
              <p className="text-xs font-semibold text-zinc-700 mb-1">Термін виплати</p>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Середній термін виплати відшкодування — до {offer.company.compensationDays} днів.
              </p>
            </div>
          )}
        </div>
      )}

    </motion.div>
  );
}
