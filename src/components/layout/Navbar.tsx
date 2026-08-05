"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut, LogIn, FileText, ChevronDown, ShieldCheck, Car, Coins, Globe, Plane, PawPrint } from "lucide-react";
import { VMark, BarlessA } from "./VMark";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useSession, signOut } from "next-auth/react";
import { useLogin } from "@/components/auth/LoginProvider";

// Авто-продукти згруповані в дропдаун «Автострахування», щоб меню не розтягувалось.
const AUTO_LINKS = [
  { label: "Автоцивілка", href: "/osago", icon: ShieldCheck, desc: "ОСЦПВ" },
  { label: "КАСКО", href: "/kasko", icon: Car, desc: "Повний захист авто" },
  { label: "Міні-КАСКО", href: "/mini-kasko", icon: Coins, desc: "Ключові ризики, дешевше" },
  { label: "Зелена карта", href: "/green-card", icon: Globe, desc: "Для виїзду за кордон" },
];
const OTHER_LINKS = [
  { label: "Туристичне", href: "/tourism", icon: Plane, badge: undefined as string | undefined },
  { label: "Тварини", href: "/pets", icon: PawPrint, badge: "скоро" },
];
// Плаский список для мобільного меню (там ширини вистачає).
const navLinks = [...AUTO_LINKS, ...OTHER_LINKS];

export function Navbar({ solid = false }: { solid?: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  // Дропдаун «Автострахування» — керований (клік/тап + hover), бо на планшетах
  // немає hover і суто CSS group-hover не спрацьовував.
  const [autoOpen, setAutoOpen] = useState(false);
  const autoRef = useRef<HTMLLIElement>(null);
  const { data: session, status } = useSession();
  const { open: openLogin } = useLogin();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Закриваємо дропдаун по кліку поза ним та по Escape.
  useEffect(() => {
    if (!autoOpen) return;
    const onDown = (e: MouseEvent) => { if (autoRef.current && !autoRef.current.contains(e.target as Node)) setAutoOpen(false); };
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setAutoOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onEsc); };
  }, [autoOpen]);

  const isLoading = status === "loading";
  // «Непрозорий» (світлий) стиль навбара: при скролі АБО коли під ним світлий фон
  // (напр. екран пропозицій), щоб лого/меню не зливались із фоном.
  const opaque = scrolled || solid;

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-40 transition-all duration-500",
        opaque
          ? "bg-white/95 backdrop-blur-md border-b border-zinc-100 shadow-sm"
          : "bg-white/5 backdrop-blur-md border-b border-white/10"
      )}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-1">
          <VMark id="vmark-nav" className="h-9 w-9" />
          <span
            className={cn(
              "text-2xl font-medium uppercase tracking-[0.2em] transition-colors duration-300",
              opaque ? "text-zinc-900" : "text-white"
            )}
          >
            OLY<BarlessA className="inline-block h-[0.72em] w-auto align-baseline" />
            <span className={cn("text-[0.7em] font-semibold normal-case tracking-normal", opaque ? "text-indigo-600" : "text-indigo-300")}>.finance</span>
          </span>
        </Link>

        <ul className="hidden items-center gap-0.5 md:flex">
          {/* Дропдаун «Автострахування» — керований клік/тап + hover */}
          <li
            className="relative"
            ref={autoRef}
            onMouseEnter={() => setAutoOpen(true)}
            onMouseLeave={() => setAutoOpen(false)}
          >
            <button
              type="button"
              onClick={() => setAutoOpen((o) => !o)}
              aria-expanded={autoOpen}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[15px] font-medium transition-colors",
                opaque
                  ? cn("text-zinc-700", autoOpen && "bg-indigo-50 text-indigo-700", "hover:bg-indigo-50 hover:text-indigo-700")
                  : cn("text-white/80", autoOpen && "bg-white/10 text-white", "hover:bg-white/10 hover:text-white")
              )}
            >
              Автострахування
              <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", autoOpen && "rotate-180")} />
            </button>
            {/* pt-3 — місток, щоб курсор не «зривався» між кнопкою і панеллю */}
            <div
              className={cn(
                "absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3 transition-all duration-200",
                autoOpen ? "visible translate-y-0 opacity-100" : "invisible translate-y-1 opacity-0"
              )}
            >
              <div className="w-[320px] overflow-hidden rounded-2xl border border-zinc-100 bg-white p-2 shadow-xl shadow-indigo-500/5 ring-1 ring-black/[0.03]">
                {AUTO_LINKS.map(({ href, label, icon: Icon, desc }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setAutoOpen(false)}
                    className="group/item flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-indigo-50/70"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover/item:bg-indigo-600 group-hover/item:text-white">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-zinc-900">{label}</span>
                      <span className="block truncate text-xs text-zinc-400">{desc}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </li>

          {OTHER_LINKS.map(({ href, label, icon: Icon, badge }) => (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[15px] font-medium transition-colors",
                  opaque
                    ? "text-zinc-700 hover:bg-indigo-50 hover:text-indigo-700"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4 opacity-80" />
                {label}
                {badge && (
                  <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-indigo-600">{badge}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 md:flex">
          {isLoading ? (
            <div className="h-9 w-24 animate-pulse rounded-xl bg-white/20" />
          ) : session?.user ? (
            <UserMenu scrolled={opaque} user={session.user} />
          ) : (
            <Button
              size="md"
              variant="primary"
              className={cn(
                "flex items-center gap-2",
                !opaque ? "bg-white text-indigo-700 hover:bg-white/90 shadow-none" : ""
              )}
              onClick={() => openLogin()}
            >
              <LogIn className="h-4 w-4" />
              Увійти
            </Button>
          )}
        </div>

        <button
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg border transition-colors md:hidden",
            opaque
              ? "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              : "border-white/20 text-white hover:bg-white/10"
          )}
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Toggle menu"
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
            className="overflow-hidden border-t border-zinc-100 bg-white md:hidden"
          >
            <div className="flex flex-col gap-1 px-4 py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                  {(link as { badge?: string }).badge && (
                    <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-indigo-600">{(link as { badge?: string }).badge}</span>
                  )}
                </Link>
              ))}
              <div className="mt-3 border-t border-zinc-100 pt-3">
                {session?.user ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3 px-1 py-1">
                      {session.user.image && (
                        <Image
                          src={session.user.image}
                          alt={session.user.name ?? ""}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      )}
                      <span className="text-sm font-medium text-zinc-800">{session.user.name}</span>
                    </div>
                    <Link
                      href="/policies"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                    >
                      <FileText className="h-4 w-4 text-zinc-400" />
                      Мої поліси
                    </Link>
                    <Button
                      size="md"
                      variant="outline"
                      className="w-full flex items-center gap-2"
                      onClick={() => signOut()}
                    >
                      <LogOut className="h-4 w-4" />
                      Вийти
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="md"
                    variant="primary"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => { setMobileOpen(false); openLogin(); }}
                  >
                    <LogIn className="h-4 w-4" />
                    Увійти
                  </Button>
                )}
              </div>
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
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium transition-colors",
          scrolled
            ? "text-zinc-700 hover:bg-zinc-100"
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
              className="absolute right-0 top-full z-20 mt-2 w-52 rounded-xl border border-zinc-100 bg-white p-1.5 shadow-lg"
            >
              <div className="px-3 py-2 border-b border-zinc-100 mb-1">
                <p className="text-sm font-medium text-zinc-900">{user.name}</p>
                <p className="text-xs text-zinc-500 truncate">{user.email}</p>
              </div>
              <Link
                href="/policies"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                <FileText className="h-4 w-4 text-zinc-400" />
                Мої поліси
              </Link>
              <button
                onClick={() => { setOpen(false); signOut(); }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                <LogOut className="h-4 w-4 text-zinc-400" />
                Вийти
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
