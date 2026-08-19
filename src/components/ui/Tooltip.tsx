"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

// Легкий тултип: зʼявляється ОДРАЗУ при наведенні на всю зону-тригер (не лише на
// піксель іконки), як і при фокусі з клавіатури; на тач — по кліку. Замінює
// нативний `title` (велика затримка, крихітна зона наведення).
// Бульбашку позиціонуємо через position:fixed за координатами тригера, щоб вона
// НЕ обрізалась батьківськими рамками з overflow-hidden (напр. картками/дропдаунами).
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
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const id = useId();
  const ref = useRef<HTMLSpanElement>(null);

  const place = () => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    // Тримаємо центр у межах вьюпорта (щоб бульбашка не вилазила за край екрана).
    const left = Math.min(Math.max(r.left + r.width / 2, 140), window.innerWidth - 140);
    const top = side === "top" ? r.top - 8 : r.bottom + 8;
    setPos({ left, top });
  };

  const show = () => { place(); setOpen(true); };

  // Закриття по Esc / кліку поза тригером (важливо для тач-режиму); при
  // скролі/ресайзі — переміщуємо бульбашку слідом за тригером.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const onMove = () => place();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };

  }, [open]);

  return (
    <span
      ref={ref}
      className={`relative inline-flex items-center ${className ?? ""}`}
      tabIndex={0}
      aria-describedby={open ? id : undefined}
      onMouseEnter={show}
      onMouseLeave={() => setOpen(false)}
      onFocus={show}
      onBlur={() => setOpen(false)}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (open) setOpen(false); else show(); }}
    >
      {children}
      {open && pos && (
        <span
          role="tooltip"
          id={id}
          style={{
            position: "fixed",
            left: pos.left,
            top: pos.top,
            transform: side === "top" ? "translate(-50%, -100%)" : "translate(-50%, 0)",
          }}
          className="pointer-events-none z-[100] w-max max-w-[16rem] whitespace-normal rounded-xl bg-zinc-900 px-3 py-2 text-left text-xs font-normal leading-snug text-white shadow-xl dark:bg-zinc-700"
        >
          {content}
        </span>
      )}
    </span>
  );
}
