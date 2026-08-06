import { Quote } from "lucide-react";

// Бренд-іконки джерел відгуків (self-contained SVG, без залежностей).
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.93l3.66-2.83z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="#1877F2" aria-hidden="true">
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.49 0-1.96.93-1.96 1.88v2.26h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07z" />
    </svg>
  );
}
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="ig-grad" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#F58529" />
          <stop offset="0.5" stopColor="#DD2A7B" />
          <stop offset="1" stopColor="#8134AF" />
        </linearGradient>
      </defs>
      <path fill="url(#ig-grad)" d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.31-1.46.72-2.12 1.38C1.36 2.67.95 3.34.63 4.14.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.31.79.72 1.46 1.38 2.12.66.66 1.33 1.07 2.12 1.38.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56.79-.31 1.46-.72 2.12-1.38.66-.66 1.07-1.33 1.38-2.12.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.85 5.85 0 0 0-1.38-2.12A5.85 5.85 0 0 0 19.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.41-10.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z" />
    </svg>
  );
}

const SOURCE_ICON = { google: GoogleIcon, facebook: FacebookIcon, instagram: InstagramIcon } as const;
type Source = keyof typeof SOURCE_ICON;

// ⚠️ ЗАГОТОВКИ-ПРИКЛАДИ. Заміни на РЕАЛЬНІ відгуки з відповідних платформ. Приписувати
// вигадані відгуки Google/Facebook — недопустимо (довіра + закон).
const reviews: { name: string; city: string; text: string; color: string; source: Source }[] = [
  { name: "Андрій", city: "Київ", text: "Оформив автоцивілку за 5 хвилин, без черг. Ціна виявилась дешевшою, ніж я платив раніше.", color: "bg-indigo-500", source: "google" },
  { name: "Оксана", city: "Львів", text: "Порівняла кілька страхових і одразу обрала найвигіднішу. Поліс прийшов на пошту миттєво.", color: "bg-emerald-500", source: "facebook" },
  { name: "Дмитро", city: "Одеса", text: "Зробив зелену карту перед поїздкою за кордон прямо з телефону. Дуже зручно й швидко.", color: "bg-amber-500", source: "instagram" },
  { name: "Ірина", city: "Харків", text: "Підтримка відповіла швидко й допомогла розібратись із документами. Рекомендую.", color: "bg-rose-500", source: "google" },
  { name: "Сергій", city: "Дніпро", text: "Все чесно й прозоро — жодних прихованих платежів. Наступний поліс оформлю тут же.", color: "bg-sky-500", source: "facebook" },
  { name: "Наталія", city: "Вінниця", text: "Туристичне для всієї родини оформила за кілька хвилин. Ціни приємно здивували.", color: "bg-violet-500", source: "google" },
];

export function ReviewsSection() {
  const row = [...reviews, ...reviews];

  return (
    <section className="bg-[#FAFAFA] py-20 sm:py-24">
      <div className="mx-auto mb-12 max-w-2xl px-4 text-center sm:px-6">
        <div className="flex items-center justify-center gap-3">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">Відгуки клієнтів</h2>
          <div className="flex items-center gap-1.5">
            <GoogleIcon className="h-6 w-6" />
            <FacebookIcon className="h-6 w-6" />
            <InstagramIcon className="h-6 w-6" />
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[#FAFAFA] to-transparent sm:w-24" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[#FAFAFA] to-transparent sm:w-24" />
        <div className="animate-marquee">
          {row.map(({ name, city, text, color, source }, i) => {
            const SourceIcon = SOURCE_ICON[source];
            return (
              <div key={i} className="mr-4 flex min-h-[240px] w-[290px] shrink-0 flex-col rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200/50">
                <div className="mb-3 flex items-center justify-between">
                  <Quote className="h-6 w-6 text-zinc-200" />
                  <SourceIcon className="h-5 w-5" />
                </div>
                <p className="flex-1 text-sm leading-relaxed text-zinc-700">{text}</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${color}`}>
                    {name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">{name}</p>
                    <p className="text-xs text-zinc-400">{city}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
