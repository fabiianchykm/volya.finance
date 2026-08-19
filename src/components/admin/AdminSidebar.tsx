"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calculator, Users, Star, Filter } from "lucide-react";

const ITEMS = [
  { href: "/admin/funnel", label: "Воронка", Icon: Filter },
  { href: "/admin/calculations", label: "Прорахунки", Icon: Calculator },
  { href: "/admin/leads", label: "Ліди", Icon: Users },
  { href: "/admin/reviews", label: "Відгуки", Icon: Star },
];

// Бічне меню адмінки. На десктопі — вертикальна колонка ліворуч; на мобільному —
// горизонтальний ряд, що прокручується.
export function AdminSidebar() {
  const path = usePathname();
  return (
    <aside className="shrink-0 lg:w-52">
      <p className="mb-3 hidden px-2 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500 lg:block">Адмінка</p>
      <nav className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:pb-0">
        {ITEMS.map(({ href, label, Icon }) => {
          const active = path === href || path.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-zinc-600 hover:bg-white hover:text-indigo-600 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-indigo-400"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
