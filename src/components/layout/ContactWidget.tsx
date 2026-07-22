"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Mail, Send, MessageCircle, X } from "lucide-react";
import { LeadModal, type LeadMode } from "./LeadModal";

// Плаваюча кругла кнопка звʼязку (низ-праворуч). Клік розкриває варіанти:
// Telegram (лінк), Дзвінок і Email (спільне віконце заявки). Ховаємо у флоу
// оформлення, щоб не перекривати кнопки/оплату.

const TELEGRAM_URL = "https://t.me/volya_finance_bot";

export function ContactWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<LeadMode>(null);

  // На сторінках оформлення/оплати не показуємо, щоб не заважати.
  if (pathname?.startsWith("/checkout") || pathname?.startsWith("/payment-success")) return null;

  const options = [
    {
      key: "telegram",
      label: "Telegram",
      icon: Send,
      color: "bg-sky-500 hover:bg-sky-600",
      href: TELEGRAM_URL,
    },
    {
      key: "phone",
      label: "Замовити дзвінок",
      icon: Phone,
      color: "bg-emerald-500 hover:bg-emerald-600",
      onClick: () => { setMode("phone"); setOpen(false); },
    },
    {
      key: "email",
      label: "Написати на email",
      icon: Mail,
      color: "bg-indigo-500 hover:bg-indigo-600",
      href: "mailto:volya.finance.team@gmail.com",
    },
  ];

  return (
    <>
      {/* Клік поза меню — закриваємо */}
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}

      <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
        <AnimatePresence>
          {open &&
            options.map((o, i) => {
              const Icon = o.icon;
              const inner = (
                <>
                  <span className="rounded-lg bg-white px-2.5 py-1 text-sm font-medium text-zinc-800 shadow-md ring-1 ring-black/5">
                    {o.label}
                  </span>
                  <span className={`flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition-colors ${o.color}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                </>
              );
              return (
                <motion.div
                  key={o.key}
                  initial={{ opacity: 0, y: 12, scale: 0.85 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.85 }}
                  transition={{ duration: 0.16, delay: i * 0.04 }}
                  className="flex items-center gap-2.5"
                >
                  {o.href ? (
                    <a
                      href={o.href}
                      target={o.href.startsWith("http") ? "_blank" : undefined}
                      rel={o.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      aria-label={o.label}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2.5"
                    >
                      {inner}
                    </a>
                  ) : (
                    <button type="button" aria-label={o.label} onClick={o.onClick} className="flex items-center gap-2.5">
                      {inner}
                    </button>
                  )}
                </motion.div>
              );
            })}
        </AnimatePresence>

        <button
          type="button"
          aria-label="Звʼязатися з нами"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-xl shadow-indigo-600/30 transition-transform hover:scale-105 active:scale-95"
        >
          {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        </button>
      </div>

      <LeadModal mode={mode} source="Плаваюча кнопка" onClose={() => setMode(null)} />
    </>
  );
}
