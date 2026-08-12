"use client";

import { motion } from "framer-motion";
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

// Картки зʼявляються зі стаггером, щойно секція потрапляє в екран (viewport).
function FeatureCard({ feature, index }: { feature: (typeof features)[number]; index: number }) {
  const { icon: Icon, title, description, iconBg, iconColor, glowColor } = feature;
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
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
  return (
    <section id="about" className="py-14 sm:py-16">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">
          {/* Заголовок збоку */}
          <div className="lg:w-72 lg:shrink-0 lg:pt-2">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
              Переваги купівлі онлайн
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-500">
              Оформлення поліса без черг, паперів і поїздок — швидко, зручно та офіційно.
            </p>
          </div>

          {/* Картки */}
          <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
            {features.map((feature, i) => (
              <FeatureCard key={feature.title} feature={feature} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
