"use client";

import { useEffect, useId, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  className?: string;
  preventOutsideClose?: boolean;
}

export function Modal({ open, onClose, title, children, size = "md", className, preventOutsideClose }: ModalProps) {
  const { t } = useI18n();
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) { document.body.style.overflow = ""; return; }
    document.body.style.overflow = "hidden";
    // Запамʼятовуємо, звідки прийшов фокус, і переводимо його в модалку (WCAG 2.4.3).
    const prevFocus = document.activeElement as HTMLElement | null;
    const t = setTimeout(() => panelRef.current?.focus(), 0);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !preventOutsideClose) { onClose(); return; }
      if (e.key !== "Tab") return;
      // Простий фокус-трап у межах панелі (WCAG 2.4.3).
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = panel.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      prevFocus?.focus?.();
    };
  }, [open, onClose, preventOutsideClose]);

  const sizes = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-2xl",
    "2xl": "max-w-3xl",
    full: "max-w-[95vw] h-[95vh]",
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={preventOutsideClose ? undefined : onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-label={title ? undefined : t({ uk: "Діалогове вікно", en: "Dialog window" })}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "relative z-10 w-full rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl flex flex-col outline-none",
              size === "full" ? "h-full" : "max-h-[calc(100dvh-2rem)]",
              sizes[size],
              className
            )}
          >
            {title && (
              <div className={cn("flex shrink-0 items-center justify-between border-b px-6 py-4", className?.includes("emerald") ? "border-emerald-100 dark:border-emerald-900/40" : "border-zinc-100 dark:border-zinc-800")}>
                <h2 id={titleId} className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
                <button
                  onClick={onClose}
                  aria-label={t({ uk: "Закрити", en: "Close" })}
                  className="ml-auto rounded-lg p-1.5 text-zinc-400 dark:text-zinc-500 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            )}
            <div className="overflow-y-auto p-6">{children}</div>
            {!title && (
              <button
                onClick={onClose}
                aria-label={t({ uk: "Закрити", en: "Close" })}
                className="absolute right-4 top-6 rounded-lg p-1.5 text-zinc-400 dark:text-zinc-500 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
