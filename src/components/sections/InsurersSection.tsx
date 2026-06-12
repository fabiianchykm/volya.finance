"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";

const insurers = [
  { name: "ІНГО",         slug: "inho" },
  { name: "PZU",          slug: "pzu" },
  { name: "ARX",          slug: "arx" },
  { name: "Уніка",        slug: "unika" },
  { name: "Оранта",       slug: "oranta" },
  { name: "Княжа",        slug: "knyazha" },
  { name: "УСГ",          slug: "ush" },
  { name: "ВУСО",         slug: "vuso" },
  { name: "ТАС",          slug: "tas" },
  { name: "Євроінс",      slug: "euroins" },
  { name: "Арсенал",      slug: "arsenal" },
  { name: "Брокбізнес",   slug: "brokbyzness" },
  { name: "Експрес",      slug: "ekspres-strakhuvannya" },
  { name: "Еталон",       slug: "etalon" },
  { name: "Гардіан",      slug: "guardian" },
  { name: "Інтер-Поліс",  slug: "inter-polis" },
  { name: "ЮТІКО",        slug: "utico" },
  { name: "ЄСА",          slug: "esa" },
];

function InsurerLogo({ name, slug, i, inView }: { name: string; slug: string; i: number; inView: boolean }) {
  const formats = ["webp", "png", "jpeg", "svg"];
  const [idx, setIdx] = useState(0);

  if (idx >= formats.length) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.3, delay: i * 0.03 }}
        className="flex items-center justify-center py-5 px-4 h-20"
      >
        <span className="text-lg font-semibold text-zinc-400">{name}</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.35, delay: i * 0.03 }}
      className="flex items-center justify-center py-5 px-4 opacity-70 hover:opacity-100 hover:scale-105 transition-all duration-200"
    >
      <img
        src={`/logos/${slug}.${formats[idx]}`}
        alt={name}
        className="h-20 max-w-[170px] object-contain"
        onError={() => setIdx((prev) => prev + 1)}
      />
    </motion.div>
  );
}

export function InsurersSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-16 sm:py-20" style={{ background: "#F4F0EF" }} ref={ref}>
      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Наші партнери
          </h2>
          <p className="mt-3 text-base text-zinc-500">
            18+ акредитованих страхових компаній України
          </p>
        </motion.div>

        <div className="-mx-6 overflow-x-auto px-6 sm:mx-0 sm:overflow-visible sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="grid snap-x snap-mandatory grid-flow-col grid-rows-3 auto-cols-[30%] gap-x-2 gap-y-6 sm:grid-flow-row sm:auto-cols-auto sm:grid-cols-3 sm:gap-x-4 sm:gap-y-8 md:grid-cols-6">
            {insurers.map(({ name, slug }, i) => (
              <div key={slug} className="snap-start sm:snap-align-none">
                <InsurerLogo name={name} slug={slug} i={i} inView={inView} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
