"use client";

import { ShieldCheck, Users, Layers, Mail, Scale, Globe, Clock, FileText, type LucideIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { LEAD_PRODUCTS } from "@/lib/lead-products";

// Переваги + «що потрібно» за конфігом продукту. Іконки — по колу з набору
// (конфіг без іконок, щоб бути серверно-безпечним).
const ICONS: LucideIcon[] = [Scale, Users, Layers, Mail, Globe, ShieldCheck, Clock, FileText];

export function LeadProductBenefits({ slug }: { slug: string }) {
  const cfg = LEAD_PRODUCTS[slug];
  const { t } = useI18n();
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="mb-12 text-center">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-3xl">{t(cfg.benefitsTitle)}</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-zinc-500 dark:text-zinc-400 sm:text-base">{t(cfg.benefitsSubtitle)}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cfg.benefits.map((b, i) => {
          const Icon = ICONS[i % ICONS.length];
          return (
            <div key={b.title.uk} className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/40">
                <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{t(b.title)}</h3>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t(b.desc)}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-10 rounded-[2rem] p-6 text-white sm:p-8" style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #4338ca 45%, #6d28d9 100%)" }}>
        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div>
            <h3 className="text-xl font-bold sm:text-2xl">{t(cfg.docsTitle)}</h3>
            <p className="mt-2 text-sm text-indigo-100">{t(cfg.docsSubtitle)}</p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-3">
            {cfg.docs.map((d, i) => (
              <li key={d.uk} className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
                <span className="mb-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-xs font-bold">{i + 1}</span>
                <p className="text-sm font-medium leading-snug">{t(d)}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
