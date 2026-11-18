"use client";

import { Car, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useRecentPlates, forgetPlate, prettyPlate, normalizePlateKey } from "@/lib/recent-plates";

// Підказка нещодавніх номерів під полем: чіпи «AA 1234 BB · Renault Megane».
// Тап підставляє номер (і, за бажанням викликача, одразу запускає пошук).
// `tone="dark"` — для темного героя; `current` — щоб не підказувати те, що вже введено.

export function RecentPlates({ onPick, current = "", tone = "light", className = "", max = 4 }: {
  onPick: (plate: string) => void;
  current?: string;
  tone?: "light" | "dark";
  className?: string;
  max?: number;
}) {
  const { t } = useI18n();
  const all = useRecentPlates();
  const cur = normalizePlateKey(current);
  const list = all.filter((p) => p.plate !== cur && (!cur || p.plate.startsWith(cur))).slice(0, max);
  if (list.length === 0) return null;

  const dark = tone === "dark";
  return (
    <div className={`flex flex-wrap items-center justify-center gap-2 ${className}`}>
      <span className={`text-xs ${dark ? "text-indigo-200/80" : "text-zinc-500 dark:text-zinc-400"}`}>{t({ uk: "Нещодавні:", en: "Recent:" })}</span>
      {list.map((p) => {
        const car = [p.mark, p.model].filter(Boolean).join(" ");
        return (
          <span key={p.plate} className={`group inline-flex items-center overflow-hidden rounded-full text-xs ring-1 ${dark ? "bg-white/10 text-white ring-white/20 hover:bg-white/20" : "bg-white text-zinc-800 ring-zinc-200 hover:ring-indigo-300 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-700"}`}>
            <button type="button" onClick={() => onPick(p.plate)} className="flex items-center gap-1.5 py-1.5 pl-3 pr-1.5" title={car ? `${prettyPlate(p.plate)} · ${car}` : prettyPlate(p.plate)}>
              <Car className={`h-3.5 w-3.5 ${dark ? "text-indigo-200" : "text-indigo-500"}`} />
              <span className="font-mono font-semibold tracking-wider">{prettyPlate(p.plate)}</span>
              {car && <span className={`hidden max-w-[140px] truncate sm:inline ${dark ? "text-indigo-100/80" : "text-zinc-500 dark:text-zinc-400"}`}>· {car}</span>}
            </button>
            <button type="button" onClick={() => forgetPlate(p.plate)} aria-label={t({ uk: `Забути ${prettyPlate(p.plate)}`, en: `Forget ${prettyPlate(p.plate)}` })} className={`flex h-full items-center px-1.5 ${dark ? "text-indigo-200/60 hover:text-white" : "text-zinc-400 hover:text-red-500"}`}>
              <X className="h-3 w-3" />
            </button>
          </span>
        );
      })}
    </div>
  );
}
