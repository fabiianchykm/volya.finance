"use client";

import { KASKO_PRODUCTS, type KaskoProduct } from "./products";
import { useI18n } from "@/lib/i18n";

// Приймаємо КЛЮЧ продукту (а не сам config): дані з іконками-функціями імпортуємо
// вже в клієнтському компоненті, щоб не передавати функції через межу server→client.
export function KaskoBenefits({ product }: { product: KaskoProduct }) {
  const { t } = useI18n();
  const config = KASKO_PRODUCTS[product];
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="mb-12 text-center">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-3xl">{t({ uk: config.benefitsTitle, en: config.benefitsTitleEn })}</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-zinc-500 dark:text-zinc-400 sm:text-base">
          {t({ uk: config.benefitsSubtitle, en: config.benefitsSubtitleEn })}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {config.benefits.map(({ icon: Icon, title, titleEn, desc, descEn }) => (
          <div key={title} className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/40">
              <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{t({ uk: title, en: titleEn })}</h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t({ uk: desc, en: descEn })}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
