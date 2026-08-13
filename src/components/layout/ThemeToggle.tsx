"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

// Перемикач світла/темна тема. Клас .dark на <html> уже виставляє інлайн-скрипт у
// layout (без FOUC); тут лише синхронізуємо стан кнопки й перемикаємо + памʼятаємо
// вибір у localStorage.
export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    const el = document.documentElement;
    el.classList.toggle("dark", next);
    el.style.colorScheme = next ? "dark" : "light";
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  };

  return (
    <button
      type="button"
      onClick={toggle}
      role="switch"
      aria-checked={dark}
      aria-label={dark ? "Увімкнути світлу тему" : "Увімкнути темну тему"}
      title={dark ? "Світла тема" : "Темна тема"}
      className="relative inline-flex h-9 w-16 items-center rounded-full border border-zinc-200 bg-white px-1 shadow-sm transition-colors dark:border-zinc-700 dark:bg-zinc-800"
    >
      {/* Повзунок */}
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-white shadow transition-transform duration-300 ${
          mounted && dark ? "translate-x-7" : "translate-x-0"
        }`}
      >
        {mounted && dark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      </span>
    </button>
  );
}
