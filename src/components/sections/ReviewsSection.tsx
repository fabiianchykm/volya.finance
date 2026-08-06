import { Quote } from "lucide-react";

// ⚠️ ЗАГОТОВКИ-ПРИКЛАДИ. Заміни на РЕАЛЬНІ відгуки клієнтів (або підтягуй з Google-
// відгуків). Вигадані відгуки на фінансовому сайті — ризик довіри й законодавства.
const reviews = [
  { name: "Андрій", city: "Київ", text: "Оформив автоцивілку за 5 хвилин, без черг. Ціна виявилась дешевшою, ніж я платив раніше.", color: "bg-indigo-500" },
  { name: "Оксана", city: "Львів", text: "Порівняла кілька страхових і одразу обрала найвигіднішу. Поліс прийшов на пошту миттєво.", color: "bg-emerald-500" },
  { name: "Дмитро", city: "Одеса", text: "Зробив зелену карту перед поїздкою за кордон прямо з телефону. Дуже зручно й швидко.", color: "bg-amber-500" },
  { name: "Ірина", city: "Харків", text: "Підтримка відповіла швидко й допомогла розібратись із документами. Рекомендую.", color: "bg-rose-500" },
  { name: "Сергій", city: "Дніпро", text: "Все чесно й прозоро — жодних прихованих платежів. Наступний поліс оформлю тут же.", color: "bg-sky-500" },
  { name: "Наталія", city: "Вінниця", text: "Туристичне для всієї родини оформила за кілька хвилин. Ціни приємно здивували.", color: "bg-violet-500" },
];

export function ReviewsSection() {
  // Дублюємо список — для безшовного «бігучого» ряду (translateX -50%).
  const row = [...reviews, ...reviews];

  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="mx-auto mb-12 max-w-2xl px-4 text-center sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">Відгуки клієнтів</h2>
      </div>

      {/* Один горизонтальний ряд, що плавно рухається (пауза на наведення) */}
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-white to-transparent sm:w-24" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-white to-transparent sm:w-24" />
        <div className="animate-marquee">
          {row.map(({ name, city, text, color }, i) => (
            <div
              key={i}
              className="mr-4 flex min-h-[240px] w-[290px] shrink-0 flex-col rounded-2xl bg-[#FAFAFA] p-6 ring-1 ring-zinc-200/50"
            >
              <Quote className="mb-3 h-6 w-6 text-zinc-200" />
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
          ))}
        </div>
      </div>
    </section>
  );
}
