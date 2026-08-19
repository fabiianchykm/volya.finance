"use client";

import { useEffect, useRef } from "react";

// Клік по пункту меню, що веде на ПОТОЧНУ сторінку (напр. «Автоцивілка», коли вже
// показані пропозиції) має скинути флоу продукту на перший екран. URL-driven флоу
// (ОСЦПВ) скидається чищенням query; решта тримають крок у стані — тож шлемо їм
// глобальну подію. За раз змонтований лише один продуктовий флоу (кожен продукт —
// окрема сторінка), тож подія без фільтра за шляхом безпечна.
const EVENT = "volya:nav-reset";

export function emitNavReset() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
}

export function useFlowReset(handler: () => void) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    const on = () => ref.current();
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);
}
