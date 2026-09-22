"use client";

import { useEffect, useRef } from "react";

// Відновлення оформлення після перезавантаження вкладки. Мобільні браузери часто
// вивантажують сторінку, поки клієнт ходить у пошту/SMS за OTP-кодом; після
// повернення React монтується з нуля і клієнт опинявся на першому кроці. Тримаємо
// знімок прогресу (крок, orderId, введені дані) у sessionStorage і при монтуванні
// повертаємо клієнта на той самий крок. Знімок живе TTL хв і стирається після успіху.

const TTL_MS = 60 * 60 * 1000;

export function readResume<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw) as { ts: number; data: T };
    if (!ts || Date.now() - ts > TTL_MS) { sessionStorage.removeItem(key); return null; }
    return data;
  } catch {
    return null;
  }
}

export function clearResume(key: string): void {
  try { sessionStorage.removeItem(key); } catch { /* ignore */ }
}

/** Пише знімок при кожній зміні; null — стирає. */
export function useResumeSnapshot(key: string, snapshot: unknown | null): void {
  const json = snapshot == null ? null : JSON.stringify(snapshot);
  useEffect(() => {
    try {
      if (json == null) sessionStorage.removeItem(key);
      else sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), data: JSON.parse(json) }));
    } catch { /* приватний режим / квота — просто без відновлення */ }
  }, [key, json]);
}

/** Один раз на маунті віддає збережений знімок у restore (якщо є і свіжий). */
export function useResumeOnMount<T>(key: string, restore: (data: T) => void): void {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const data = readResume<T>(key);
    if (data) restore(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
