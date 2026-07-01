import Link from "next/link";
import { ShieldCheck, Car, Coins, Globe, ArrowRight, type LucideIcon } from "lucide-react";

interface Product {
  href: string;
  icon: LucideIcon;
  title: string;
  desc: string;
  badge?: string;
}

const products: Product[] = [
  {
    href: "/osago",
    icon: ShieldCheck,
    title: "Автоцивілка",
    desc: "Обовʼязкове страхування (ОСАГО). Порівняйте ціни страхових і оформіть поліс онлайн.",
    badge: "Онлайн",
  },
  {
    href: "/kasko",
    icon: Car,
    title: "КАСКО",
    desc: "Повний захист авто від ДТП з вашої вини, викрадення, стихії та пошкоджень.",
  },
  {
    href: "/mini-kasko",
    icon: Coins,
    title: "Міні-КАСКО",
    desc: "Захист від ключових ризиків за доступною ціною — дешевше за повне КАСКО.",
  },
  {
    href: "/green-card",
    icon: Globe,
    title: "Зелена карта",
    desc: "Міжнародна автострахова для виїзду за кордон. Європа, Азербайджан, Молдова.",
  },
];

export function ProductsGrid() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="mb-10 text-center">
        <h2 className="text-2xl font-bold text-zinc-900 sm:text-3xl">Оберіть продукт</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-zinc-500 sm:text-base">
          Усі види автострахування з офіційних джерел — в одному застосунку.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {products.map(({ href, icon: Icon, title, desc, badge }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 transition-colors group-hover:bg-indigo-600">
                <Icon className="h-6 w-6 text-indigo-600 transition-colors group-hover:text-white" />
              </div>
              {badge && (
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600">
                  {badge}
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-zinc-900">{title}</h3>
            <p className="mt-1 flex-1 text-sm text-zinc-500">{desc}</p>
            <span className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-indigo-600">
              Оформити
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
