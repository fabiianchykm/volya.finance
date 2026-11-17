"use client";

import Link from "next/link";
import { ShieldCheck, Car, Coins, Globe, Plane, PawPrint, Home, HeartPulse, ArrowRight, BadgeCheck, Clock3, Building2, Gift, type LucideIcon } from "lucide-react";
import { useI18n, type Tr } from "@/lib/i18n";

interface Product {
  href: string;
  icon: LucideIcon;
  title: Tr;
  desc: Tr;
  badge?: Tr;
  soon?: boolean;   // ще не запущено — картка некликабельна
}

const products: Product[] = [
  { href: "/osago", icon: ShieldCheck, title: { uk: "Автоцивілка", en: "Car insurance (OSAGO)" }, desc: { uk: "Обовʼязкове ОСЦПВ. Порівняйте ціни й оформіть електронний поліс онлайн.", en: "Compulsory OSAGO. Compare prices and get your e-policy online." } },
  { href: "/kasko", icon: Car, title: { uk: "КАСКО", en: "CASCO" }, desc: { uk: "Повний захист авто від ДТП, викрадення, стихії та пошкоджень.", en: "Full protection against accidents, theft, natural disasters and damage." } },
  { href: "/mini-kasko", icon: Coins, title: { uk: "Міні-КАСКО", en: "Mini-CASCO" }, desc: { uk: "Ключові ризики за доступною ціною — дешевше за повне КАСКО.", en: "Key risks at an affordable price — cheaper than full CASCO." } },
  { href: "/green-card", icon: Globe, title: { uk: "Зелена карта", en: "Green Card" }, desc: { uk: "Міжнародна автострахова для виїзду за кордон.", en: "International car insurance for trips abroad." } },
  { href: "/tourism", icon: Plane, title: { uk: "Туристичне", en: "Travel insurance" }, desc: { uk: "Медичний захист у подорожі за кордон — для віз і виїзду.", en: "Medical protection while travelling abroad — for visas and trips." } },
  { href: "/pets", icon: PawPrint, title: { uk: "Тварини", en: "Pets" }, desc: { uk: "Страхування котів і собак — ветеринарні витрати та ризики.", en: "Insurance for cats and dogs — veterinary costs and risks." } },
  { href: "/housing", icon: Home, title: { uk: "Житло", en: "Property" }, desc: { uk: "Захист квартири чи будинку — від пожежі, затоплення та інших ризиків.", en: "Protection for a flat or house — from fire, flooding and other risks." } },
  { href: "/accident", icon: HeartPulse, title: { uk: "Нещасні випадки", en: "Accident" }, desc: { uk: "Виплата при травмі чи нещасному випадку — Україна або весь світ.", en: "Payout for injury or accident — Ukraine or worldwide." } },
];

// Герой-хаб: кольоровий блок із заголовком («перелив» градієнта індиго/віолет),
// далі — білий блок із продуктами.
export function HomeHero() {
  const { t } = useI18n();
  return (
    <section className="relative overflow-hidden">
      {/* Герой — той самий темний градієнт, що й на сторінках продуктів */}
      <div
        className="relative animate-gradient pb-24 pt-32 sm:pb-28 sm:pt-40"
        style={{ backgroundImage: "linear-gradient(135deg, #06040f, #0f0c29, #1e1060, #4f46e5, #7c3aed, #1e1060, #06040f)" }}
      >
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 60% at 50% 45%, transparent 0%, rgba(0,0,0,0.12) 100%)" }} />
        <div className="relative z-10 mx-auto max-w-3xl px-4 text-center sm:px-6">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-indigo-100 ring-1 ring-white/15">
            <BadgeCheck className="h-3.5 w-3.5" /> {t({ uk: "Офіційний страховий посередник", en: "Licensed insurance intermediary" })}
          </span>
          <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl">
            {t({ uk: "Страхування онлайн", en: "Insurance online" })}
            <span className="mt-1 block bg-gradient-to-r from-indigo-300 to-violet-300 bg-clip-text text-transparent">{t({ uk: "за кілька хвилин", en: "in a few minutes" })}</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-zinc-300 sm:text-lg">
            {t({ uk: "Порівнюємо ціни 21+ страхових компаній і видаємо електронний поліс одразу на email. Автоцивілка, КАСКО, Зелена карта, туристичне, житло, тварини.", en: "We compare prices from 21+ insurers and send the e-policy straight to your email. Car, CASCO, Green Card, travel, property, pets." })}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/osago" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-7 text-base font-bold text-indigo-700 shadow-xl shadow-indigo-950/30 transition-all hover:scale-[1.02] hover:bg-indigo-50 active:scale-[0.98]">
              {t({ uk: "Розрахувати автоцивілку", en: "Get a car insurance quote" })} <ArrowRight className="h-5 w-5" />
            </Link>
            <a href="#products" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white/10 px-7 text-base font-semibold text-white ring-1 ring-white/25 backdrop-blur transition-colors hover:bg-white/20">
              {t({ uk: "Усі види страхування", en: "All insurance types" })}
            </a>
          </div>
          <ul className="mx-auto mt-10 grid max-w-2xl grid-cols-2 gap-3 text-left text-xs text-zinc-300 sm:grid-cols-4">
            {[
              { Icon: Building2, uk: "21+ страхових", en: "21+ insurers" },
              { Icon: Clock3, uk: "Поліс за 3 хвилини", en: "Policy in 3 minutes" },
              { Icon: ShieldCheck, uk: "Реєстрація в МТСБУ", en: "Registered with MTSBU" },
              { Icon: Gift, uk: "Бонус з кожної покупки", en: "Bonus on every purchase" },
            ].map(({ Icon, uk, en }) => (
              <li key={uk} className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2.5 ring-1 ring-white/10"><Icon className="h-4 w-4 shrink-0 text-indigo-300" />{t({ uk, en })}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Білий блок — продукти */}
      <div id="products" className="scroll-mt-20 bg-white pb-20 pt-14 dark:bg-zinc-900 sm:pb-24 sm:pt-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">{t({ uk: "Що застрахувати", en: "What to insure" })}</h2>
          <p className="mt-3 text-base text-zinc-500 dark:text-zinc-400">{t({ uk: "Оберіть продукт — розрахунок займе хвилину, поліс прийде на email.", en: "Pick a product — the quote takes a minute, the policy arrives by email." })}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map(({ href, icon: Icon, title, desc, badge, soon }) => {
            const inner = (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${soon ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500" : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white"}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  {badge && (
                    <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400">{t(badge)}</span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{t(title)}</h3>
                <p className="mt-1 flex-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{t(desc)}</p>
                <span className={`mt-4 flex items-center justify-end gap-1.5 text-sm font-semibold ${soon ? "text-zinc-400 dark:text-zinc-500" : "text-indigo-600 dark:text-indigo-400"}`}>
                  {soon ? t({ uk: "Незабаром", en: "Coming soon" }) : t({ uk: "Оформити", en: "Get started" })}
                  {!soon && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
                </span>
              </>
            );
            return soon ? (
              <div
                key={href}
                aria-disabled="true"
                className="group flex cursor-default flex-col rounded-2xl bg-white dark:bg-zinc-900 p-6 text-left shadow-sm ring-1 ring-zinc-200/60 dark:ring-zinc-700"
              >
                {inner}
              </div>
            ) : (
              <Link
                key={href}
                href={href}
                className="group flex flex-col rounded-2xl bg-white dark:bg-zinc-900 p-6 text-left shadow-sm ring-1 ring-zinc-200/60 dark:ring-zinc-700 transition-all duration-200 hover:shadow-lg hover:shadow-indigo-900/5 hover:ring-indigo-200 dark:hover:ring-indigo-800"
              >
                {inner}
              </Link>
            );
          })}
        </div>
        </div>
      </div>
    </section>
  );
}
