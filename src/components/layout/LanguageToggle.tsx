"use client";

import { useI18n, type Lang } from "@/lib/i18n";

// Перемикач мови UA/EN — у футері поряд із доступністю та темою.
export function LanguageToggle() {
  const { lang, setLang } = useI18n();
  const opts: { code: Lang; label: string }[] = [
    { code: "uk", label: "UA" },
    { code: "en", label: "EN" },
  ];
  return (
    <div
      role="group"
      aria-label="Мова / Language"
      className="inline-flex overflow-hidden rounded-full border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800"
    >
      {opts.map((o) => {
        const active = lang === o.code;
        return (
          <button
            key={o.code}
            type="button"
            onClick={() => setLang(o.code)}
            aria-pressed={active}
            className={`px-2.5 py-1.5 text-xs font-semibold transition-colors ${
              active
                ? "bg-indigo-600 text-white"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
