// Мапа логотипів страхових. ТІЛЬКИ якісні формати: SVG / WebP / PNG.
// jpeg/jpg НЕ використовуємо для логотипів (немає прозорості, артефакти на тексті).
// Якщо для слага файлу немає — компонент показує ініціали (без 404-запитів).

const LOGO_FILES: Record<string, string> = {
  arsenal: "/logos/arsenal.svg",
  arx: "/logos/arx.webp",
  "bbs-insurance": "/logos/bbs-insurance.webp",
  brokbyzness: "/logos/brokbyzness.png",
  eia: "/logos/eia.webp",
  esa: "/logos/esa.webp",
  euroins: "/logos/euroins.webp",
  express: "/logos/express.svg",
  guardian: "/logos/guardian.svg",
  ingo: "/logos/ingo.webp",
  inho: "/logos/inho.webp",
  "inter-polis": "/logos/inter-polis.webp",
  interpolis: "/logos/interpolis.webp",
  knyazha: "/logos/knyazha.svg",
  oranta: "/logos/oranta.webp",
  pzu: "/logos/pzu.webp",
  tas: "/logos/tas.webp",
  unika: "/logos/unika.webp",
  usg: "/logos/usg.webp",
  ush: "/logos/ush.webp",
  utico: "/logos/utico.png",
  vuso: "/logos/vuso.webp",
  "yevroins-ukrayina": "/logos/yevroins-ukrayina.webp",
};

// Аліаси: слаг транслітерованої назви з Ukasko → ключ файлу в LOGO_FILES.
// Потрібні, коли бренд-файл відрізняється від юридичної назви (UTICO, ББС),
// або коли транслітерація дає інше (Г→h: «ГАРДІАН» → "hardian").
const LOGO_ALIASES: Record<string, string> = {
  hardian: "guardian",                                // ГАРДІАН
  "bbs-inshurans": "bbs-insurance",                   // ББС Іншуранс
  bbs: "bbs-insurance",
  "ukrayinska-transportna": "utico",                  // Українська транспортна (страхова компанія)
  "ukrayinska-transportna-kompaniya": "utico",
  "ukrayinska-strakhova-hrupa": "usg",                // Українська страхова група
  "yevropeyskyy-strakhovyy-alyans": "eia",            // Європейський страховий альянс
  yesa: "eia",
  ekspres: "express",                                 // Експрес Страхування
  "ekspres-strakhuvannya": "express",
};

// Ніколи не віддаємо jpeg/jpg (додатковий захист, навіть якщо хтось додасть у мапу).
function safe(path: string | undefined): string | null {
  if (!path) return null;
  return /\.jpe?g$/i.test(path) ? null : path;
}

export function logoSrc(slug: string): string | null {
  const direct = safe(LOGO_FILES[slug]);
  if (direct) return direct;

  const aliased = LOGO_ALIASES[slug] && safe(LOGO_FILES[LOGO_ALIASES[slug]]);
  if (aliased) return aliased;

  const parts = slug.split("-").filter(Boolean);
  const resolve = (key: string): string | null =>
    safe(LOGO_FILES[key]) || (LOGO_ALIASES[key] ? safe(LOGO_FILES[LOGO_ALIASES[key]]) : null);

  // Пробуємо коротші версії, відкидаючи хвостові слова: "pzu-ukrayina" → "pzu".
  for (let i = parts.length - 1; i >= 1; i--) {
    const r = resolve(parts.slice(0, i).join("-"));
    if (r) return r;
  }
  // Бренд-слово може бути будь-де в довгій юридичній назві: шукаємо збіг за
  // парою токенів (inter-polis, bbs-insurance…) чи окремим токеном (knyazha, tas…).
  for (let i = 0; i < parts.length - 1; i++) {
    const r = resolve(`${parts[i]}-${parts[i + 1]}`);
    if (r) return r;
  }
  for (const t of parts) {
    const r = resolve(t);
    if (r) return r;
  }
  return null;
}
