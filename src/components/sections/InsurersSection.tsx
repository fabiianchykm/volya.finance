"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import Link from "next/link";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { logoSrc } from "@/lib/logos";
import { INSURERS_FROZEN } from "@/lib/insurers";
import { useI18n } from "@/lib/i18n";

const insurers = [
  { name: "ІНГО",         slug: "inho" },
  { name: "PZU",          slug: "pzu" },
  { name: "ARX",          slug: "arx" },
  // Брокбізнес = BBS Insurance (один логотип). Тримаємо далеко від "bbs-insurance"
  // нижче, щоб два однакові лого не стояли поруч.
  { name: "Брокбізнес",   slug: "brokbyzness" },
  { name: "Уніка",        slug: "unika" },
  { name: "Оранта",       slug: "oranta" },
  { name: "Княжа",        slug: "knyazha" },
  { name: "УСГ",          slug: "usg" },
  { name: "ВУСО",         slug: "vuso" },
  { name: "ТАС",          slug: "tas" },
  { name: "Євроінс",      slug: "euroins" },
  { name: "Арсенал",      slug: "arsenal" },
  { name: "Експрес",      slug: "express" },
  { name: "Гардіан",      slug: "guardian" },
  { name: "Інтер-Поліс",  slug: "inter-polis" },
  { name: "ЮТІКО",        slug: "utico" },
  { name: "ЄСА",          slug: "eia" },
  { name: "ББС Іншуранс", slug: "bbs-insurance" },
];

function InsurerCard({ name, slug, i, inView }: { name: string; slug: string; i: number; inView: boolean }) {
  const [failed, setFailed] = useState(false);
  const src = logoSrc(slug);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay: i * 0.03, ease: "easeOut" }}
      className="group flex h-24 items-center justify-center rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-100 p-4 shadow-sm ring-1 ring-black/[0.02] dark:ring-white/10 transition-all duration-200 hover:-translate-y-1 hover:border-indigo-100 dark:hover:border-indigo-900 hover:shadow-lg hover:shadow-indigo-100/50"
    >
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          className="max-h-12 max-w-[130px] object-contain transition-transform duration-200 group-hover:scale-105"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="text-center text-sm font-semibold text-zinc-500">{name}</span>
      )}
    </motion.div>
  );
}

export function InsurersSection() {
  const { t } = useI18n();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="relative overflow-hidden bg-[#FAFAFA] dark:bg-[#0f0f11] py-16 sm:py-24" ref={ref}>
      {/* М'які світні акценти для «дорогого» відчуття */}
      <div className="pointer-events-none absolute -top-24 left-1/4 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-indigo-200/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-1/4 h-72 w-[40rem] translate-x-1/2 rounded-full bg-violet-200/25 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 sm:px-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-zinc-900 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-indigo-100 dark:ring-indigo-900">
            <ShieldCheck className="h-3.5 w-3.5" />
            {t({ uk: "Партнери", en: "Partners" })}
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
            {t({ uk: "Провідні страхові компанії України", en: "Leading insurance companies of Ukraine" })}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-zinc-500 dark:text-zinc-400">
            {t({ uk: "Порівнюйте пропозиції 18+ акредитованих страховиків в одному місці — і обирайте найкраще.", en: "Compare offers from 18+ accredited insurers in one place — and choose the best." })}
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-6">
          {insurers.map(({ name, slug }, i) => (
            <InsurerCard key={slug} name={name} slug={slug} i={i} inView={inView} />
          ))}
        </div>

        {/* Перехід до каталогу страхових із відгуками й контактами. Заморожено, поки
            не додані реальні дані профілів (INSURERS_FROZEN). */}
        {!INSURERS_FROZEN && (
          <div className="mt-10 text-center">
            <Link
              href="/insurers"
              className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-zinc-900 px-6 py-3 text-sm font-semibold text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-indigo-100 dark:ring-indigo-900 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              {t({ uk: "Відгуки клієнтів про страхові", en: "Customer reviews of insurers" })}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
