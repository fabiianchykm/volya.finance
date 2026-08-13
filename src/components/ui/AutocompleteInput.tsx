"use client";

import { useEffect, useRef, useState } from "react";

// Поле з автопідказкою: показує варіанти зі списку, але дозволяє й вільний ввід
// (нічого не блокує). `options` — уже відфільтрований батьком список підказок.
export function AutocompleteInput({
  label,
  value,
  onChange,
  options,
  placeholder,
  required,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const q = value.trim().toLowerCase();
  // Не показуємо список, якщо є єдиний варіант, що точно = введеному тексту.
  const showList = open && options.length > 0 && !(options.length === 1 && options[0].toLowerCase() === q);

  return (
    <div className="relative w-full" ref={ref}>
      {label && (
        <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        spellCheck={false}
        autoComplete="off"
        className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-indigo-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
      />
      {showList && (
        <div className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onChange(opt); setOpen(false); }}
              className="block w-full px-3.5 py-2 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800/60"
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
