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
  { href: "#", icon: Home, title: "Житло", desc: "Захист квартири чи будинку — від пожежі, затоплення та інших ризиків.", badge: "Скоро", soon: true },
];

// Герой-хаб: широкий меседж (не лише авто) + продукти прямо тут. Світла тема.
export function HomeHero() {
  return (
    <section className="relative overflow-hidden bg-[#FAFAFA] pb-20 pt-32 sm:pb-24 sm:pt-40">
      {/* Мʼякі світні акценти для «дорогого» відчуття на світлому фоні */}
      <div className="pointer-events-none absolute -top-32 left-1/3 h-80 w-[46rem] -translate-x-1/2 rounded-full bg-indigo-200/40 blur-3xl" />
      <div className="pointer-events-none absolute top-10 right-0 h-72 w-[40rem] translate-x-1/3 rounded-full bg-violet-200/40 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-zinc-900 sm:text-5xl md:text-6xl">
            Страхування{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">онлайн</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-zinc-500 sm:text-lg">
            Авто, подорожі та улюбленці — усі поліси в одному місці. Оберіть продукт і оформіть за кілька хвилин.
          </p>
        </div>

        {/* Продукти — прямо в героєві */}
        <div className="mt-12 grid gap-4 sm:mt-14 sm:grid-cols-2 lg:grid-cols-3">
          {products.map(({ href, icon: Icon, title, desc, badge, soon }) => {
            const inner = (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${soon ? "bg-zinc-100 text-zinc-400" : "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white"}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  {badge && (
                    <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-600">{badge}</span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-zinc-900">{title}</h3>
                <p className="mt-1 flex-1 text-sm leading-relaxed text-zinc-500">{desc}</p>
                <span className={`mt-4 flex items-center justify-end gap-1.5 text-sm font-semibold ${soon ? "text-zinc-400" : "text-indigo-600"}`}>
                  {soon ? "Незабаром" : "Оформити"}
                  {!soon && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
                </span>
              </>
            );
            return soon ? (
              <div
                key={title}
                aria-disabled="true"
                className="group flex cursor-default flex-col rounded-2xl bg-white p-6 text-left shadow-sm ring-1 ring-zinc-200/60"
              >
                {inner}
              </div>
            ) : (
              <Link
                key={href}
                href={href}
                className="group flex flex-col rounded-2xl bg-white p-6 text-left shadow-sm ring-1 ring-zinc-200/60 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-900/5 hover:ring-indigo-100"
              >
                {inner}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
