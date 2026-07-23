// Мапа наявних логотипів страхових (згенеровано з public/logos).
// Запитуємо одразу правильний файл — без «промацування» форматів через onError,
// яке робило реальні 404-запити й засмічувало консоль/«Issues» у dev.
// Якщо для слага файлу немає — повертаємо null, і компонент показує ініціали.

const LOGO_FILES: Record<string, string> = {
  arsenal: "/logos/arsenal.svg",
  arx: "/logos/arx.webp",
  brokbyzness: "/logos/brokbyzness.png",
  "ekspres-strakhuvannya": "/logos/ekspres-strakhuvannya.jpeg",
  esa: "/logos/esa.webp",
  etalon: "/logos/etalon.jpeg",
  euroins: "/logos/euroins.webp",
  express: "/logos/express.jpeg",
  guardian: "/logos/guardian.png",
  ingo: "/logos/ingo.webp",
  inho: "/logos/inho.webp",
  "inter-polis": "/logos/inter-polis.webp",
  interpolis: "/logos/interpolis.webp",
  knyazha: "/logos/knyazha.webp",
  oranta: "/logos/oranta.webp",
  pzu: "/logos/pzu.webp",
  tas: "/logos/tas.jpeg",
  unika: "/logos/unika.webp",
  usg: "/logos/usg.webp",
  ush: "/logos/ush.webp",
  utico: "/logos/utico.jpeg",
  vuso: "/logos/vuso.webp",
  "yevroins-ukrayina": "/logos/yevroins-ukrayina.webp",
};

export function logoSrc(slug: string): string | null {
  return LOGO_FILES[slug] ?? null;
}
