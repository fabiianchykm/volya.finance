"use client";

import { useEffect, useState } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";

// Панель доступності у футері: розмір шрифту, високий контраст, збільшені інтервали,
// підкреслення посилань, зупинка анімацій. Клас/розмір застосовує інлайн-скрипт у
// layout ще до рендеру (без спалаху); тут — керування й збереження вибору.
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
  const [s, setS] = useState<A11y>(DEFAULTS);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = JSON.parse(localStorage.getItem("a11y") || "null");
      if (saved) setS({ ...DEFAULTS, ...saved });
    } catch {}
  }, []);

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

  // До монтування показуємо дефолтний вигляд (щоб не було hydration-розбіжності).
  const on = (v: boolean) => mounted && v;

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
      active
        ? "border-indigo-500 bg-indigo-600 text-white"
        : "border-zinc-200 bg-white text-zinc-600 hover:border-indigo-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-indigo-500"
    }`;

  const stepBtn =
    "flex h-7 w-7 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-zinc-100 disabled:opacity-40 disabled:hover:bg-transparent dark:text-zinc-300 dark:hover:bg-zinc-700";

  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
        Доступність
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {/* Розмір шрифту */}
        <div className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-1 dark:border-zinc-700 dark:bg-zinc-800">
          <button type="button" onClick={() => setFont(-1)} disabled={idx <= 0} aria-label="Зменшити розмір тексту" className={stepBtn}>
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="min-w-[2.6rem] text-center text-[11px] font-medium tabular-nums text-zinc-500 dark:text-zinc-400" aria-hidden="true">
            {Math.round((on(true) ? s.fontScale : 1) * 100)}%
          </span>
          <button type="button" onClick={() => setFont(1)} disabled={idx >= SCALES.length - 1} aria-label="Збільшити розмір тексту" className={stepBtn}>
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        <button type="button" aria-pressed={on(s.contrast)} onClick={() => update({ contrast: !s.contrast })} className={chip(on(s.contrast))}>
          Високий контраст
        </button>
        <button type="button" aria-pressed={on(s.spacing)} onClick={() => update({ spacing: !s.spacing })} className={chip(on(s.spacing))}>
          Інтервали
        </button>
        <button type="button" aria-pressed={on(s.underline)} onClick={() => update({ underline: !s.underline })} className={chip(on(s.underline))}>
          Підкреслювати посилання
        </button>
        <button type="button" aria-pressed={on(s.motion)} onClick={() => update({ motion: !s.motion })} className={chip(on(s.motion))}>
          Без анімації
        </button>

        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1 rounded-full px-2 py-1.5 text-xs text-zinc-500 transition-colors hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400"
        >
          <RotateCcw className="h-3 w-3" /> Скинути
        </button>
      </div>
    </div>
  );
}
