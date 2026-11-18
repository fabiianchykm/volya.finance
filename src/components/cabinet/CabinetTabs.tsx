"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { FileText, Coins, Star, Settings, LogOut, type LucideIcon } from "lucide-react";
import { useI18n, type Tr } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// Навігація кабінету: Поліси · Бонуси · Відгуки · Налаштування. На десктопі —
// бічне меню ліворуч (CabinetSidebar), на мобільному — горизонтальні вкладки
// (CabinetTabs). Заголовок активного розділу — CabinetHeading. Ті самі посилання
// є в меню користувача в шапці. Активний пункт — за поточним шляхом.
export const CABINET_TABS: { href: string; label: Tr; short?: Tr; title: Tr; subtitle: Tr; icon: LucideIcon }[] = [
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
    href: "/reviews", icon: Star,
    label: { uk: "Відгуки", en: "Reviews" },
    title: { uk: "Мої відгуки", en: "My reviews" },
    subtitle: { uk: "Оцініть страхові, поліси яких ви купили, і керуйте своїми відгуками.", en: "Rate the insurers whose policies you bought and manage your reviews." },
  },
  {
    href: "/profile", icon: Settings,
    label: { uk: "Налаштування", en: "Settings" },
    short: { uk: "Профіль", en: "Profile" },
    title: { uk: "Налаштування", en: "Settings" },
    subtitle: { uk: "Збережені особи для швидкого оформлення та способи входу в кабінет.", en: "Saved people for quick checkout and the ways you sign in." },
  },
];

function useActiveTab() {
  const pathname = usePathname();
  return CABINET_TABS.find((tab) => pathname === tab.href || pathname.startsWith(tab.href + "/")) ?? CABINET_TABS[0];
}

/** Заголовок і підзаголовок активного розділу. */
export function CabinetHeading() {
  const { t } = useI18n();
  const active = useActiveTab();
  return (
    <div className="mb-6">
      <h1 className="mb-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{t(active.title)}</h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{t(active.subtitle)}</p>
    </div>
  );
}

/** Бічне меню (десктоп): картка з профілем, пунктами розділів і виходом. */
export function CabinetSidebar() {
  const { t } = useI18n();
  const { data: session } = useSession();
  const active = useActiveTab();
  const user = session?.user;
  const name = user?.name || user?.email || t({ uk: "Мій кабінет", en: "My account" });
  const initial = (user?.name || user?.email || "V").trim().charAt(0).toUpperCase();

  return (
    <nav aria-label={t({ uk: "Розділи кабінету", en: "Account sections" })} className="sticky top-24 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className="mb-3 flex items-center gap-3 border-b border-zinc-100 px-2 pb-3 dark:border-zinc-800">
        {user?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.image} alt="" width={40} height={40} className="h-10 w-10 shrink-0 rounded-full" />
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">{initial}</span>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{name}</p>
          {user?.email && user?.name && <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{user.email}</p>}
        </div>
      </div>

      <ul className="space-y-0.5">
        {CABINET_TABS.map((tab) => {
          const isActive = tab.href === active.href;
          const Icon = tab.icon;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-indigo-600 dark:text-indigo-300" : "text-zinc-400 dark:text-zinc-500")} />
                {t(tab.label)}
              </Link>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="mt-3 flex w-full items-center gap-3 rounded-xl border-t border-zinc-100 px-3 pb-1 pt-3 text-sm font-medium text-zinc-500 transition-colors hover:text-red-600 dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-red-400"
      >
        <LogOut className="h-4 w-4" />
        {t({ uk: "Вийти", en: "Sign out" })}
      </button>
    </nav>
  );
}

/** Горизонтальні вкладки (мобільний і планшет). */
export function CabinetTabs() {
  const { t } = useI18n();
  const active = useActiveTab();

  return (
    <nav aria-label={t({ uk: "Розділи кабінету", en: "Account sections" })} className="mb-6 flex gap-1 overflow-x-auto rounded-2xl bg-zinc-100 p-1 dark:bg-zinc-800/70 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {CABINET_TABS.map((tab) => {
        const isActive = tab.href === active.href;
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-2 py-2 text-[13px] font-medium transition-colors sm:gap-2 sm:px-3 sm:text-sm",
              isActive
                ? "bg-white text-indigo-700 shadow-sm dark:bg-zinc-900 dark:text-indigo-300"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
            )}
          >
            <Icon className={cn("h-4 w-4", isActive ? "text-indigo-500" : "text-zinc-400 dark:text-zinc-500")} />
            <span className="sm:hidden">{t(tab.short ?? tab.label)}</span>
            <span className="hidden sm:inline">{t(tab.label)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
