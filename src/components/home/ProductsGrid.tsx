"use client";

import Link from "next/link";
import { ShieldCheck, Car, Coins, Globe, Plane, PawPrint, ArrowRight, type LucideIcon } from "lucide-react";
import { useI18n, type Tr } from "@/lib/i18n";

interface Product {
  href: string;
  icon: LucideIcon;
  title: Tr;
  desc: Tr;
  badge?: Tr;
}

const products: Product[] = [
  {
    href: "/osago",
    icon: ShieldCheck,
    title: { uk: "Автоцивілка", en: "Car insurance (OSAGO)" },
    desc: { uk: "Обовʼязкове страхування (ОСЦПВ). Порівняйте ціни страхових і оформіть поліс онлайн.", en: "Compulsory insurance (OSAGO). Compare insurers' prices and buy your policy online." },
  },
  {
    href: "/kasko",
    icon: Car,
    title: { uk: "КАСКО", en: "CASCO" },
    desc: { uk: "Повний захист авто від ДТП з вашої вини, викрадення, стихії та пошкоджень.", en: "Full protection against at-fault accidents, theft, natural disasters and damage." },
  },
  {
    href: "/mini-kasko",
    icon: Coins,
    title: { uk: "Міні-КАСКО", en: "Mini-CASCO" },
    desc: { uk: "Захист від ключових ризиків за доступною ціною — дешевше за повне КАСКО.", en: "Protection from key risks at an affordable price — cheaper than full CASCO." },
  },
  {
    href: "/green-card",
    icon: Globe,
    title: { uk: "Зелена карта", en: "Green Card" },
    desc: { uk: "Міжнародна автострахова для виїзду за кордон. Європа, Азербайджан, Молдова.", en: "International car insurance for trips abroad. Europe, Azerbaijan, Moldova." },
  },
  {
    href: "/tourism",
    icon: Plane,
    title: { uk: "Туристичне", en: "Travel insurance" },
    desc: { uk: "Медичний захист у подорожі за кордон. Поліс для віз і виїзду — з цінами онлайн.", en: "Medical protection while travelling abroad. A policy for visas and trips — prices online." },
  },
  {
    href: "/pets",
    icon: PawPrint,
    title: { uk: "Тварини", en: "Pets" },
    desc: { uk: "Страхування котів і собак — ветеринарні витрати та ризики. Незабаром.", en: "Insurance for cats and dogs — veterinary costs and risks. Coming soon." },
    badge: { uk: "Скоро", en: "Soon" },
  },
];

export function ProductsGrid() {
  const { t } = useI18n();
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="mb-10 text-center">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-3xl">{t({ uk: "Оберіть продукт", en: "Choose a product" })}</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-zinc-500 dark:text-zinc-400 sm:text-base">
          {t({ uk: "Усі види автострахування з офіційних джерел — в одному застосунку.", en: "All types of car insurance from official sources — in one app." })}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map(({ href, icon: Icon, title, desc, badge }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/40 transition-colors group-hover:bg-indigo-600">
                <Icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400 transition-colors group-hover:text-white" />
              </div>
              {badge && (
                <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  {t(badge)}
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{t(title)}</h3>
            <p className="mt-1 flex-1 text-sm text-zinc-500 dark:text-zinc-400">{t(desc)}</p>
            <span className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
              {t({ uk: "Оформити", en: "Get started" })}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
