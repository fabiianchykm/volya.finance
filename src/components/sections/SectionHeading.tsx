"use client";

import type { LucideIcon } from "lucide-react";

// Єдиний заголовок маркетингових секцій: маленька «пілюля»-надзаголовок, h2,
// підзаголовок. По центру, однакові розміри й відступи на всіх сторінках — щоб
// секції читались як одна система, а не набір блоків різного походження.
export function SectionHeading({ eyebrow, icon: Icon, title, subtitle, className = "" }: {
  eyebrow?: string;
  icon?: LucideIcon;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto mb-10 max-w-2xl text-center sm:mb-12 ${className}`}>
      {eyebrow && (
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-indigo-600 shadow-sm ring-1 ring-indigo-100 dark:bg-zinc-900 dark:text-indigo-400 dark:ring-indigo-900">
          {Icon && <Icon className="h-3.5 w-3.5" />}
          {eyebrow}
        </span>
      )}
      <h2 className={`text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl ${eyebrow ? "mt-4" : ""}`}>{title}</h2>
      {subtitle && <p className="mx-auto mt-3 max-w-xl text-base text-zinc-500 dark:text-zinc-400">{subtitle}</p>}
    </div>
  );
}
