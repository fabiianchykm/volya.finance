import Link from "next/link";
import { ShieldCheck, Car, Coins, Globe, Plane, PawPrint, Home, ArrowRight, type LucideIcon } from "lucide-react";

interface Product {
  href: string;
  icon: LucideIcon;
  title: string;
  desc: string;
  badge?: string;
  soon?: boolean;   // ще не запущено — картка некликабельна
}

const products: Product[] = [
  { href: "/osago", icon: ShieldCheck, title: "Автоцивілка", desc: "Обовʼязкове ОСЦПВ. Порівняйте ціни й оформіть електронний поліс онлайн." },
  { href: "/kasko", icon: Car, title: "КАСКО", desc: "Повний захист авто від ДТП, викрадення, стихії та пошкоджень." },
  { href: "/mini-kasko", icon: Coins, title: "Міні-КАСКО", desc: "Ключові ризики за доступною ціною — дешевше за повне КАСКО." },
  { href: "/green-card", icon: Globe, title: "Зелена карта", desc: "Міжнародна автострахова для виїзду за кордон." },
  { href: "/tourism", icon: Plane, title: "Туристичне", desc: "Медичний захист у подорожі за кордон — для віз і виїзду." },
  { href: "/pets", icon: PawPrint, title: "Тварини", desc: "Страхування котів і собак — ветеринарні витрати та ризики." },
  { href: "/housing", icon: Home, title: "Житло", desc: "Захист квартири чи будинку — від пожежі, затоплення та інших ризиків." },
];

// Герой-хаб: кольоровий блок із заголовком («перелив» градієнта індиго/віолет),
// далі — білий блок із продуктами.
export function HomeHero() {
  return (
    <section className="relative overflow-hidden">
      {/* Кольоровий блок — заголовок «Страхування онлайн» */}
      <div
        className="relative animate-gradient pb-20 pt-32 sm:pb-24 sm:pt-40"
        style={{ backgroundImage: "linear-gradient(135deg, #1e1060, #4f46e5, #7c3aed, #4f46e5, #1e1060)" }}
      >
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 60% at 50% 45%, transparent 0%, rgba(0,0,0,0.12) 100%)" }} />
        <div className="relative z-10 mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
            Страхування{" "}
            <span className="bg-gradient-to-r from-indigo-200 to-violet-200 bg-clip-text text-transparent">онлайн</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-indigo-100 sm:text-lg">
            Авто, подорожі та улюбленці — усі поліси в одному місці. Оберіть продукт і оформіть за кілька хвилин.
          </p>
        </div>
      </div>

      {/* Білий блок — продукти */}
      <div className="bg-white dark:bg-zinc-900 pb-20 pt-12 sm:pb-24 sm:pt-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map(({ href, icon: Icon, title, desc, badge, soon }) => {
            const inner = (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${soon ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500" : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white"}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  {badge && (
                    <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400">{badge}</span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{title}</h3>
                <p className="mt-1 flex-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{desc}</p>
                <span className={`mt-4 flex items-center justify-end gap-1.5 text-sm font-semibold ${soon ? "text-zinc-400 dark:text-zinc-500" : "text-indigo-600 dark:text-indigo-400"}`}>
                  {soon ? "Незабаром" : "Оформити"}
                  {!soon && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
                </span>
              </>
            );
            return soon ? (
              <div
                key={title}
                aria-disabled="true"
                className="group flex cursor-default flex-col rounded-2xl bg-white dark:bg-zinc-900 p-6 text-left shadow-sm ring-1 ring-zinc-200/60 dark:ring-zinc-700"
              >
                {inner}
              </div>
            ) : (
              <Link
                key={href}
                href={href}
                className="group flex flex-col rounded-2xl bg-white dark:bg-zinc-900 p-6 text-left shadow-sm ring-1 ring-zinc-200/60 dark:ring-zinc-700 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-900/5 hover:ring-indigo-100 dark:hover:ring-indigo-900"
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
