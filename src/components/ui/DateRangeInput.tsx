"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { parseUaDate } from "./DateInput";

// Вибір ПЕРІОДУ поїздки одним полем: у календарі клікаєш дату початку, потім
// дату завершення — між ними підсвічується діапазон. value/onChange — рядки
// "ДД.ММ.РРРР" (той самий формат, що очікує Ukasko).

const MONTHS = [
  "Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень",
  "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень",
];
const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

function toUa(y: number, mo: number, d: number): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d)}.${p(mo)}.${y}`;
}

interface DateRangeInputProps {
  label?: string;
  start: string;
  end: string;
  onChange: (start: string, end: string) => void;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
}

export function DateRangeInput({ label, start, end, onChange, minDate, maxDate, className }: DateRangeInputProps) {
  const startD = parseUaDate(start);
  const endD = parseUaDate(end);
  const today = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const min = minDate ? startOfDay(minDate) : startOfDay(today);
  const max = maxDate ? startOfDay(maxDate) : new Date(today.getFullYear() + 2, 11, 31);

  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => {
    const base = startD ?? new Date();
    return { y: base.getFullYear(), m: base.getMonth() };
  });
  const ref = useRef<HTMLDivElement>(null);

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
  for (let y = min.getFullYear(); y <= max.getFullYear(); y++) years.push(y);

  const startOffset = (new Date(view.y, view.m, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prevMonth = () => setView((v) => (v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }));
  const nextMonth = () => setView((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }));

  const dateOf = (d: number) => new Date(view.y, view.m, d);
  const sameDay = (a: Date | null, b: Date) => !!a && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const isDisabled = (d: number) => { const dt = dateOf(d); return dt < min || dt > max; };
  const inRange = (d: number) => startD && endD && dateOf(d) > startD && dateOf(d) < endD;

  const pick = (d: number) => {
    const dt = dateOf(d);
    // Немає початку, або вже вибрано обидві межі, або клікнули раніше за початок —
    // починаємо новий діапазон із цієї дати.
    if (!startD || (startD && endD) || dt < startD) {
      onChange(toUa(view.y, view.m + 1, d), "");
      return;
    }
    // Є початок, клікнули пізніше — це кінець; закриваємо.
    onChange(start, toUa(view.y, view.m + 1, d));
    setOpen(false);
  };

  const display = startD
    ? `${start} — ${endD ? end : "…"}`
    : "";

  const selectClass =
    "h-8 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 text-sm text-zinc-800 dark:text-zinc-200 outline-none focus:border-indigo-400";

  return (
    <div className="relative flex flex-col gap-1.5" ref={ref}>
      {label && <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{label}</label>}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex h-11 items-center justify-between rounded-xl border bg-white dark:bg-zinc-900 px-4 text-left text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
          open ? "border-indigo-500" : "border-zinc-200 dark:border-zinc-700"
        } ${className ?? ""}`}
      >
        <span className={display ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400 dark:text-zinc-500"}>
          {display || "Оберіть період"}
        </span>
        <CalendarDays className={`h-5 w-5 shrink-0 ${open ? "text-indigo-500" : "text-zinc-400 dark:text-zinc-500"}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 z-30 mt-2 w-[288px] rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3 shadow-xl">
          <div className="mb-2 flex items-center gap-1.5">
            <button type="button" onClick={prevMonth} aria-label="Попередній місяць" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <select value={view.m} onChange={(e) => setView((v) => ({ ...v, m: +e.target.value }))} className={`${selectClass} flex-1`}>
              {MONTHS.map((mn, i) => <option key={mn} value={i}>{mn}</option>)}
            </select>
            <select value={view.y} onChange={(e) => setView((v) => ({ ...v, y: +e.target.value }))} className={selectClass}>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <button type="button" onClick={nextMonth} aria-label="Наступний місяць" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 text-center">
            {WEEKDAYS.map((w) => <span key={w} className="pb-1 text-[11px] font-medium text-zinc-400 dark:text-zinc-500">{w}</span>)}
          </div>

          <div className="grid grid-cols-7 gap-y-0.5">
            {cells.map((d, i) => {
              if (d === null) return <span key={i} />;
              const isStart = sameDay(startD, dateOf(d));
              const isEnd = sameDay(endD, dateOf(d));
              const between = inRange(d);
              const disabled = isDisabled(d);
              return (
                <div key={i} className={`flex justify-center ${between ? "bg-indigo-50 dark:bg-indigo-950/40" : ""} ${isStart && endD ? "rounded-l-lg bg-indigo-50 dark:bg-indigo-950/40" : ""} ${isEnd ? "rounded-r-lg bg-indigo-50 dark:bg-indigo-950/40" : ""}`}>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => pick(d)}
                    className={`h-9 w-9 rounded-lg text-sm transition-colors ${
                      isStart || isEnd
                        ? "bg-indigo-600 font-semibold text-white"
                        : between
                          ? "text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40"
                          : disabled
                            ? "cursor-not-allowed text-zinc-300 dark:text-zinc-600"
                            : "text-zinc-700 dark:text-zinc-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                    }`}
                  >
                    {d}
                  </button>
                </div>
              );
            })}
          </div>

          <p className="mt-2 px-1 text-[11px] text-zinc-400 dark:text-zinc-500">
            {!startD ? "Оберіть дату початку" : !endD ? "Тепер оберіть дату завершення" : `Період: ${daysBetween(startD, endD)} дн.`}
          </p>
        </div>
      )}
    </div>
  );
}

export function daysBetween(a: Date, b: Date): number {
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86_400_000));
}
