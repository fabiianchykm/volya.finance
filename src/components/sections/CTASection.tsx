"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { PhoneCall, CheckCircle2, ShieldCheck, Clock, BadgePercent } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface CTASectionProps {
  onStart: () => void;
}

// Форматує введені цифри у вигляд "67 123 45 67" (без коду країни)
function formatPhone(digits: string): string {
  const d = digits.slice(0, 9);
  const parts = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean);
  return parts.join(" ");
}

export function CTASection({ onStart }: CTASectionProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const digits = phone.replace(/\D/g, "");
  const isValid = digits.length === 9;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
      setSubmitted(true);
      // TODO: API call to submit "+380" + digits
    }
  };

  return (
    <section className="py-20" ref={ref}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-[2rem] p-8 sm:p-14"
          style={{
            backgroundImage:
              "linear-gradient(135deg, #1e1b4b 0%, #4338ca 45%, #6d28d9 100%)",
          }}
        >
          {/* Світні орби */}
          <div className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-violet-500/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl" />
          {/* Сітка */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
          />

          <div className="relative">
            {!submitted ? (
              <div className="grid items-center gap-10 lg:grid-cols-2">
                {/* Ліва частина — текст */}
                <div className="text-center lg:text-left">
                  <div className="mb-6 flex justify-center lg:justify-start">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-indigo-100 backdrop-blur-sm ring-1 ring-white/15">
                      <PhoneCall className="h-4 w-4" />
                      Безкоштовна консультація
                    </span>
                  </div>

                  <h2 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
                    Оформити з{" "}
                    <span className="bg-gradient-to-r from-indigo-200 to-violet-200 bg-clip-text text-transparent">
                      консультантом
                    </span>
                  </h2>
                  <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-indigo-200 lg:mx-0">
                    Залиште номер — менеджер передзвонить протягом 5 хвилин,
                    підбере найкращий поліс і допоможе оформити.
                  </p>

                  <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-indigo-100 lg:justify-start">
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-indigo-300" />
                      Офіційні поліси
                    </span>
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-indigo-300" />
                      Дзвінок за 5 хв
                    </span>
                    <span className="flex items-center gap-2">
                      <BadgePercent className="h-4 w-4 text-indigo-300" />
                      Найкращі ціни
                    </span>
                  </div>
                </div>

                {/* Права частина — скляна форма */}
                <div className="rounded-2xl bg-white/10 p-5 backdrop-blur-md ring-1 ring-white/15 sm:p-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <label className="block text-left">
                      <span className="mb-2 block text-sm font-medium text-indigo-100">
                        Ваш номер телефону
                      </span>
                      <div className="flex items-center rounded-xl border border-white/20 bg-white/95 px-4 transition-colors focus-within:border-white focus-within:ring-2 focus-within:ring-white/40">
                        <span className="flex items-center gap-2 pr-3 text-base font-semibold text-zinc-500">
                          <span className="text-lg leading-none">🇺🇦</span>
                          +380
                        </span>
                        <span className="mr-3 h-6 w-px bg-zinc-200" />
                        <input
                          type="tel"
                          inputMode="numeric"
                          autoComplete="tel"
                          placeholder="67 123 45 67"
                          value={phone}
                          onChange={(e) =>
                            setPhone(formatPhone(e.target.value.replace(/\D/g, "")))
                          }
                          required
                          className="w-full bg-transparent py-4 text-lg font-medium tracking-wide text-zinc-900 placeholder:text-zinc-300 outline-none"
                        />
                      </div>
                    </label>

                    <Button
                      type="submit"
                      size="xl"
                      disabled={!isValid}
                      className="w-full rounded-xl bg-white font-bold text-indigo-700 shadow-xl shadow-indigo-950/30 hover:bg-indigo-50 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 disabled:hover:scale-100"
                    >
                      Замовити дзвінок
                    </Button>

                    <p className="text-center text-xs leading-relaxed text-indigo-200/80">
                      Натискаючи кнопку, ви погоджуєтесь на обробку персональних даних
                    </p>
                  </form>
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-8 text-center"
              >
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 text-green-300 ring-1 ring-green-400/30">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="mb-2 text-2xl font-bold text-white">
                  Дякуємо за заявку!
                </h3>
                <p className="mx-auto max-w-md text-indigo-200">
                  Наш консультант зв&apos;яжеться з вами на номер{" "}
                  <span className="font-semibold text-white">+380 {phone}</span>{" "}
                  найближчим часом.
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
