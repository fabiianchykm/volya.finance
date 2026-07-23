"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

// Зручний ввід дати (переважно дати народження): masked-текст ДД.ММ.РРРР з
// авто-крапками + власний сучасний календар-попап зі швидким вибором місяця/року
// (без гортання десятиліть, як у нативному пікері). value/onChange — рядок
// "ДД.ММ.РРРР", який очікує пейлоад Ukasko і легко парситься parseUaDate.

const MONTHS = [
  "Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень",
  "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень",
];
const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

/** Вставляє крапки по ходу вводу: 01011990 → 01.01.1990 (максимум 8 цифр). */
function maskDate(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 8);
  let out = d.slice(0, 2);
  if (d.length > 2) out += "." + d.slice(2, 4);
  if (d.length > 4) out += "." + d.slice(4, 8);
  return out;
}

/** "ДД.ММ.РРРР" → Date | null (з перевіркою реальності дати). */
export function parseUaDate(v: string): Date | null {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(v.trim());
  if (!m) return null;
  const day = +m[1], mon = +m[2], year = +m[3];
  const dt = new Date(year, mon - 1, day);
  if (dt.getFullYear() !== year || dt.getMonth() !== mon - 1 || dt.getDate() !== day) return null;
  return dt;
}

function toUa(y: number, mo: number, d: number): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d)}.${p(mo)}.${y}`;
}

interface DateInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
  /** Зовнішня помилка (напр. валідація при сабміті). Має пріоритет над внутрішньою. */
  error?: string;
  /** Рік, на якому відкривати календар без значення (ДН → 1990, дата видачі → поточний). */
  defaultYear?: number;
  /** Мінімальна доступна дата (за замовч. — без обмеження знизу). */
  minDate?: Date;
  /** Максимальна доступна дата (за замовч. — сьогодні, тобто майбутнє заблоковане). */
  maxDate?: Date;
}

export function DateInput({ label, value, onChange, required, className, error, defaultYear, minDate, maxDate }: DateInputProps) {
  const parsed = parseUaDate(value);
  const errText = error || (value.replace(/\D/g, "").length === 8 && !parsed ? "Невірна дата" : "");

  const today = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  // За замовч.: min — далеко в минуле, max — сьогодні (для дат народження/видачі).
  const min = minDate ? startOfDay(minDate) : new Date(1900, 0, 1);
  const max = maxDate ? startOfDay(maxDate) : startOfDay(today);
  const [open, setOpen] = useState(false);
  // Місяць/рік, що зараз показані в календарі. За замовчуванням — 1990 (зручно для ДН).
  const [view, setView] = useState(() => {
    const base = parsed ?? new Date(defaultYear ?? today.getFullYear(), 0, 1);
    return { y: base.getFullYear(), m: base.getMonth() };
  });
  const ref = useRef<HTMLDivElement>(null);

  const toggle = () => {
    setOpen((o) => {
      const next = !o;
      if (next && parsed) setView({ y: parsed.getFullYear(), m: parsed.getMonth() });
      return next;
    });
  };

  // Закриття по кліку поза компонентом / Esc — вішаємо лише коли попап відкритий.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const years: number[] = [];
  for (let y = max.getFullYear(); y >= min.getFullYear(); y--) years.push(y);

  // Сітка днів: понеділок першим.
  const startOffset = (new Date(view.y, view.m, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prevMonth = () => setView((v) => (v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }));
  const nextMonth = () => setView((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }));

  const isSelected = (d: number) =>
    parsed && parsed.getFullYear() === view.y && parsed.getMonth() === view.m && parsed.getDate() === d;
  const isDisabled = (d: number) => {
    const dt = new Date(view.y, view.m, d);
    return dt < min || dt > max;
  };

  const selectClass =
    "h-8 rounded-lg border border-zinc-200 bg-white px-2 text-sm text-zinc-800 outline-none focus:border-indigo-400";

  return (
    <div className="relative flex flex-col gap-1.5" ref={ref}>
      {label && <label className="text-sm font-medium text-zinc-700">{label}</label>}

      <div
        className={`flex items-center rounded-xl border bg-white transition-colors focus-within:ring-1 ${
          errText
            ? "border-red-400 focus-within:border-red-500 focus-within:ring-red-500"
            : "border-zinc-200 focus-within:border-indigo-500 focus-within:ring-indigo-500"
        } ${className ?? ""}`}
      >
        <input
          type="text"
          inputMode="numeric"
          autoComplete="bday"
          placeholder="ДД.ММ.РРРР"
          value={value}
          required={required}
          onChange={(e) => onChange(maskDate(e.target.value))}
          className="h-11 w-full rounded-xl bg-transparent px-4 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none"
        />
        <button
          type="button"
          onClick={toggle}
          aria-label="Відкрити календар"
          className={`flex h-11 w-11 shrink-0 items-center justify-center transition-colors hover:text-indigo-500 ${
            open ? "text-indigo-500" : "text-zinc-400"
          }`}
        >
          <CalendarDays className="h-5 w-5" />
        </button>
      </div>

      {open && (
        <div className="absolute top-full left-0 z-30 mt-2 w-[288px] rounded-2xl border border-zinc-200 bg-white p-3 shadow-xl">
          {/* Хедер: ‹ місяць рік › — місяць і рік як швидкі спадні списки */}
          <div className="mb-2 flex items-center gap-1.5">
            <button
              type="button"
              onClick={prevMonth}
              aria-label="Попередній місяць"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <select value={view.m} onChange={(e) => setView((v) => ({ ...v, m: +e.target.value }))} className={`${selectClass} flex-1`}>
              {MONTHS.map((mn, i) => (
                <option key={mn} value={i}>{mn}</option>
              ))}
            </select>
            <select value={view.y} onChange={(e) => setView((v) => ({ ...v, y: +e.target.value }))} className={selectClass}>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={nextMonth}
              aria-label="Наступний місяць"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 text-center">
            {WEEKDAYS.map((w) => (
              <span key={w} className="pb-1 text-[11px] font-medium text-zinc-400">{w}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((d, i) =>
              d === null ? (
                <span key={i} />
              ) : (
                <button
                  key={i}
                  type="button"
                  disabled={isDisabled(d)}
                  onClick={() => { onChange(toUa(view.y, view.m + 1, d)); setOpen(false); }}
                  className={`h-9 rounded-lg text-sm transition-colors ${
                    isSelected(d)
                      ? "bg-indigo-600 font-semibold text-white"
                      : isDisabled(d)
                        ? "cursor-not-allowed text-zinc-300"
                        : "text-zinc-700 hover:bg-indigo-50"
                  }`}
                >
                  {d}
                </button>
              )
            )}
          </div>
        </div>
      )}

      {errText && <p className="text-xs font-medium text-red-500">{errText}</p>}
    </div>
  );
}
