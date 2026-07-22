// Фірмовий знак «V» (volya) — дві грані, що утворюють V, як у логотипі бренду.
// Малюється поточним кольором (currentColor), тож усередині кольорового бейджа
// білий, а окремо може бути будь-якого кольору. Масштабується без втрат.

// Літера «A» без середньої поперечки (гострий трикутник) — стилізована під бренд.
// Малюється поточним кольором; висоту задавай в em (напр. h-[0.72em]) + align-baseline,
// щоб збігалася з висотою великих літер тексту поруч.
export function BarlessA({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path d="M0 20 L10 0 L20 20 L17 20 L10 6 L3 20 Z" />
    </svg>
  );
}

// Фірмовий знак «V» із фіолетовим градієнт-переливом (як у бренд-лого). Працює
// і на світлому, і на темному фоні. id має бути унікальним на сторінці (передаємо
// різний для хедера й футера), бо градієнт визначається через <linearGradient id>.
export function VMark({ className, id = "vmark" }: { className?: string; id?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c4b5fd" />
          <stop offset="1" stopColor="#6d28d9" />
        </linearGradient>
      </defs>
      {/* Ліва грань — рівномірна ширина, спадає вправо-вниз до низу V */}
      <path d="M3.6 3 L7.0 3 L12.5 21 L9.1 21 Z" fill={`url(#${id})`} />
      {/* Права грань — рівномірна (не звужується), іде від низу лівої вгору-вправо */}
      <path d="M16.6 3 L19.4 3 L15.7 21 L12.9 21 Z" fill={`url(#${id})`} />
    </svg>
  );
}
