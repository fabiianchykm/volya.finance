// Фірмові гліфи логотипа VOLYA.finance.
//
// Один геометричний модуль на все: «V» і безперекладинна «A» — одна й та сама
// фігура (висота 20, товщина штриха 3, кут нахилу однаковий), лише перевернута.
// Тому в слові VOLYA перша й остання літери римуються, а слово читається як
// один знак, а не «іконка + текст». V забарвлена брендовим градієнтом і зламана
// на дві грані (ліва світліша, права темніша) — ефект складеної стрічки.

const V_LEFT = "M0 0 L3.2 0 L10 13.6 L10 20 Z";
const V_RIGHT = "M10 20 L10 13.6 L16.8 0 L20 0 Z";

// Літера «A» без перекладини. Малюється currentColor; задавай висоту в em
// (h-[0.72em]) + align-baseline, щоб збігалась із висотою великих літер поруч.
export function BarlessA({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path d="M0 20 L10 0 L20 20 L16.8 20 L10 6.4 L3.2 20 Z" />
    </svg>
  );
}

// Градієнтна «V». `id` має бути унікальним на сторінці (градієнти — через <defs>).
// `tone`: "auto" — працює і на світлому, і на темному фоні (індиго→фіолет);
// "light" — для темних плашок/іконок (біла стрічка з напівпрозорою гранню).
export function VMark({ className, id = "vmark", tone = "auto" }: { className?: string; id?: string; tone?: "auto" | "light" }) {
  if (tone === "light") {
    return (
      <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
        <path d={V_LEFT} fill="#ffffff" />
        <path d={V_RIGHT} fill="#ffffff" fillOpacity="0.72" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-l`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#818cf8" />
          <stop offset="1" stopColor="#4f46e5" />
        </linearGradient>
        <linearGradient id={`${id}-r`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6d28d9" />
          <stop offset="1" stopColor="#4c1d95" />
        </linearGradient>
      </defs>
      <path d={V_LEFT} fill={`url(#${id}-l)`} />
      <path d={V_RIGHT} fill={`url(#${id}-r)`} />
    </svg>
  );
}

// Повний логотип-слово: V(градієнт) OLY A(безперекладинна) + «.finance».
// Розмір задається через font-size батька (усе в em), колір тексту — через `className`.
export function Wordmark({ id = "vmark", className = "", accentClassName = "text-indigo-600 dark:text-indigo-400" }: { id?: string; className?: string; accentClassName?: string }) {
  return (
    <span className={`inline-flex items-baseline whitespace-nowrap font-semibold uppercase leading-none tracking-[0.14em] ${className}`}>
      <VMark id={id} className="mr-[0.14em] inline-block h-[0.72em] w-auto self-end" />
      OLY<BarlessA className="inline-block h-[0.72em] w-auto align-baseline" />
      <span className={`ml-[0.04em] text-[0.68em] font-semibold normal-case tracking-tight ${accentClassName}`}>.finance</span>
    </span>
  );
}
