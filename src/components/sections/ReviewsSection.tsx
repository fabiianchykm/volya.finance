"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Star, Quote } from "lucide-react";

// ⚠️ ЗАГОТОВКИ-ПРИКЛАДИ. Заміни на РЕАЛЬНІ відгуки клієнтів (або підтягуй з Google-
// відгуків). Вигадані відгуки на фінансовому сайті — ризик довіри й законодавства.
const reviews = [
  { name: "Андрій", city: "Київ", text: "Оформив автоцивілку за 5 хвилин, без черг. Ціна виявилась дешевшою, ніж я платив раніше.", color: "bg-indigo-500" },
  { name: "Оксана", city: "Львів", text: "Порівняла кілька страхових і одразу обрала найвигіднішу. Поліс прийшов на пошту миттєво.", color: "bg-emerald-500" },
  { name: "Дмитро", city: "Одеса", text: "Зробив зелену карту перед поїздкою за кордон прямо з телефону. Дуже зручно й швидко.", color: "bg-amber-500" },
  { name: "Ірина", city: "Харків", text: "Підтримка відповіла швидко й допомогла розібратись із документами. Рекомендую.", color: "bg-rose-500" },
  { name: "Сергій", city: "Дніпро", text: "Все чесно й прозоро — жодних прихованих платежів. Наступний поліс оформлю тут же.", color: "bg-sky-500" },
  { name: "Наталія", city: "Вінниця", text: "Туристичне для всієї родини оформила за кілька хвилин. Ціни приємно здивували.", color: "bg-violet-500" },
];

export function ReviewsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="bg-white py-20 sm:py-24" ref={ref}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-12 max-w-2xl text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">Відгуки клієнтів</h2>
          <p className="mt-3 text-zinc-500">Що кажуть люди, які оформили поліс через volya.finance</p>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map(({ name, city, text, color }, i) => (
            <motion.div
              key={name + city}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45, delay: i * 0.07 }}
              className="relative flex flex-col rounded-2xl bg-[#FAFAFA] p-6 ring-1 ring-zinc-200/50 transition-all hover:shadow-lg hover:shadow-indigo-900/5 hover:-translate-y-1"
            >
              <Quote className="absolute right-5 top-5 h-6 w-6 text-zinc-200" />
              <div className="mb-3 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="flex-1 text-sm leading-relaxed text-zinc-700">{text}</p>
              <div className="mt-5 flex items-center gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${color}`}>
                  {name[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">{name}</p>
                  <p className="text-xs text-zinc-400">{city}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
