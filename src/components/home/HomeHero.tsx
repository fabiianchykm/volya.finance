import Link from "next/link";
import { ShieldCheck, Car, Coins, Globe, Plane, PawPrint, ArrowRight, Clock, BadgePercent, type LucideIcon } from "lucide-react";

interface Product {
  href: string;
  icon: LucideIcon;
  title: string;
  desc: string;
  badge?: string;
}

const products: Product[] = [
  { href: "/osago", icon: ShieldCheck, title: "Автоцивілка", desc: "Обовʼязкове ОСЦПВ. Порівняйте ціни й оформіть електронний поліс онлайн." },
  { href: "/kasko", icon: Car, title: "КАСКО", desc: "Повний захист авто від ДТП, викрадення, стихії та пошкоджень." },
  { href: "/mini-kasko", icon: Coins, title: "Міні-КАСКО", desc: "Ключові ризики за доступною ціною — дешевше за повне КАСКО." },
  { href: "/green-card", icon: Globe, title: "Зелена карта", desc: "Міжнародна автострахова для виїзду за кордон." },
  { href: "/tourism", icon: Plane, title: "Туристичне", desc: "Медичний захист у подорожі за кордон — для віз і виїзду." },
  { href: "/pets", icon: PawPrint, title: "Тварини", desc: "Страхування котів і собак — ветеринарні витрати та ризики.", badge: "Скоро" },
];

// Герой-хаб: широкий меседж (не лише авто) + продукти прямо тут (скляні картки).
export function HomeHero() {
  return (
    <section
      className="relative overflow-x-hidden pb-20 pt-32 sm:pb-24 sm:pt-40 animate-gradient"
      style={{ backgroundImage: "linear-gradient(135deg, #06040f, #0f0c29, #1e1060, #4f46e5, #7c3aed, #1e1060, #06040f)" }}
    >
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 60% at 50% 42%, transparent 0%, rgba(0,0,0,0.12) 100%)" }} />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
            Страхування{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">онлайн</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-zinc-300 sm:text-lg">
            Авто, подорожі та улюбленці — усі поліси в одному місці. Оберіть продукт і оформіть за кілька хвилин.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-zinc-200">
            <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-indigo-300" /> Офіційні поліси МТСБУ</span>
            <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-indigo-300" /> Оформлення за 3 хвилини</span>
            <span className="flex items-center gap-2"><BadgePercent className="h-4 w-4 text-indigo-300" /> Найкращі ціни</span>
          </div>
        </div>

        {/* Продукти — прямо в героєві */}
        <div className="mt-12 grid gap-4 sm:mt-14 sm:grid-cols-2 lg:grid-cols-3">
          {products.map(({ href, icon: Icon, title, desc, badge }) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col rounded-2xl bg-white/[0.06] p-6 text-left ring-1 ring-white/10 backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:bg-white/[0.1] hover:ring-white/20"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-indigo-300 transition-colors group-hover:bg-indigo-500 group-hover:text-white">
                  <Icon className="h-6 w-6" />
                </div>
                {badge && (
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-indigo-200">{badge}</span>
                )}
              </div>
              <h3 className="text-lg font-bold text-white">{title}</h3>
              <p className="mt-1 flex-1 text-sm leading-relaxed text-zinc-300">{desc}</p>
              <span className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-indigo-300">
                Оформити
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
