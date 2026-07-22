"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut, LogIn, FileText } from "lucide-react";
import { VMark, BarlessA } from "./VMark";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useSession, signOut } from "next-auth/react";
import { useLogin } from "@/components/auth/LoginProvider";

const navLinks = [
  { label: "Автоцивілка", href: "/osago" },
  { label: "КАСКО", href: "/kasko" },
  { label: "Міні-КАСКО", href: "/mini-kasko" },
  { label: "Зелена карта", href: "/green-card" },
];

export function Navbar({ solid = false }: { solid?: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false);
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
          ? "bg-white/95 backdrop-blur-md border-b border-zinc-100 shadow-sm"
          : "bg-white/5 backdrop-blur-md border-b border-white/10"
      )}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-1">
          <VMark id="vmark-nav" className="h-9 w-9" />
          <span
            style={{ fontFamily: "var(--font-logo)" }}
            className={cn(
              "text-2xl font-medium uppercase tracking-[0.2em] transition-colors duration-300",
              opaque ? "text-zinc-900" : "text-white"
            )}
          >
            OLY<BarlessA className="inline-block h-[0.72em] w-auto align-baseline" />
          </span>
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  "rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                  opaque
                    ? "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                )}
              >
                {link.label}
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
                  className="rounded-lg px-3.5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
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
