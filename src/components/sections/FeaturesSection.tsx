"use client";

import { motion } from "framer-motion";
import { Zap, Clock, FileCheck, HeadphonesIcon, Scale, Coins } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { SectionHeading } from "./SectionHeading";

const features = [
  {
    icon: Zap,
    title: { uk: "Оформлення за 3 хвилини", en: "Get covered in 3 minutes" },
    description: { uk: "Від введення номера авто до готового поліса — всього 3 хвилини, без зайвої бюрократії.", en: "From entering your car number to a ready policy — just 3 minutes, no unnecessary bureaucracy." },
  },
  {
    icon: Scale,
    title: { uk: "Порівняння від 21+ страхових", en: "Compare 21+ insurers" },
    description: { uk: "Ціни всіх компаній в одному місці — обираєте найвигіднішу пропозицію за секунди.", en: "Prices from every company in one place — choose the best offer in seconds." },
  },
  {
    icon: Coins,
    title: { uk: "Економія", en: "Savings" },
    description: { uk: "Ціна страхової без переплат посередникам, плюс бонус з кожної покупки — знижка на наступний поліс.", en: "The insurer's price with no middleman markups, plus a bonus on every purchase — a discount on your next policy." },
  },
  {
    icon: Clock,
    title: { uk: "Без черг і офісів", en: "No queues or offices" },
    description: { uk: "Весь процес — онлайн. Жодних поїздок до страховика чи брокера.", en: "The whole process is online. No trips to the insurer or broker." },
  },
  {
    icon: FileCheck,
    title: { uk: "Можливість повернення коштів за поліс", en: "Option to refund your policy" },
    description: { uk: "За потреби ви можете оформити повернення коштів за поліс згідно з умовами страховика.", en: "If needed, you can request a refund for your policy under the insurer's terms." },
  },
  {
    icon: HeadphonesIcon,
    title: { uk: "Підтримка", en: "Support" },
    description: { uk: "Наша команда допоможе з будь-яким питанням щодо оформлення поліса.", en: "Our team will help you with any question about getting your policy." },
  },
];

// Картки зʼявляються зі стаггером, щойно секція потрапляє в екран (viewport).
function FeatureCard({ feature, index }: { feature: (typeof features)[number]; index: number }) {
  const { t } = useI18n();
  const { icon: Icon, title, description } = feature;
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 p-5 shadow-sm ring-1 ring-zinc-200/50 dark:ring-zinc-700 transition-all hover:shadow-lg hover:shadow-indigo-900/5 hover:-translate-y-1"
    >
      <div className="relative z-10 flex-1">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors duration-300 group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-950/40 dark:text-indigo-400">
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="mb-2 text-base font-bold leading-snug text-zinc-900 dark:text-zinc-100">{t(title)}</h3>
        <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{t(description)}</p>
      </div>
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-indigo-600 opacity-[0.03] transition-transform duration-500 group-hover:scale-150" />
    </motion.div>
  );
}

export function FeaturesSection() {
  const { t } = useI18n();
  return (
    <section id="about" className="bg-[#FAFAFA] py-16 dark:bg-[#0f0f11] sm:py-20">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow={t({ uk: "Чому ми", en: "Why us" })}
          icon={Zap}
          title={t({ uk: "Переваги купівлі онлайн", en: "Benefits of buying online" })}
          subtitle={t({ uk: "Оформлення поліса без черг, паперів і поїздок — швидко, зручно та офіційно.", en: "Get your policy without queues, paperwork or trips — fast, convenient and official." })}
        />

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {features.map((feature, i) => (
            <FeatureCard key={feature.title.uk} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
