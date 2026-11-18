"use client";

import { useState, useEffect, useRef, Fragment } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut, LogIn, FileText, Star, ChevronDown, ShieldCheck, Car, Coins, Globe, Plane, PawPrint, Home, HeartPulse, Crosshair, Route, Gift, LayoutDashboard, Settings, type LucideIcon } from "lucide-react";
import { isAdminClient } from "@/lib/admin";
import { emitNavReset } from "@/lib/nav-reset";
import { Wordmark } from "./VMark";
import { CABINET_TABS } from "@/components/cabinet/CabinetTabs";
import { cn } from "@/lib/utils";
import { useSession, signOut } from "next-auth/react";
import { useLogin } from "@/components/auth/LoginProvider";
import { useI18n } from "@/lib/i18n";

type NavItem = { label: string; labelEn: string; href: string; icon: LucideIcon; desc: string; descEn: string; badge?: string; soon?: boolean; /** Лінія-розділювач перед пунктом (не страхування, напр. сертифікат). */ divider?: boolean };

// Продукти згруповані у два дропдауни за типом страхування (майнове / особисте),
// щоб меню не розтягувалось і кожен підпункт мав зрозумілий опис.
// «Матеріальне» — авто + житло (майно).
const MATERIAL_LINKS: NavItem[] = [
  { label: "Автоцивілка", labelEn: "Car insurance (OSAGO)", href: "/osago", icon: ShieldCheck, desc: "ОСЦПВ онлайн", descEn: "OSAGO online" },
  { label: "КАСКО", labelEn: "CASCO", href: "/kasko", icon: Car, desc: "Повний захист авто", descEn: "Full protection for your car" },
  { label: "Міні-КАСКО", labelEn: "Mini-CASCO", href: "/mini-kasko", icon: Coins, desc: "Ключові ризики, дешевше", descEn: "Key risks, for less" },
  { label: "Зелена карта", labelEn: "Green Card", href: "/green-card", icon: Globe, desc: "Для виїзду за кордон", descEn: "For trips abroad" },
  { label: "Житло", labelEn: "Property", href: "/housing", icon: Home, desc: "Захист квартири чи будинку", descEn: "Protection for your flat or house" },
  { label: "Віньєтка", labelEn: "Vignette", href: "/vignette", icon: Route, desc: "Платні дороги Європи", descEn: "European toll roads", badge: "скоро", divider: true },
];
// «Особисте» — здоровʼя/подорожі/улюбленці.
const PERSONAL_LINKS: NavItem[] = [
  { label: "Туристичне", labelEn: "Travel", href: "/tourism", icon: Plane, desc: "Медичне для подорожей за кордон", descEn: "Medical cover for trips abroad" },
  { label: "Тварини", labelEn: "Pets", href: "/pets", icon: PawPrint, desc: "Страхування котів і собак", descEn: "Insurance for cats and dogs" },
  { label: "Нещасні випадки", labelEn: "Accident", href: "/accident", icon: HeartPulse, desc: "Виплата при травмі чи нещасному випадку", descEn: "Payout for injury or accident" },
  { label: "Зброя", labelEn: "Firearms", href: "/weapon", icon: Crosshair, desc: "Поліс власника для дозволу", descEn: "Owner's policy for the permit" },
  { label: "Подарунковий сертифікат", labelEn: "Gift certificate", href: "/gift", icon: Gift, desc: "Подаруйте будь-який поліс", descEn: "Give any policy as a gift", badge: "з 1 січня", divider: true },
];

// Дропдаун меню з підпунктами-описами. Керований клік/тап + hover (на планшетах
// hover нема, тож потрібен клік), закривається по кліку поза ним і по Escape.
function NavDropdown({ title, links, opaque }: { title: string; links: NavItem[]; opaque: boolean }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const ref = useRef<HTMLLIElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onEsc); };
  }, [open]);

  return (
    <li className="relative" ref={ref} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          "flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[15px] font-medium transition-colors",
          opaque
            ? cn("text-zinc-700 dark:text-zinc-200", open && "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300", "hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-700 dark:hover:text-indigo-300")
            : cn("text-white/80", open && "bg-white/10 text-white", "hover:bg-white/10 hover:text-white")
        )}
      >
        {title}
        <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", open && "rotate-180")} />
      </button>
      {/* pt-3 — місток, щоб курсор не «зривався» між кнопкою і панеллю */}
      <div
        className={cn(
          "absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3 transition-all duration-200",
          open ? "visible translate-y-0 opacity-100" : "invisible translate-y-1 opacity-0"
        )}
      >
        <div className="w-[344px] overflow-hidden rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 shadow-xl shadow-indigo-500/5 ring-1 ring-black/[0.03] dark:ring-white/10">
          {links.map(({ href, label, labelEn, icon: Icon, desc, descEn, badge, soon, divider }) => {
            const row = (
              <>
                <span className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                  soon ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500" : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 group-hover/item:bg-indigo-600 group-hover/item:text-white"
                )}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {t({ uk: label, en: labelEn })}
                    {badge && (
                      <span className="shrink-0 whitespace-nowrap rounded-full bg-indigo-100 dark:bg-indigo-950/40 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">{badge}</span>
                    )}
                  </span>
                  <span className="block truncate text-xs text-zinc-400 dark:text-zinc-500">{t({ uk: desc, en: descEn })}</span>
                </span>
              </>
            );
            const item = soon ? (
              <div aria-disabled className="flex cursor-default items-center gap-3 rounded-xl p-2.5 opacity-80">
                {row}
              </div>
            ) : (
              <Link
                href={href}
                onClick={(e) => {
                  setOpen(false);
                  // Вже на цій сторінці (напр. показані пропозиції з ?step=offers у URL) —
                  // Link зі співпадаючим pathname не завжди очищає query. Шлемо подію скидання
                  // ПЕРШОЮ (надійно, не залежить від навігації), потім чистимо URL.
                  if (href === pathname) { e.preventDefault(); emitNavReset(); router.replace(href, { scroll: true }); }
                }}
                className="group/item flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-indigo-50/70 dark:hover:bg-indigo-950/30"
              >
                {row}
              </Link>
            );
            return (
              <Fragment key={href}>
                {divider && <div className="mx-2 my-1.5 border-t border-zinc-100 dark:border-zinc-800" />}
                {item}
              </Fragment>
            );
          })}
        </div>
      </div>
    </li>
  );
}

// Розкривна група мобільного меню: заголовок із шевроном, усередині — список.
function MobileGroup({ title, subtitle, icon: Icon, avatar, open, onToggle, children, id }: {
  id: string; title: string; subtitle?: string; icon?: LucideIcon; avatar?: string | null; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-100 dark:border-zinc-800">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`mobile-group-${id}`}
        className={cn("flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors", open ? "bg-indigo-50/60 dark:bg-indigo-950/30" : "bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800/60")}
      >
        {avatar ? (
          <Image src={avatar} alt="" width={36} height={36} className="h-9 w-9 shrink-0 rounded-full" />
        ) : Icon ? (
          <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", open ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400")}>
            <Icon className="h-4.5 w-4.5" />
          </span>
        ) : null}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</span>
          {subtitle && <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</span>}
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200", open && "rotate-180 text-indigo-600 dark:text-indigo-300")} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div id={`mobile-group-${id}`} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
            <div className="border-t border-zinc-100 p-1.5 dark:border-zinc-800">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Пункти групи в мобільному меню — з іконкою, описом і бейджем, як у десктопному дропдауні.
function MobileLinks({ links }: { links: NavItem[] }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  return (
    <div className="flex flex-col gap-0.5">
      {links.map(({ href, label, labelEn, icon: Icon, desc, descEn, badge, soon, divider }) => {
        const row = (
          <>
            <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", soon ? "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500" : "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400")}>
              <Icon className="h-4.5 w-4.5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {t({ uk: label, en: labelEn })}
                {badge && <span className="shrink-0 whitespace-nowrap rounded-full bg-indigo-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300">{badge}</span>}
              </span>
              <span className="block truncate text-xs text-zinc-400 dark:text-zinc-500">{t({ uk: desc, en: descEn })}</span>
            </span>
          </>
        );
        return (
          <Fragment key={href}>
            {divider && <div className="mx-3 my-1 border-t border-zinc-100 dark:border-zinc-800" />}
            {soon ? (
              <div aria-disabled className="flex cursor-default items-center gap-3 rounded-xl px-2.5 py-2 opacity-70">{row}</div>
            ) : (
              <Link
                href={href}
                className="flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors hover:bg-indigo-50/70 dark:hover:bg-indigo-950/30"
                onClick={(e) => {
                  // Закриваємо меню через подію (меню вище по дереву), скидаємо флоу, якщо вже на сторінці.
                  window.dispatchEvent(new CustomEvent("volya:close-mobile-menu"));
                  if (href === pathname) { e.preventDefault(); emitNavReset(); router.replace(href, { scroll: true }); }
                }}
              >
                {row}
              </Link>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

export function Navbar({ solid = false }: { solid?: boolean }) {
  const { t } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileGroup, setMobileGroup] = useState<"material" | "personal" | "account" | null>(null);
  // Пункти груп (MobileLinks) закривають меню подією — вони рендеряться нижче по дереву.
  useEffect(() => {
    const close = () => setMobileOpen(false);
    window.addEventListener("volya:close-mobile-menu", close);
    return () => window.removeEventListener("volya:close-mobile-menu", close);
  }, []);
  const [scrolled, setScrolled] = useState(false);
  const { data: session, status } = useSession();
  const { open: openLogin } = useLogin();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isLoading = status === "loading";
  // «Непрозорий» (світлий) стиль навбара: при скролі АБО коли під ним світлий фон
  // (напр. екран пропозицій), щоб лого/меню не зливались із фоном.
  const opaque = scrolled || solid;

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-40 transition-all duration-500",
        opaque
          ? "bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-100 dark:border-zinc-800 shadow-sm"
          : "bg-white/5 backdrop-blur-md border-b border-white/10"
      )}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center" aria-label="VOLYA.finance">
          <Wordmark
            id="vmark-nav"
            className={cn("text-[1.55rem] transition-colors duration-300", opaque ? "text-zinc-900 dark:text-zinc-100" : "text-white")}
            accentClassName={opaque ? "text-indigo-600 dark:text-indigo-400" : "text-indigo-300"}
          />
        </Link>

        <ul className="hidden items-center gap-0.5 md:flex">
          <NavDropdown title={t({ uk: "Матеріальне страхування", en: "Property insurance" })} links={MATERIAL_LINKS} opaque={opaque} />
          <NavDropdown title={t({ uk: "Особисте страхування", en: "Personal insurance" })} links={PERSONAL_LINKS} opaque={opaque} />
        </ul>

        <div className="hidden items-center gap-3 md:flex">
          {isLoading ? (
            <div className="h-9 w-24 animate-pulse rounded-xl bg-white/20" />
          ) : session?.user ? (
            <UserMenu scrolled={opaque} user={session.user} />
          ) : (
            <button
              type="button"
              onClick={() => openLogin()}
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                opaque
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/25 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                  : "bg-white/10 text-white ring-1 ring-white/30 backdrop-blur hover:bg-white/20"
              )}
            >
              <LogIn className="h-4 w-4" />
              {t({ uk: "Увійти", en: "Sign in" })}
            </button>
          )}
        </div>

        <button
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg border transition-colors md:hidden",
            opaque
              ? "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
              : "border-white/20 text-white hover:bg-white/10"
          )}
          onClick={() => setMobileOpen((o) => !o)}
          aria-label={t({ uk: "Меню", en: "Menu" })}
          aria-expanded={mobileOpen}
          aria-haspopup="menu"
        >
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 md:hidden"
          >
            {/* Шапка fixed, тож меню довше за екран не прокрутити разом зі сторінкою —
                даємо панелі власний скрол у межах видимої висоти (dvh враховує панель Safari). */}
            <div className="flex max-h-[calc(100dvh-4.25rem)] flex-col gap-2 overflow-y-auto overscroll-contain px-4 py-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              {/* Групи продуктів — розкривні списки (як дропдауни на десктопі). */}
              <MobileGroup
                id="material"
                title={t({ uk: "Матеріальне страхування", en: "Property insurance" })}
                icon={ShieldCheck}
                open={mobileGroup === "material"}
                onToggle={() => setMobileGroup((g) => (g === "material" ? null : "material"))}
              >
                <MobileLinks links={MATERIAL_LINKS} />
              </MobileGroup>
              <MobileGroup
                id="personal"
                title={t({ uk: "Особисте страхування", en: "Personal insurance" })}
                icon={HeartPulse}
                open={mobileGroup === "personal"}
                onToggle={() => setMobileGroup((g) => (g === "personal" ? null : "personal"))}
              >
                <MobileLinks links={PERSONAL_LINKS} />
              </MobileGroup>

              {/* Профіль — окремий розкривний рядок з пунктами кабінету; гостю — кнопка входу. */}
              {session?.user ? (
                <MobileGroup
                  id="account"
                  title={session.user.name || session.user.email || t({ uk: "Мій кабінет", en: "My account" })}
                  subtitle={session.user.name && session.user.email ? session.user.email : t({ uk: "Поліси, бонуси, відгуки, налаштування", en: "Policies, bonuses, reviews, settings" })}
                  avatar={session.user.image ?? null}
                  open={mobileGroup === "account"}
                  onToggle={() => setMobileGroup((g) => (g === "account" ? null : "account"))}
                >
                  <div className="flex flex-col gap-0.5">
                    {CABINET_TABS.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <Link key={tab.href} href={tab.href} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800/60">
                          <Icon className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />{t(tab.label)}
                        </Link>
                      );
                    })}
                    {isAdminClient(session?.user?.email) && (
                      <Link href="/admin/funnel" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-indigo-700 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-950/40">
                        <LayoutDashboard className="h-4 w-4" />{t({ uk: "Адмінка", en: "Admin" })}
                      </Link>
                    )}
                    <button type="button" onClick={() => signOut({ callbackUrl: "/" })} className="mt-1 flex items-center gap-3 rounded-xl border-t border-zinc-100 px-3 pb-1 pt-3 text-sm font-medium text-zinc-500 hover:text-red-600 dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-red-400">
                      <LogOut className="h-4 w-4" />{t({ uk: "Вийти", en: "Sign out" })}
                    </button>
                  </div>
                </MobileGroup>
              ) : (
                <button
                  type="button"
                  onClick={() => { setMobileOpen(false); openLogin(); }}
                  className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all active:scale-[0.99]"
                >
                  <LogIn className="h-4 w-4" />
                  {t({ uk: "Увійти", en: "Sign in" })}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function UserMenu({
  scrolled,
  user,
}: {
  scrolled: boolean;
  user: { name?: string | null; image?: string | null; email?: string | null };
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          "flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium transition-colors",
          scrolled
            ? "text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            : "text-white hover:bg-white/10"
        )}
      >
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name ?? ""}
            width={28}
            height={28}
            className="rounded-full"
          />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs text-white font-bold">
            {user.name?.[0]?.toUpperCase() ?? "U"}
          </div>
        )}
        <span>{user.name?.split(" ")[0]}</span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 top-full z-20 mt-2 w-52 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-1.5 shadow-lg"
            >
              <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800 mb-1">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{user.name}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{user.email}</p>
              </div>
              <Link
                href="/policies"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
              >
                <FileText className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                {t({ uk: "Мої поліси", en: "My policies" })}
              </Link>
              <Link
                href="/bonus"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
              >
                <Coins className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                {t({ uk: "Бонуси", en: "Bonuses" })}
              </Link>
              <Link
                href="/reviews"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
              >
                <Star className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                {t({ uk: "Відгуки", en: "Reviews" })}
              </Link>
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
              >
                <Settings className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                {t({ uk: "Налаштування", en: "Settings" })}
              </Link>
              {isAdminClient(user.email) && (
                <Link
                  href="/admin/funnel"
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  {t({ uk: "Адмінка", en: "Admin" })}
                </Link>
              )}
              <button
                onClick={() => { setOpen(false); signOut(); }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
              >
                <LogOut className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                {t({ uk: "Вийти", en: "Sign out" })}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
