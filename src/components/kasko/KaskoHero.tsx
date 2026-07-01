"use client";

import { useState, Fragment } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ChevronRight, Search, Car, Phone, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatPlate } from "@/lib/utils";

// КАСКО оформлюється через заявку, тож кроки інші, ніж у автоцивілки:
// номер авто → дані авто → телефон → дзвінок менеджера.
const heroSteps = [
  { icon: Search, label: "Номер авто" },
  { icon: Car, label: "Дані авто" },
  { icon: Phone, label: "Ваш телефон" },
  { icon: ShieldCheck, label: "Менеджер передзвонить" },
];

interface KaskoHeroProps {
  onSearch: (plate: string) => void;
  loading?: boolean;
  titleLead: string;
  titleHighlight: string;
  subtitle: string;
  cta: string;
}

export function KaskoHero({ onSearch, loading, titleLead, titleHighlight, subtitle, cta }: KaskoHeroProps) {
  const [plate, setPlate] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (plate.trim().length >= 6) {
      onSearch(formatPlate(plate));
    }
  };

  return (
    <section
      className="relative overflow-x-hidden pb-20 pt-32 sm:pb-28 sm:pt-40 md:pt-48 animate-gradient"
      style={{
        backgroundImage: "linear-gradient(135deg, #06040f, #0f0c29, #1e1060, #4f46e5, #7c3aed, #1e1060, #06040f)",
      }}
    >
      <div className="pointer-events-none absolute inset-0" style={{
        background: "radial-gradient(ellipse 70% 60% at 50% 48%, transparent 0%, rgba(0,0,0,0.1) 100%)",
      }} />

      <div className="relative mx-auto max-w-3xl px-4 sm:px-6 text-center w-full">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-10 sm:space-y-12"
        >
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
            {titleLead}{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              {titleHighlight}
            </span>
          </h1>

          <p className="mx-auto max-w-xl text-base text-zinc-300 sm:text-lg">
            {subtitle}
          </p>

          <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="mx-auto flex w-max items-center gap-1.5 px-4 sm:gap-2.5">
              {heroSteps.map(({ icon: Icon, label }, i) => (
                <Fragment key={label}>
                  <div className="flex shrink-0 items-center gap-2 rounded-full bg-white/[0.07] px-3.5 py-2 ring-1 ring-white/10 backdrop-blur-sm">
                    <Icon className="h-4 w-4 text-indigo-300" />
                    <span className="whitespace-nowrap text-sm font-medium text-zinc-200">{label}</span>
                  </div>
                  {i < heroSteps.length - 1 && (
                    <ChevronRight className="h-4 w-4 shrink-0 text-white/25" />
                  )}
                </Fragment>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col items-center gap-8 w-full pt-4">
            <div className="relative w-full flex justify-center">
              <div className="relative flex rounded-xl overflow-hidden border-4 border-zinc-300 animate-plate-glow" style={{ height: 72 }}>
                <div className="flex flex-col items-center justify-center bg-blue-700 gap-1" style={{ width: 44 }}>
                  <div className="grid grid-cols-3 gap-[3px]">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="h-[3px] w-[3px] rounded-full bg-yellow-300 opacity-90" />
                    ))}
                  </div>
                  <span className="text-white font-bold" style={{ fontSize: 9, letterSpacing: 1 }}>UA</span>
                </div>
                <div className="flex items-center bg-white px-3 sm:px-5">
                  <input
                    type="text"
                    value={plate}
                    onChange={(e) => {
                      const raw = e.target.value.toUpperCase().replace(/\s/g, "");
                      let formatted = raw;
                      if (raw.length > 2) formatted = raw.slice(0, 2) + " " + raw.slice(2);
                      if (raw.length > 6) formatted = raw.slice(0, 2) + " " + raw.slice(2, 6) + " " + raw.slice(6);
                      setPlate(formatted);
                    }}
                    placeholder="AA 1234 BB"
                    maxLength={11}
                    autoComplete="off"
                    className="w-[210px] sm:w-[250px] bg-transparent text-2xl sm:text-3xl font-bold uppercase tracking-[0.2em] sm:tracking-[0.25em] text-zinc-900 placeholder:text-zinc-300 outline-none"
                    style={{ fontFamily: "monospace" }}
                    required
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              size="xl"
              loading={loading}
              className="
                group relative overflow-hidden rounded-2xl
                bg-white text-indigo-700
                px-10 font-bold tracking-wide
                shadow-[0_0_32px_rgba(255,255,255,0.18),0_4px_24px_rgba(99,102,241,0.25)]
                hover:shadow-[0_0_48px_rgba(255,255,255,0.28),0_8px_32px_rgba(99,102,241,0.35)]
                hover:bg-white hover:scale-[1.03]
                active:scale-[0.97]
                transition-all duration-200
                disabled:opacity-70 disabled:scale-100
              "
            >
              <span className="relative z-10 flex items-center gap-2.5">
                {cta}
                <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
              </span>
            </Button>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
