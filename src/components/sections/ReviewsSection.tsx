import { Quote } from "lucide-react";

// Бренд-іконки джерел відгуків (self-contained SVG, без залежностей).
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="currentColor" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.93l3.66-2.83z" />
      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.49 0-1.96.93-1.96 1.88v2.26h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07z" />
    </svg>
  );
}
function ThreadsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.781 3.631 2.695 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.85 13.85 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.586-1.308-.883-2.359-.89h-.029c-.844 0-1.992.232-2.721 1.32L7.734 7.847c.98-1.454 2.568-2.256 4.478-2.256h.044c3.194.02 5.097 1.975 5.287 5.388.108.046.216.094.324.144 1.52.715 2.635 1.804 3.211 3.108.804 1.82.878 4.79-1.348 6.79C17.916 22.79 15.914 23.965 12.184 24Zm1.062-11.514c-.246 0-.496.007-.75.021-1.887.106-3.061.973-2.992 2.208.073 1.293 1.499 1.895 2.87 1.821 1.263-.068 2.905-.56 3.181-3.938a10.88 10.88 0 0 0-2.309-.112Z" />
    </svg>
  );
}
function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.451-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644z" />
    </svg>
  );
}

const SOURCE_ICON = { google: GoogleIcon, facebook: FacebookIcon, threads: ThreadsIcon, x: XIcon } as const;
type Source = keyof typeof SOURCE_ICON;

// ⚠️ ЗАГОТОВКИ-ПРИКЛАДИ. Заміни на РЕАЛЬНІ відгуки з відповідних платформ. Приписувати
// вигадані відгуки Google/Facebook — недопустимо (довіра + закон).
const reviews: { name: string; city: string; text: string; color: string; source: Source }[] = [
  { name: "Андрій", city: "Київ", text: "Оформив автоцивілку за 5 хвилин, без черг. Ціна виявилась дешевшою, ніж я платив раніше.", color: "bg-indigo-500", source: "google" },
  { name: "Оксана", city: "Львів", text: "Порівняла кілька страхових і одразу обрала найвигіднішу. Поліс прийшов на пошту миттєво.", color: "bg-emerald-500", source: "facebook" },
  { name: "Дмитро", city: "Одеса", text: "Зробив зелену карту перед поїздкою за кордон прямо з телефону. Дуже зручно й швидко.", color: "bg-amber-500", source: "threads" },
  { name: "Ірина", city: "Харків", text: "Підтримка відповіла швидко й допомогла розібратись із документами. Рекомендую.", color: "bg-rose-500", source: "x" },
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
            <GoogleIcon className="h-6 w-6 text-zinc-400" />
            <FacebookIcon className="h-6 w-6 text-zinc-400" />
            <ThreadsIcon className="h-6 w-6 text-zinc-400" />
            <XIcon className="h-6 w-6 text-zinc-400" />
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
                  <SourceIcon className="h-5 w-5 text-zinc-400" />
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
