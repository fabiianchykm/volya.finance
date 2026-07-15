"use client";

import { CalendarDays } from "lucide-react";

// Зручний ввід дати (переважно дати народження): текст ДД.ММ.РРРР з авто-крапками
// + цифрова клавіатура на мобільному + кнопка-календар для вибору мишею.
// value/onChange працюють із рядком "ДД.ММ.РРРР" — саме такий формат очікує
// пейлоад Ukasko (`birthdayAt`) і легко конвертується в timestamp через parseUaDate.

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

function iso(dt: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}`;
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
}

export function DateInput({ label, value, onChange, required, className, error }: DateInputProps) {
  const parsed = parseUaDate(value);
  // Внутрішню помилку показуємо лише коли дата введена повністю (8 цифр), але некоректна.
  const errText = error || (value.replace(/\D/g, "").length === 8 && !parsed ? "Невірна дата" : "");
  const showError = !!errText;

  const today = new Date();
  const maxIso = iso(today);

  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-zinc-700">{label}</label>}
      <div
        className={`relative flex items-center rounded-xl border bg-white transition-colors focus-within:ring-1 ${
          showError
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
        {/* Календар: прозорий нативний date-інпут поверх іконки — клік відкриває
            системний пікер (без гортання десятиліть у текстовому полі). */}
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center text-zinc-400 transition-colors hover:text-indigo-500">
          <CalendarDays className="pointer-events-none h-5 w-5" />
          <input
            type="date"
            value={parsed ? iso(parsed) : ""}
            min="1920-01-01"
            max={maxIso}
            aria-label="Обрати дату з календаря"
            onChange={(e) => {
              const v = e.target.value; // yyyy-mm-dd
              if (!v) return;
              const [y, mo, d] = v.split("-").map(Number);
              onChange(toUa(y, mo, d));
            }}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </div>
      </div>
      {showError && <p className="text-xs font-medium text-red-500">{errText}</p>}
    </div>
  );
}
