"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Динамічний індикатор пошуку: «опитуємо» страховиків по черзі — реальні назви
// компаній змінюються + смуга завантаження, щоб було відчуття живого порівняння.
// Спільний для автоцивілки, зеленої карти й туристичного (можна передати свій names).

const DEFAULT_INSURERS = [
  "ІНГО", "ПЗУ", "УНІКА", "ОРАНТА", "ТАС", "КНЯЖА", "УСГ", "ВУСО",
  "ЄВРОІНС", "ГАРДІАН", "АРСЕНАЛ", "ЕКСПРЕС", "ЄСА", "УТІКО", "ІНТЕР-ПОЛІС", "ББС ІНШУРАНС",
];

export function SearchingInsurers({ names = DEFAULT_INSURERS }: { names?: string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => v + 1), 480);
    return () => clearInterval(t);
  }, []);
  const name = names[i % names.length];
  return (
    <div className="mb-4 rounded-2xl border border-indigo-100 bg-indigo-50/40 px-4 py-3">
      <div className="flex items-center justify-center gap-2.5">
        <span className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-500" />
        <p className="flex items-center justify-center gap-x-1.5 text-sm text-zinc-600">
          <span>Порівнюємо тарифи страховиків —</span>
          <span className="relative inline-grid">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={name + i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="col-start-1 row-start-1 whitespace-nowrap font-semibold text-indigo-600"
              >
                {name}
              </motion.span>
            </AnimatePresence>
          </span>
        </p>
      </div>

      {/* Смуга завантаження — рухається зліва направо, поки тягнемо пропозиції. */}
      <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-indigo-100">
        <motion.div
          className="h-full w-1/3 rounded-full bg-gradient-to-r from-indigo-400 to-violet-500"
          animate={{ x: ["-100%", "300%"] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}
