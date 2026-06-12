"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Shield, Zap, Clock, Star, FileCheck, HeadphonesIcon } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Офіційні поліси МТСБУ",
    description: "Всі поліси зареєстровані в Моторному транспортному страховому бюро України.",
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
    glowColor: "bg-indigo-600",
  },
  {
    icon: Zap,
    title: "Оформлення за 3 хвилини",
    description: "Від введення номера авто до отримання готового поліса — всього 3 хвилини.",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    glowColor: "bg-amber-600",
  },
  {
    icon: Star,
    title: "Найкращі ціни",
    description: "Порівнюємо пропозиції від 18+ страхових компаній і показуємо найвигідніші.",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    glowColor: "bg-emerald-600",
  },
  {
    icon: FileCheck,
    title: "Можливість повернення коштів за поліс",
    description: "За потреби ви можете оформити повернення коштів за поліс згідно з умовами страховика.",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
    glowColor: "bg-violet-600",
  },
  {
    icon: Clock,
    title: "Без черг і офісів",
    description: "Весь процес — онлайн. Жодних поїздок до страховика чи брокера.",
    iconBg: "bg-sky-100",
    iconColor: "text-sky-600",
    glowColor: "bg-sky-600",
  },
  {
    icon: HeadphonesIcon,
    title: "Підтримка 24/7",
    description: "Наша команда завжди на зв'язку, щоб допомогти з будь-яким питанням.",
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
    glowColor: "bg-rose-600",
  },
];

export function FeaturesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="about" className="py-20 sm:py-24 bg-[#FAFAFA]" ref={ref}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center max-w-2xl mx-auto"
        >
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Наші переваги
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {features.map(({ icon: Icon, title, description, iconBg, iconColor, glowColor }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45, delay: i * 0.07 }}
              className="group relative flex flex-col overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200/50 transition-all hover:shadow-lg hover:shadow-indigo-900/5 hover:-translate-y-1"
            >
              <div className="relative z-10 flex-1">
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${iconBg} ${iconColor} transition-transform duration-300 group-hover:scale-110`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-base font-bold leading-snug text-zinc-900">{title}</h3>
                <p className="text-sm leading-relaxed text-zinc-500">{description}</p>
              </div>
              <div
                className={`absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-[0.03] transition-transform duration-500 group-hover:scale-150 ${glowColor}`}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}