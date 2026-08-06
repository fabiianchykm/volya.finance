"use client";

import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useRef } from "react";
import { Zap, Clock, FileCheck, HeadphonesIcon } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Оформлення за 3 хвилини",
    description: "Від введення номера авто до готового поліса — всього 3 хвилини, без зайвої бюрократії.",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    glowColor: "bg-amber-600",
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
    title: "Підтримка",
    description: "Наша команда допоможе з будь-яким питанням щодо оформлення поліса.",
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
    glowColor: "bg-rose-600",
  },
];

// Кожна картка зʼявляється відповідно до прогресу прогортання секції — по черзі
// зліва направо. Вікно появи картки i: [i·step, i·step + span] у 0..1 прогресу.
function FeatureCard({
  feature,
  index,
  count,
  progress,
}: {
  feature: (typeof features)[number];
  index: number;
  count: number;
  progress: MotionValue<number>;
}) {
  const { icon: Icon, title, description, iconBg, iconColor, glowColor } = feature;
  const step = 0.72 / count;          // зсув старту між сусідніми картками
  const span = 0.24;                  // тривалість появи однієї картки
  const start = index * step;
  const end = start + span;
  const opacity = useTransform(progress, [start, end], [0, 1]);
  const y = useTransform(progress, [start, end], [40, 0]);

  return (
    <motion.div
      style={{ opacity, y }}
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
  );
}

export function FeaturesSection() {
  const trackRef = useRef(null);

  // Секція «пінується»: зовнішній трек вищий за екран, а контент усередині —
  // sticky на весь екран. Поки крутиш у межах треку, секція стоїть на місці й
  // картки виринають по одній; далі сторінка гортається лише коли всі показані.
  // progress 0 — трек торкнувся верху вьюпорту (пін увімкнувся), 1 — трек
  // відпустив пін (усі картки вже зʼявились).
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
  });

  return (
    <section id="about" className="bg-[#FAFAFA]">
      {/* Трек прокрутки: його висота = скільки треба прогорнути для показу всіх карток */}
      <div ref={trackRef} className="relative h-[240vh]">
        <div className="sticky top-0 flex h-screen items-center overflow-hidden">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
            <div className="mb-12 text-center max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
                Наші переваги
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, i) => (
                <FeatureCard
                  key={feature.title}
                  feature={feature}
                  index={i}
                  count={features.length}
                  progress={scrollYProgress}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
