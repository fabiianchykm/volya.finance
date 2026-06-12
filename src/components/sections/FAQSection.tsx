"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    question: "Що таке електронний поліс ОСЦПВ?",
    answer:
      "Електронний поліс ОСЦПВ (автоцивілка) — це повноцінний аналог паперового поліса, який має таку ж юридичну силу. Він автоматично реєструється в базі МТСБУ, і його можна пред'являти патрульній поліції просто з екрана смартфона або в застосунку «Дія».",
  },
  {
    question: "Як перевірити дійсність мого поліса?",
    answer:
      "Відразу після оформлення та оплати ваш поліс миттєво потрапляє до централізованої бази МТСБУ. Ви можете перевірити його статус та дійсність на офіційному сайті МТСБУ за номером авто або номером самого поліса, а також він автоматично підтягнеться в застосунок «Дія».",
  },
  {
    question: "Що робити при настанні ДТП?",
    answer:
      "У разі ДТП обов'язково увімкніть аварійну сигналізацію та встановіть знак аварійної зупинки. Викличте поліцію або заповніть Європротокол (якщо немає постраждалих і учасники згодні з обставинами). Після цього обов'язково зателефонуйте на гарячу лінію вашої страхової компанії (номер вказано в полісі) для реєстрації страхової події.",
  },
  {
    question: "Чи можна оформити страховку не власнику авто?",
    answer:
      "Так, поліс ОСЦПВ страхує цивільно-правову відповідальність усіх водіїв, які на законних підставах керують даним транспортним засобом. Тому оформити і оплатити страховку може будь-яка особа, маючи необхідні дані про автомобіль.",
  },
  {
    question: "Скільки часу займає оформлення на сайті?",
    answer:
      "Процес оформлення на volya.finance займає в середньому 3-5 хвилин. Ви вводите номер авто, обираєте найвигіднішу пропозицію, заповнюєте дані та оплачуєте онлайн. Поліс приходить на ваш email протягом кількох хвилин після оплати.",
  },
];

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
          {faqs.map((faq, index) => (
            <FAQItem key={index} question={faq.question} answer={faq.answer} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
