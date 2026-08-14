"use client";

import { motion } from "framer-motion";
import { Zap, Clock, FileCheck, HeadphonesIcon, Scale, Coins } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const features = [
  {
    icon: Zap,
    title: { uk: "Оформлення за 3 хвилини", en: "Get covered in 3 minutes" },
    description: { uk: "Від введення номера авто до готового поліса — всього 3 хвилини, без зайвої бюрократії.", en: "From entering your car number to a ready policy — just 3 minutes, no unnecessary bureaucracy." },
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    glowColor: "bg-amber-600",
  },
  {
    icon: Scale,
    title: { uk: "Порівняння від 18+ страхових", en: "Compare 18+ insurers" },
    description: { uk: "Ціни всіх компаній в одному місці — обираєте найвигіднішу пропозицію за секунди.", en: "Prices from every company in one place — choose the best offer in seconds." },
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
    glowColor: "bg-indigo-600",
  },
  {
    icon: Coins,
    title: { uk: "Економія", en: "Savings" },
    description: { uk: "Ціна страхової без переплат посередникам, плюс бонус з кожної покупки — знижка на наступний поліс.", en: "The insurer's price with no middleman markups, plus a bonus on every purchase — a discount on your next policy." },
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    glowColor: "bg-emerald-600",
  },
  {
    icon: Clock,
    title: { uk: "Без черг і офісів", en: "No queues or offices" },
    description: { uk: "Весь процес — онлайн. Жодних поїздок до страховика чи брокера.", en: "The whole process is online. No trips to the insurer or broker." },
    iconBg: "bg-sky-100",
    iconColor: "text-sky-600",
    glowColor: "bg-sky-600",
  },
  {
    icon: FileCheck,
    title: { uk: "Можливість повернення коштів за поліс", en: "Option to refund your policy" },
    description: { uk: "За потреби ви можете оформити повернення коштів за поліс згідно з умовами страховика.", en: "If needed, you can request a refund for your policy under the insurer's terms." },
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
    glowColor: "bg-violet-600",
  },
  {
    icon: HeadphonesIcon,
    title: { uk: "Підтримка", en: "Support" },
    description: { uk: "Наша команда допоможе з будь-яким питанням щодо оформлення поліса.", en: "Our team will help you with any question about getting your policy." },
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
    glowColor: "bg-rose-600",
  },
];

// Картки зʼявляються зі стаггером, щойно секція потрапляє в екран (viewport).
function FeatureCard({ feature, index }: { feature: (typeof features)[number]; index: number }) {
  const { t } = useI18n();
  const { icon: Icon, title, description, iconBg, iconColor, glowColor } = feature;
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 p-5 shadow-sm ring-1 ring-zinc-200/50 dark:ring-zinc-700 transition-all hover:shadow-lg hover:shadow-indigo-900/5 hover:-translate-y-1"
    >
      <div className="relative z-10 flex-1">
        <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${iconBg} ${iconColor} transition-transform duration-300 group-hover:scale-110`}>
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="mb-2 text-base font-bold leading-snug text-zinc-900 dark:text-zinc-100">{t(title)}</h3>
        <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{t(description)}</p>
      </div>
      <div
        className={`absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-[0.03] transition-transform duration-500 group-hover:scale-150 ${glowColor}`}
      />
    </motion.div>
  );
}

export function FeaturesSection() {
  const { t } = useI18n();
  return (
    <section id="about" className="py-14 sm:py-16">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        {/* Заголовок — вгорі, зліва */}
        <div className="mb-8 max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
            {t({ uk: "Переваги купівлі онлайн", en: "Benefits of buying online" })}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            {t({ uk: "Оформлення поліса без черг, паперів і поїздок — швидко, зручно та офіційно.", en: "Get your policy without queues, paperwork or trips — fast, convenient and official." })}
          </p>
        </div>

        {/* Картки — в один ряд на десктопі */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {features.map((feature, i) => (
            <FeatureCard key={feature.title.uk} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
