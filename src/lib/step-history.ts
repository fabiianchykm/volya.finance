"use client";

import { useEffect, useRef } from "react";

// Кроки флоу в історії браузера. Кроки живуть у стані компонента, тож без цього
// системна «назад» (кнопка браузера, жест на телефоні) вибивала з флоу на
// попередню сторінку або на перший екран. Хук додає запис історії на кожен
// відстежуваний крок і на popstate повертає попередній крок, а на першому
// кроці — віддає керування браузеру (звичайний перехід назад).
//
// pushState зберігає поточний history.state (Next.js тримає там свої дані).

const KEY = "volyaStep";

export function useStepHistory<T extends string>(
  step: T,
  setStep: (s: T) => void,
  initial: T,
  opts: { tracked?: readonly T[]; onInitial?: () => void } = {},
) {
  const setRef = useRef(setStep);
  const onInitialRef = useRef(opts.onInitial);
  const trackedRef = useRef(opts.tracked);
  const pathRef = useRef<string>("");
  // Свіжі колбеки/опції — синхронізуємо в ефекті (не під час рендеру).
  useEffect(() => {
    setRef.current = setStep;
    onInitialRef.current = opts.onInitial;
    trackedRef.current = opts.tracked;
  });

  const prevRef = useRef<T>(initial);

  // Вперед: новий відстежуваний крок → запис історії. Якщо перестрибнули кілька
  // кроків (відновлення одразу на 3-му), додаємо й проміжні, щоб «назад» ішла по
  // одному. Назад програмно (setStep на ранніший крок) → history.go(), щоб стек
  // не розходився зі станом.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!pathRef.current) pathRef.current = window.location.pathname;
    const order: readonly T[] = trackedRef.current ?? [step];
    // Невідстежувані кроки (модалки OTP/оплати/успіху поверх «pay») історію не
    // чіпають: раніше indexOf() давав для них -1, і хук сприймав це як повернення
    // на початковий крок → history.go(-N) → після «Оплатити» кидало на 1-й крок.
    if (step !== initial && !order.includes(step)) return;
    const idx = (s: T) => (s === initial ? -1 : order.indexOf(s));
    const prev = prevRef.current;
    prevRef.current = step;
    const from = idx(prev);
    const to = idx(step);
    if (to === from) return;
    const cur = (window.history.state ?? {}) as Record<string, unknown>;
    if (to > from) {
      if (cur[KEY] === step) return;
      for (let i = Math.max(from, -1) + 1; i <= to; i++) {
        window.history.pushState({ ...cur, [KEY]: order[i] }, "", window.location.href);
      }
    } else if (to >= -1 && cur[KEY] === prev && from >= 0) {
      // крок зменшили програмно (кнопка «Назад» у формі) — відкочуємо історію на стільки ж
      window.history.go(to - from);
    }
  }, [step, initial]);

  // Назад/вперед: читаємо крок із запису історії.
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      if (window.location.pathname !== pathRef.current) return; // пішли на іншу сторінку — не наше
      const s = (e.state as Record<string, unknown> | null)?.[KEY] as T | undefined;
      if (s && s !== initial) setRef.current(s);
      else { setRef.current(initial); onInitialRef.current?.(); }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [initial]);
}
