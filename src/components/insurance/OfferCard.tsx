"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatPrice, formatCompanyName } from "@/lib/utils";
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
  const [errorCount, setErrorCount] = useState(0);
  const slug = transliterate(cleanName);
  const sources = [`/logos/${slug}.png`, `/logos/${slug}.webp`, `/logos/${slug}.svg`, `/logos/${slug}.jpeg`];

  if (errorCount >= sources.length) {
    return <span className="text-sm font-bold text-zinc-400">{cleanName.slice(0, 2).toUpperCase()}</span>;
  }

  return (
    <img
      src={sources[errorCount]}
      alt={cleanName}
      className="max-h-full max-w-full object-contain"
      onError={() => setErrorCount(prev => prev + 1)}
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

  const totalPrice =
    offer.price +
    (selectedDgoId
      ? Number(offer.listDgo?.find((d) => d.id === selectedDgoId)?.cost ?? 0)
      : 0) +
    (selectedAutolawyerId
      ? offer.listAutolawyer.find((a) => a.id === selectedAutolawyerId)?.price ?? 0
      : 0);

  const isRecommended = index === 0;

  const hasOptions =
    (offer.listDgo && offer.listDgo.length > 0) ||
    (offer.listAutolawyer && offer.listAutolawyer.length > 0);

  const optionsBlock = (
    <div className="flex flex-col gap-2.5">
      {offer.listAutolawyer && offer.listAutolawyer.length > 0 && offer.listAutolawyer.slice(0, 1).map((al) => (
        <button
          key={al.id}
          onClick={() => onSelectAutolawyer(selectedAutolawyerId === al.id ? null : al.id)}
          className="flex items-center gap-2 text-sm text-zinc-700 hover:text-zinc-900 transition-colors w-fit"
        >
          <span className={`relative flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition-all duration-200 ${
            selectedAutolawyerId === al.id
              ? "bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-200"
              : "bg-zinc-50 border border-zinc-200 shadow-sm"
          }`}>
            {selectedAutolawyerId === al.id && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
          </span>
          <span className="underline underline-offset-2">Автоюрист</span>
        </button>
      ))}

      {offer.listDgo && offer.listDgo.length > 0 && (
        <div className="flex items-center gap-2">
          <span
            onClick={() => selectedDgoId && onSelectDgo(null)}
            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
              selectedDgoId
                ? "border-indigo-500 bg-indigo-500 cursor-pointer"
                : "border-zinc-300 bg-white"
            }`}
          >
            {selectedDgoId && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
          </span>
          <select
            value={selectedDgoId || ""}
            onChange={(e) => onSelectDgo(e.target.value || null)}
            className="w-auto max-w-fit text-sm text-zinc-700 hover:text-zinc-900 underline underline-offset-2 bg-transparent border-none outline-none cursor-pointer transition-colors"
          >
            <option value="">Додаткове покриття</option>
            {offer.listDgo.map((dgo) => (
              <option key={dgo.id} value={dgo.id}>
                +{dgo.coverage.toLocaleString()} за {formatPrice(Number(dgo.cost))}
              </option>
            ))}
          </select>
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
      <div className="flex items-center gap-3 p-4 lg:hidden">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50 p-1.5">
          <CompanyLogo company={offer.company} cleanName={cleanCompanyName} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-zinc-900 truncate leading-snug">
            {cleanCompanyName}
          </p>
          {hasOptions && (
            <div className="mt-2">
              {optionsBlock}
            </div>
          )}
        </div>

        <div className="shrink-0 flex flex-col items-end gap-2 pl-2">
          <span
            className="text-base font-bold text-zinc-900 tabular-nums"
            style={{ fontFamily: 'var(--font-roboto)' }}
          >
            {formatPrice(totalPrice)}
          </span>
          <Button
            variant="primary"
            size="sm"
            onClick={() => { onSelect(); onBuy(); }}
          >
            Купити
          </Button>
          {hasOptions && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-0.5 text-xs text-zinc-400 hover:text-indigo-600 transition-colors"
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
                {[offer.listDgo?.length ? 1 : 0, offer.listAutolawyer?.length ? 1 : 0].reduce((a, b) => a + b, 0)}
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
        <div className="flex flex-col justify-center items-center flex-1">
          <div className="flex flex-col gap-3 items-start">
            {optionsBlock}
          </div>
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
          {offer.listAutolawyer && offer.listAutolawyer.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-zinc-700 mb-1">Автоюрист</p>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Юридична допомога у випадку ДТП: консультації, представництво інтересів, допомога з оформленням документів та відшкодуванням збитків.
              </p>
            </div>
          )}
          {offer.listDgo && offer.listDgo.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-zinc-700 mb-1">Додаткове покриття (ДГО)</p>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Розширення ліміту цивільної відповідальності понад базове ОСЦПВ. Доступні варіанти покриття: від{" "}
                {Number(offer.listDgo[0].coverage).toLocaleString()} до{" "}
                {Number(offer.listDgo[offer.listDgo.length - 1].coverage).toLocaleString()} грн.
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
