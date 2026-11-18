"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, MonitorSmartphone } from "lucide-react";
import { useI18n } from "@/lib/i18n";

// Перемикач теми з трьома режимами: Авто (темна, якщо система темна АБО ніч
// 20:00–07:00; перевіряється живо) · Світла · Темна. Клас .dark на <html>
// виставляє інлайн-скрипт у layout (без FOUC) і він же слухає matchMedia;
// тут лише зберігаємо вибір і просимо скрипт перезастосувати тему.

type Mode = "auto" | "light" | "dark";

declare global {
  interface Window { __applyTheme?: () => void }
}

function readMode(): Mode {
  try {
    const t = localStorage.getItem("theme");
    return t === "light" || t === "dark" ? t : "auto";
  } catch {
    return "auto";
  }
}

export function ThemeToggle() {
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>("auto");
  const [mounted, setMounted] = useState(false);

  // Режим читаємо з localStorage лише після монтування (SSR не знає вибору).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true); setMode(readMode()); }, []);

  const apply = (next: Mode) => {
    setMode(next);
    try {
      if (next === "auto") localStorage.removeItem("theme");
      else localStorage.setItem("theme", next);
    } catch {}
    const reapply = window.__applyTheme;
    if (typeof reapply === "function") {
      reapply();
    } else {
      // Фолбек, якщо інлайн-скрипт не відпрацював.
      const h = new Date().getHours();
      const dark = next === "dark" || (next === "auto" && (window.matchMedia("(prefers-color-scheme: dark)").matches || h >= 20 || h < 7));
      document.documentElement.classList.toggle("dark", dark);
      document.documentElement.style.setProperty("color-scheme", dark ? "dark" : "light");
    }
  };

  const OPTIONS: { value: Mode; Icon: typeof Sun; label: string }[] = [
    { value: "auto", Icon: MonitorSmartphone, label: t({ uk: "Авто: як у системі, а з 20:00 до 7:00 — темна", en: "Auto: follows the system, dark from 8 pm to 7 am" }) },
    { value: "light", Icon: Sun, label: t({ uk: "Світла тема", en: "Light theme" }) },
    { value: "dark", Icon: Moon, label: t({ uk: "Темна тема", en: "Dark theme" }) },
  ];

  return (
    <div
      role="radiogroup"
      aria-label={t({ uk: "Тема оформлення", en: "Colour theme" })}
      className="inline-flex h-9 items-center rounded-full border border-zinc-200 bg-white p-1 shadow-sm dark:border-zinc-700 dark:bg-zinc-800"
    >
      {OPTIONS.map(({ value, Icon, label }) => {
        const active = mounted && mode === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => apply(value)}
            className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
              active ? "bg-indigo-600 text-white shadow" : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}
