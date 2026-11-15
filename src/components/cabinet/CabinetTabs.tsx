"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Coins, Settings, type LucideIcon } from "lucide-react";
import { useI18n, type Tr } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// Вкладки особистого кабінету: Поліси · Бонуси · Налаштування. Одні й ті самі
// посилання в шапці (меню користувача) і тут — щоб із будь-якої вкладки було
// видно решту. Активна — за поточним шляхом.
export const CABINET_TABS: { href: string; label: Tr; title: Tr; subtitle: Tr; icon: LucideIcon }[] = [
  {
    href: "/policies", icon: FileText,
    label: { uk: "Поліси", en: "Policies" },
    title: { uk: "Мої поліси", en: "My policies" },
    subtitle: { uk: "Усі оформлені поліси, привʼязані до вашого акаунта.", en: "All policies issued and linked to your account." },
  },
  {
    href: "/bonus", icon: Coins,
    label: { uk: "Бонуси", en: "Bonuses" },
    title: { uk: "Бонуси та запрошення", en: "Bonuses & referrals" },
    subtitle: { uk: "1% з кожної покупки, 5% з покупок друзів — списуються як знижка на автоцивілку.", en: "1% of each purchase and 5% of friends' purchases, redeemed as a car insurance discount." },
  },
  {
    href: "/profile", icon: Settings,
    label: { uk: "Налаштування", en: "Settings" },
    title: { uk: "Налаштування", en: "Settings" },
    subtitle: { uk: "Збережені особи для швидкого оформлення та способи входу в кабінет.", en: "Saved people for quick checkout and the ways you sign in." },
  },
];

export function CabinetTabs() {
  const { t } = useI18n();
  const pathname = usePathname();
  const active = CABINET_TABS.find((tab) => pathname === tab.href || pathname.startsWith(tab.href + "/")) ?? CABINET_TABS[0];

  return (
    <div className="mb-6">
      <h1 className="mb-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{t(active.title)}</h1>
      <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">{t(active.subtitle)}</p>
      <nav aria-label={t({ uk: "Розділи кабінету", en: "Account sections" })} className="flex gap-1 overflow-x-auto rounded-2xl bg-zinc-100 p-1 dark:bg-zinc-800/70 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CABINET_TABS.map((tab) => {
          const isActive = tab.href === active.href;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-white text-indigo-700 shadow-sm dark:bg-zinc-900 dark:text-indigo-300"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
              )}
            >
              <Icon className={cn("h-4 w-4", isActive ? "text-indigo-500" : "text-zinc-400 dark:text-zinc-500")} />
              {t(tab.label)}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
