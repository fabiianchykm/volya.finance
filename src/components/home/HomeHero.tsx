"use client";

import Link from "next/link";
import { ShieldCheck, Car, Coins, Globe, Plane, PawPrint, Home, HeartPulse, Gift, Crosshair, Route, ArrowRight, ChevronRight, Clock3, Building2, type LucideIcon } from "lucide-react";
import { useI18n, type Tr } from "@/lib/i18n";

// Головна: темний герой (той самий градієнт, що й на сторінках продуктів) і «бенто»
// продуктів: три популярні — великими картками з власним відтінком, решта — компактним
// списком. Жодних стокових ілюстрацій: великий контурний значок продукту + мʼяке світло.

interface Featured {
  href: string;
  icon: LucideIcon;
  title: Tr;
  desc: Tr;
  chips: Tr[];
  bg: string;   // градієнт картки
}

const FEATURED: Featured[] = [
  {
    href: "/osago", icon: Car,
    title: { uk: "Автоцивілка", en: "Car insurance (OSAGO)" },
    desc: { uk: "Порівняйте ціни 21+ страхових за номером авто й отримайте електронний поліс на email за кілька хвилин.", en: "Compare 21+ insurers by plate number and get an e-policy by email in minutes." },
    chips: [{ uk: "Поліс за 3 хвилини", en: "Policy in 3 minutes" }],
    bg: "linear-gradient(135deg, #1e1b4b 0%, #4338ca 55%, #6366f1 100%)",
  },
  {
    href: "/tourism", icon: Plane,
    title: { uk: "Туристичне", en: "Travel insurance" },
    desc: { uk: "Медичний захист у подорожі — для віз і спокійного відпочинку.", en: "Medical cover abroad — for visas and worry-free trips." },
    chips: [{ uk: "Шенген і весь світ", en: "Schengen & worldwide" }],
    bg: "linear-gradient(135deg, #0c4a6e 0%, #0369a1 50%, #4f46e5 100%)",
  },
  {
    href: "/green-card", icon: Globe,
    title: { uk: "Зелена карта", en: "Green Card" },
    desc: { uk: "Міжнародна автоцивілка для виїзду за кордон — за номером авто.", en: "International car insurance for trips abroad — by plate number." },
    chips: [],
    bg: "linear-gradient(135deg, #2e1065 0%, #6d28d9 55%, #a78bfa 100%)",
  },
];

const MORE: { href: string; icon: LucideIcon; title: Tr; desc: Tr; badge?: Tr }[] = [
  { href: "/kasko", icon: ShieldCheck, title: { uk: "КАСКО", en: "CASCO" }, desc: { uk: "Повний захист авто від ДТП, викрадення, стихії", en: "Full cover: accidents, theft, natural disasters" } },
  { href: "/mini-kasko", icon: Coins, title: { uk: "Міні-КАСКО", en: "Mini-CASCO" }, desc: { uk: "Ключові ризики за доступною ціною", en: "Key risks at an affordable price" } },
  { href: "/vignette", icon: Route, title: { uk: "Віньєтка", en: "Vignette" }, desc: { uk: "Платні дороги Європи за номером авто", en: "European toll roads by plate number" }, badge: { uk: "скоро", en: "soon" } },
  { href: "/housing", icon: Home, title: { uk: "Житло", en: "Property" }, desc: { uk: "Квартира чи будинок — від пожежі й затоплення", en: "Flat or house — fire, flooding and more" } },
  { href: "/pets", icon: PawPrint, title: { uk: "Тварини", en: "Pets" }, desc: { uk: "Ветеринарні витрати для котів і собак", en: "Vet costs for cats and dogs" } },
  { href: "/accident", icon: HeartPulse, title: { uk: "Нещасні випадки", en: "Accident" }, desc: { uk: "Виплата при травмі — від 159 грн на рік", en: "Payout for injury — from UAH 159 a year" } },
  { href: "/weapon", icon: Crosshair, title: { uk: "Зброя", en: "Firearms" }, desc: { uk: "Поліс власника зброї для дозволу — від 100 грн", en: "Owner's liability policy for the permit — from UAH 100" } },
  { href: "/gift", icon: Gift, title: { uk: "Подарунковий сертифікат", en: "Gift certificate" }, desc: { uk: "Подаруйте будь-який поліс", en: "Give any policy as a gift" }, badge: { uk: "з 1 січня", en: "from 1 Jan" } },
];

export function HomeHero() {
  const { t } = useI18n();
  return (
    <section className="relative overflow-hidden">
      {/* Герой */}
      <div
        className="relative animate-gradient pb-16 pt-32 sm:pb-20 sm:pt-40"
        style={{ backgroundImage: "linear-gradient(135deg, #06040f, #0f0c29, #1e1060, #4f46e5, #7c3aed, #1e1060, #06040f)" }}
      >
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 60% at 50% 45%, transparent 0%, rgba(0,0,0,0.12) 100%)" }} />
        <div className="relative z-10 mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl">
            {t({ uk: "Страхування онлайн", en: "Insurance online" })}
            <span className="mt-1 block bg-gradient-to-r from-indigo-300 to-violet-300 bg-clip-text text-transparent">{t({ uk: "за кілька хвилин", en: "in a few minutes" })}</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-zinc-300 sm:text-lg">
            {t({ uk: "Порівнюємо ціни страхових компаній, видаємо електронний поліс одразу на email і зберігаємо його в кабінеті.", en: "We compare insurers' prices, send the e-policy straight to your email and keep it in your account." })}
          </p>
          <ul className="mx-auto mt-8 flex flex-wrap justify-center gap-2 text-xs text-zinc-200">
            {[
              { Icon: Building2, uk: "21+ страхових", en: "21+ insurers" },
              { Icon: Clock3, uk: "Поліс за 3 хвилини", en: "Policy in 3 minutes" },
              { Icon: ShieldCheck, uk: "Реєстрація в МТСБУ", en: "Registered with MTSBU" },
              { Icon: Gift, uk: "Бонус з кожної покупки", en: "Bonus on every purchase" },
            ].map(({ Icon, uk, en }) => (
              <li key={uk} className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3.5 py-2 ring-1 ring-white/10"><Icon className="h-4 w-4 shrink-0 text-indigo-300" />{t({ uk, en })}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Продукти: бенто популярних + компактна решта. Трохи «наїжджає» на герой. */}
      <div id="products" className="scroll-mt-20 bg-white pb-20 dark:bg-zinc-900 sm:pb-24">
        <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 sm:pt-14">
          <div className="grid gap-4 lg:grid-cols-3 lg:grid-rows-2">
            {FEATURED.map((f, i) => <FeaturedCard key={f.href} f={f} big={i === 0} />)}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {MORE.map(({ href, icon: Icon, title, desc, badge }) => (
              <Link
                key={href}
                href={href}
                className={`group flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/70 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-900/5 hover:ring-indigo-200 dark:bg-zinc-900 dark:ring-zinc-700 dark:hover:ring-indigo-800 ${
                  href === "/gift" ? "lg:col-span-2 bg-gradient-to-r from-indigo-50 via-white to-violet-50 dark:from-indigo-950/30 dark:via-zinc-900 dark:to-violet-950/30" : ""
                }`}
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-950/40 dark:text-indigo-400">
                  <Icon className="h-6 w-6" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-[15px] font-bold leading-snug text-zinc-900 dark:text-zinc-100">{t(title)}</span>
                    {badge && <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300">{t(badge)}</span>}
                  </span>
                  <span className="mt-0.5 line-clamp-2 block text-sm leading-snug text-zinc-500 dark:text-zinc-400">{t(desc)}</span>
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 text-zinc-300 transition-all group-hover:translate-x-0.5 group-hover:text-indigo-500" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// Велика картка популярного продукту: градієнт свого відтінку, чипи-факти, великий
// контурний значок замість ілюстрації, кнопка «Оформити».
function FeaturedCard({ f, big }: { f: Featured; big: boolean }) {
  const { t } = useI18n();
  const Icon = f.icon;
  return (
    <Link
      href={f.href}
      className={`group relative flex overflow-hidden rounded-3xl p-6 text-white shadow-xl shadow-indigo-950/15 ring-1 ring-white/10 transition-transform hover:-translate-y-0.5 sm:p-7 ${big ? "min-h-[300px] flex-col justify-between lg:col-span-2 lg:row-span-2 lg:min-h-0 lg:p-10" : "min-h-[200px] flex-col justify-between"}`}
      style={{ backgroundImage: f.bg }}
    >
      <span className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
      <span className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-black/20 blur-3xl" />
      <Icon className={`pointer-events-none absolute text-white/10 transition-transform duration-500 group-hover:scale-105 group-hover:text-white/15 ${big ? "-bottom-10 -right-6 h-72 w-72 sm:h-80 sm:w-80" : "-bottom-6 -right-6 h-40 w-40"}`} strokeWidth={0.9} />

      <span className="relative block">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/80 ring-1 ring-white/15">
          {t({ uk: "Популярне", en: "Popular" })}
        </span>
        <span className={`mt-4 block font-bold leading-tight tracking-tight ${big ? "text-3xl sm:text-4xl lg:text-5xl" : "text-2xl"}`}>{t(f.title)}</span>
        <span className={`mt-2 block text-white/80 ${big ? "max-w-md text-base sm:text-lg" : "max-w-xs text-sm"}`}>{t(f.desc)}</span>
      </span>

      <span className="relative mt-6 flex flex-wrap items-center gap-2">
        {f.chips.map((c) => (
          <span key={c.uk} className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur ring-1 ring-white/15">{t(c)}</span>
        ))}
        <span className={`ml-auto inline-flex items-center gap-2 rounded-xl bg-white font-bold text-indigo-700 shadow-lg shadow-black/10 transition-colors group-hover:bg-indigo-50 ${big ? "h-12 px-6 text-base" : "h-10 px-4 text-sm"}`}>
          {big ? t({ uk: "Оформити", en: "Get started" }) : <ArrowRight className="h-4 w-4" />}
          {big && <ArrowRight className="h-5 w-5" />}
        </span>
      </span>
    </Link>
  );
}
