"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Menu, X, LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useSession, signIn, signOut } from "next-auth/react";

const navLinks = [
  { label: "Автоцивілка", href: "#insurance" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { data: session, status } = useSession();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isLoading = status === "loading";

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-40 transition-all duration-500",
        scrolled
          ? "bg-white/95 backdrop-blur-md border-b border-zinc-100 shadow-sm"
          : "bg-white/5 backdrop-blur-md border-b border-white/10"
      )}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className={cn(
            "flex h-8 w-8 items-center justify-center rounded-xl transition-colors duration-300",
            scrolled ? "bg-indigo-600" : "bg-white/20"
          )}>
            <Shield className="h-4 w-4 text-white" />
          </div>
          <span className={cn(
            "text-base font-bold transition-colors duration-300",
            scrolled ? "text-zinc-900" : "text-white"
          )}>
            volya<span className={scrolled ? "text-indigo-600" : "text-indigo-300"}>.finance</span>
          </span>
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  "rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                  scrolled
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
            <UserMenu scrolled={scrolled} user={session.user} />
          ) : (
            <Button
              size="md"
              variant="primary"
              className={cn(
                "flex items-center gap-2",
                !scrolled ? "bg-white text-indigo-700 hover:bg-white/90 shadow-none" : ""
              )}
              onClick={() => signIn("google")}
            >
              <GoogleIcon className="h-4 w-4" />
              Увійти через Google
            </Button>
          )}
        </div>

        <button
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg border transition-colors md:hidden",
            scrolled
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
                    onClick={() => { setMobileOpen(false); signIn("google"); }}
                  >
                    <GoogleIcon className="h-4 w-4" />
                    Увійти через Google
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

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
