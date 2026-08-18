"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck, ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";

// Висувний промо-банер зі знижкою на автоцивілку (нижній правий кут, над кнопкою
// звʼязку). Зʼявляється з невеликою затримкою, закривається хрестиком і не турбує
// знову кілька днів (localStorage).
const DISMISS_KEY = "osago_promo_dismissed";
const HIDE_DAYS = 3;

export function PromoBanner() {
  const { t } = useI18n();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Не показуємо на самій сторінці ОСЦПВ (клієнт уже там).
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/osago")) return;
    let dismissed = 0;
    try { dismissed = Number(localStorage.getItem(DISMISS_KEY) || 0); } catch {}
    if (dismissed && Date.now() - dismissed < HIDE_DAYS * 86400000) return;
    const timer = setTimeout(() => setShow(true), 3500);
    return () => clearTimeout(timer);
  }, []);

  const close = () => {
    setShow(false);
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, x: 40, y: 20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 40, y: 20 }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
          className="fixed bottom-24 right-5 z-40 w-[300px] max-w-[calc(100vw-2.5rem)]"
        >
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-5 shadow-2xl shadow-indigo-900/30 ring-1 ring-white/10">
            {/* Декоративне світло */}
            <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10 blur-2xl" />

            <button
              type="button"
              onClick={close}
              aria-label={t({ uk: "Закрити", en: "Close" })}
              className="absolute right-2.5 top-2.5 rounded-lg p-1 text-white/70 transition-colors hover:bg-white/15 hover:text-white"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>

            <div className="relative">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                {t({ uk: "Автоцивілка", en: "Car insurance" })}
              </span>

              <p className="mt-3 text-lg font-bold leading-tight text-white">
                {t({ uk: "Знижки до 42% на ОСЦПВ", en: "Up to 42% off OSAGO" })}
              </p>
              <p className="mt-1 text-sm text-indigo-100">
                {t({ uk: "Порівняйте ціни 18+ страхових і оформіть онлайн за 3 хвилини.", en: "Compare 18+ insurers and buy online in 3 minutes." })}
              </p>

              <Link
                href="/osago"
                onClick={close}
                className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm transition-transform hover:scale-[1.02]"
              >
                {t({ uk: "Розрахувати вартість", en: "Calculate the price" })}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
