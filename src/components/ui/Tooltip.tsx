"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

// Легкий тултип: зʼявляється ОДРАЗУ при наведенні на всю зону-тригер (не лише на
// піксель іконки), як і при фокусі з клавіатури; на тач — по кліку. Замінює
// нативний `title`, який має велику затримку й крихітну зону наведення.
interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  /** Куди відкривати бульбашку відносно тригера. За замовч. — зверху. */
  side?: "top" | "bottom";
  /** Клас для обгортки-тригера (напр. кольори/курсор). */
  className?: string;
}

export function Tooltip({ content, children, side = "top", className }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const ref = useRef<HTMLSpanElement>(null);

  // Закриття по Esc / кліку поза тригером (важливо для тач-режиму).
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onEsc); };
  }, [open]);

  return (
    <span
      ref={ref}
      className={`relative inline-flex items-center ${className ?? ""}`}
      tabIndex={0}
      aria-describedby={open ? id : undefined}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((o) => !o); }}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          id={id}
          className={`pointer-events-none absolute left-1/2 z-[70] w-max max-w-[16rem] -translate-x-1/2 whitespace-normal rounded-xl bg-zinc-900 px-3 py-2 text-left text-xs font-normal leading-snug text-white shadow-xl dark:bg-zinc-700 ${
            side === "top" ? "bottom-full mb-2" : "top-full mt-2"
          }`}
        >
          {content}
        </span>
      )}
    </span>
  );
}
