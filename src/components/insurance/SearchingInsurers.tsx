"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";

// Індикатор пошуку: «опитуємо» страховиків по черзі + смуга завантаження.
// БЕЗ framer-motion — чистий CSS, щоб не навантажувати головний потік під час
// довгого очікування калькулятора (інакше сторінка підлагує). Спільний для
// автоцивілки, зеленої карти й туристичного (можна передати свій names).

const DEFAULT_INSURERS = [
  "ІНГО", "ПЗУ", "УНІКА", "ОРАНТА", "ТАС", "КНЯЖА", "УСГ", "ВУСО",
  "ЄВРОІНС", "ГАРДІАН", "АРСЕНАЛ", "ЕКСПРЕС", "ЄСА", "УТІКО", "ІНТЕР-ПОЛІС", "ББС ІНШУРАНС",
];

export function SearchingInsurers({ names = DEFAULT_INSURERS }: { names?: string[] }) {
  const { t } = useI18n();
  const [i, setI] = useState(0);
  useEffect(() => {
    // Один ре-рендер на 1.1с (назва СК). Без анімацій на кожен кадр.
    const id = setInterval(() => setI((v) => v + 1), 1100);
    return () => clearInterval(id);
  }, []);
  const name = names[i % names.length];
  return (
    <div className="mb-4 rounded-2xl border border-indigo-100 bg-indigo-50/40 px-4 py-3 dark:border-indigo-900 dark:bg-indigo-950/40">
      <div className="flex items-center justify-center gap-2.5">
        <span className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-500 dark:border-indigo-800" />
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          {t({ uk: "Порівнюємо тарифи страховиків —", en: "Comparing insurer rates —" })}{" "}
          <span className="font-semibold text-indigo-600 transition-opacity duration-300 dark:text-indigo-400">{name}</span>
        </p>
      </div>

      {/* Смуга завантаження — чистий CSS (GPU), без JS-анімації. */}
      <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-indigo-100 dark:bg-indigo-900/40">
        <div className="h-full w-1/4 rounded-full bg-gradient-to-r from-indigo-400 to-violet-500 animate-loading-bar" />
      </div>
    </div>
  );
}
