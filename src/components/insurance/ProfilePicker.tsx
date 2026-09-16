"use client";

import { useState } from "react";
import { UserRound, ChevronDown } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { CustomerProfile } from "@/lib/customer-profile";

// Кнопка «Заповнити збереженими даними» + випадний список профілів. На одному
// акаунті можуть бути дані кількох осіб (сам, дружина…) — тож пропонуємо вибір,
// а не автозаповнення. За замовчуванням поля лишаються порожніми.
export function ProfilePicker({ profiles, onPick }: { profiles: CustomerProfile[]; onPick: (p: CustomerProfile) => void }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  if (!profiles.length) return null;

  const label = (p: CustomerProfile) =>
    [p.surname, p.name, p.patronymic].filter(Boolean).join(" ") ||
    [p.surnameLat, p.nameLat].filter(Boolean).join(" ") ||
    p.email ||
    t({ uk: "Збережений профіль", en: "Saved profile" });

  return (
    <div className="relative mb-5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-indigo-200 bg-indigo-50/60 px-4 py-2.5 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300"
      >
        <span className="flex items-center gap-2"><UserRound className="h-4 w-4" /> {t({ uk: "Заповнити збереженими даними", en: "Fill from saved data" })}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            {profiles.map((p, i) => (
              <button
                key={p.email || i}
                type="button"
                onClick={() => { onPick(p); setOpen(false); }}
                className="flex w-full items-baseline justify-between gap-3 px-4 py-2.5 text-left transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
              >
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{label(p)}</span>
                {p.identificationCode ? <span className="shrink-0 text-xs text-zinc-400 dark:text-zinc-500">ІПН {p.identificationCode}</span> : null}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
