import { ShieldCheck, Clock, BadgePercent } from "lucide-react";

// Герой хабу: без калькулятора — кожен продукт має власну сторінку з формою.
export function HomeHero() {
  return (
    <section
      className="relative overflow-x-hidden pb-16 pt-32 sm:pb-20 sm:pt-40 animate-gradient"
      style={{
        backgroundImage: "linear-gradient(135deg, #06040f, #0f0c29, #1e1060, #4f46e5, #7c3aed, #1e1060, #06040f)",
      }}
    >
      <div className="pointer-events-none absolute inset-0" style={{
        background: "radial-gradient(ellipse 70% 60% at 50% 48%, transparent 0%, rgba(0,0,0,0.1) 100%)",
      }} />

      <div className="relative mx-auto max-w-3xl px-4 sm:px-6 text-center">
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
          Страхування авто{" "}
          <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            онлайн
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-zinc-300 sm:text-lg">
          Автоцивілка, КАСКО та Зелена карта в одному місці. Оберіть продукт —
          і оформіть поліс за кілька хвилин.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-zinc-200">
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-indigo-300" /> Офіційні поліси МТСБУ
          </span>
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-300" /> Оформлення за 3 хвилини
          </span>
          <span className="flex items-center gap-2">
            <BadgePercent className="h-4 w-4 text-indigo-300" /> Найкращі ціни
          </span>
        </div>
      </div>
    </section>
  );
}
