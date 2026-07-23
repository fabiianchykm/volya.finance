"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { logoSrc } from "@/lib/logos";

const insurers = [
  { name: "ІНГО",         slug: "inho" },
  { name: "PZU",          slug: "pzu" },
  { name: "ARX",          slug: "arx" },
  { name: "Уніка",        slug: "unika" },
  { name: "Оранта",       slug: "oranta" },
  { name: "Княжа",        slug: "knyazha" },
  { name: "УСГ",          slug: "usg" },
  { name: "ВУСО",         slug: "vuso" },
  { name: "ТАС",          slug: "tas" },
  { name: "Євроінс",      slug: "euroins" },
  { name: "Арсенал",      slug: "arsenal" },
  { name: "Брокбізнес",   slug: "brokbyzness" },
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
      className="group flex h-24 items-center justify-center rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm ring-1 ring-black/[0.02] transition-all duration-200 hover:-translate-y-1 hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-100/50"
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
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-zinc-50 via-white to-zinc-50 py-16 sm:py-24" ref={ref}>
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
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-indigo-600 shadow-sm ring-1 ring-indigo-100">
            <ShieldCheck className="h-3.5 w-3.5" />
            Партнери
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Провідні страхові компанії України
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-zinc-500">
            Порівнюйте пропозиції 18+ акредитованих страховиків в одному місці — і обирайте найкраще.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-6">
          {insurers.map(({ name, slug }, i) => (
            <InsurerCard key={slug} name={name} slug={slug} i={i} inView={inView} />
          ))}
        </div>
      </div>
    </section>
  );
}
