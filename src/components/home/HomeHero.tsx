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

// Герой-хаб: широкий меседж (не лише авто) + продукти прямо тут. Середній тон із
// «переливом» кольору (анімований градієнт індиго/віолет) — не надто темний.
export function HomeHero() {
  return (
    <section
      className="relative overflow-hidden pb-20 pt-32 sm:pb-24 sm:pt-40 animate-gradient"
      style={{ backgroundImage: "linear-gradient(135deg, #1e1b4b, #312e81, #4f46e5, #7c3aed, #6d28d9, #312e81, #1e1b4b)" }}
    >
      {/* Легка глибина по краях, щоб текст/навбар читались */}
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 75% 60% at 50% 30%, transparent 0%, rgba(0,0,0,0.18) 100%)" }} />
      {/* Нижня частина переливається у білий — під нею картки продуктів */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%]" style={{ background: "linear-gradient(to bottom, transparent 0%, #ffffff 55%, #ffffff 100%)" }} />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
            Страхування{" "}
            <span className="bg-gradient-to-r from-indigo-200 to-violet-200 bg-clip-text text-transparent">онлайн</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-indigo-100/80 sm:text-lg">
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
