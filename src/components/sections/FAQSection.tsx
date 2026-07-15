"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { FAQ_ITEMS } from "@/lib/faq";

function FAQItem({ question, answer, index }: { question: string; answer: string; index: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      className={cn(
        "border-b border-zinc-200 last:border-0 transition-colors duration-200",
        isOpen && "border-zinc-200"
      )}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-6 py-7 text-left focus:outline-none group"
      >
        <span className={cn(
          "text-xl font-semibold transition-colors duration-200",
          isOpen ? "text-indigo-600" : "text-zinc-900 group-hover:text-indigo-600"
        )}>
          {question}
        </span>
        <span className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300",
          isOpen
            ? "bg-indigo-600 text-white rotate-45"
            : "bg-zinc-100 text-zinc-500 group-hover:bg-indigo-50 group-hover:text-indigo-600"
        )}>
          <Plus className="h-4 w-4" />
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="pb-7 text-lg leading-relaxed text-zinc-600 max-w-3xl">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function FAQSection() {
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <div className="mb-14 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Поширені запитання
          </h2>
          <p className="mt-4 text-lg text-zinc-600">
            Усе, що потрібно знати про електронну автоцивілку
          </p>
        </div>

        <div>
          {FAQ_ITEMS.map((faq, index) => (
            <FAQItem key={index} question={faq.question} answer={faq.answer} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
