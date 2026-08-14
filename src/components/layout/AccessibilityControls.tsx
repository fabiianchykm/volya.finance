"use client";

import { useEffect, useRef, useState } from "react";
import { Accessibility, Minus, Plus, RotateCcw } from "lucide-react";
import { useI18n } from "@/lib/i18n";

// Кнопка «Доступність» із popover-панеллю (поряд із перемикачем теми у футері):
// розмір шрифту, високий контраст, збільшені інтервали, підкреслення посилань,
// зупинка анімацій. Клас/розмір застосовує інлайн-скрипт у layout ще до рендеру
// (без спалаху); тут — керування й збереження вибору.
const SCALES = [0.9, 1, 1.1, 1.25, 1.4];

interface A11y {
  fontScale: number;
  contrast: boolean;
  spacing: boolean;
  underline: boolean;
  motion: boolean;
}
const DEFAULTS: A11y = { fontScale: 1, contrast: false, spacing: false, underline: false, motion: false };

function apply(s: A11y) {
  const el = document.documentElement;
  el.style.fontSize = `${16 * s.fontScale}px`;
  el.classList.toggle("a11y-contrast", s.contrast);
  el.classList.toggle("a11y-spacing", s.spacing);
  el.classList.toggle("a11y-underline", s.underline);
  el.classList.toggle("a11y-no-motion", s.motion);
}

export function AccessibilityControls() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [s, setS] = useState<A11y>(DEFAULTS);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = JSON.parse(localStorage.getItem("a11y") || "null");
      if (saved) setS({ ...DEFAULTS, ...saved });
    } catch {}
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onEsc); };
  }, [open]);

  const update = (patch: Partial<A11y>) => {
    setS((prev) => {
      const next = { ...prev, ...patch };
      apply(next);
      try { localStorage.setItem("a11y", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const idx = Math.max(0, SCALES.indexOf(s.fontScale));
  const setFont = (dir: number) =>
    update({ fontScale: SCALES[Math.min(SCALES.length - 1, Math.max(0, idx + dir))] });

  const reset = () => {
    apply(DEFAULTS);
    try { localStorage.removeItem("a11y"); } catch {}
    setS(DEFAULTS);
  };

  const on = (v: boolean) => mounted && v;

  const stepBtn =
    "flex h-7 w-7 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-zinc-100 disabled:opacity-40 disabled:hover:bg-transparent dark:text-zinc-300 dark:hover:bg-zinc-700";

  // Рядок-тумблер (label ліворуч, перемикач праворуч).
  const Toggle = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
    >
      <span className="text-sm text-zinc-700 dark:text-zinc-200">{label}</span>
      <span className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${active ? "bg-indigo-600" : "bg-zinc-300 dark:bg-zinc-600"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${active ? "translate-x-[18px]" : "translate-x-0.5"}`} />
      </span>
    </button>
  );

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t({ uk: "Доступність", en: "Accessibility" })}
        aria-haspopup="dialog"
        aria-expanded={open}
        title={t({ uk: "Доступність", en: "Accessibility" })}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-indigo-600 shadow-sm transition-colors hover:bg-indigo-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-indigo-400 dark:hover:bg-zinc-700"
      >
        <Accessibility className="h-5 w-5" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={t({ uk: "Налаштування доступності", en: "Accessibility settings" })}
          className="absolute bottom-full right-0 z-40 mb-2 w-72 rounded-2xl border border-zinc-200 bg-white p-3 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
        >
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
            {t({ uk: "Доступність", en: "Accessibility" })}
          </p>

          {/* Розмір шрифту */}
          <div className="flex items-center justify-between gap-3 rounded-lg px-2 py-2">
            <span className="text-sm text-zinc-700 dark:text-zinc-200">{t({ uk: "Розмір тексту", en: "Text size" })}</span>
            <div className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-1 dark:border-zinc-700 dark:bg-zinc-800">
              <button type="button" onClick={() => setFont(-1)} disabled={idx <= 0} aria-label={t({ uk: "Зменшити розмір тексту", en: "Decrease text size" })} className={stepBtn}>
                <Minus className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <span className="min-w-[2.6rem] text-center text-[11px] font-medium tabular-nums text-zinc-500 dark:text-zinc-400" aria-hidden="true">
                {Math.round((mounted ? s.fontScale : 1) * 100)}%
              </span>
              <button type="button" onClick={() => setFont(1)} disabled={idx >= SCALES.length - 1} aria-label={t({ uk: "Збільшити розмір тексту", en: "Increase text size" })} className={stepBtn}>
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          <Toggle label={t({ uk: "Високий контраст", en: "High contrast" })} active={on(s.contrast)} onClick={() => update({ contrast: !s.contrast })} />
          <Toggle label={t({ uk: "Збільшені інтервали", en: "Increased spacing" })} active={on(s.spacing)} onClick={() => update({ spacing: !s.spacing })} />
          <Toggle label={t({ uk: "Підкреслювати посилання", en: "Underline links" })} active={on(s.underline)} onClick={() => update({ underline: !s.underline })} />
          <Toggle label={t({ uk: "Без анімації", en: "No animation" })} active={on(s.motion)} onClick={() => update({ motion: !s.motion })} />

          <div className="mt-1 border-t border-zinc-100 pt-2 dark:border-zinc-800">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-zinc-500 transition-colors hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400"
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" /> {t({ uk: "Скинути налаштування", en: "Reset settings" })}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
