"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

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
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

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
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "relative z-10 w-full rounded-2xl bg-white shadow-2xl flex flex-col",
              size === "full" ? "h-full" : "max-h-[calc(100dvh-2rem)]",
              sizes[size],
              className
            )}
          >
            {title && (
              <div className={cn("flex shrink-0 items-center justify-between border-b px-6 py-4", className?.includes("emerald") ? "border-emerald-100" : "border-zinc-100")}>
                <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
                <button
                  onClick={onClose}
                  className="ml-auto rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <div className="overflow-y-auto p-6">{children}</div>
            {!title && (
              <button
                onClick={onClose}
                className="absolute right-4 top-6 rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
