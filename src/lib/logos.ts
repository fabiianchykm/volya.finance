// Мапа логотипів страхових. ТІЛЬКИ якісні формати: SVG / WebP / PNG.
// jpeg/jpg НЕ використовуємо для логотипів (немає прозорості, артефакти на тексті).
// Якщо для слага файлу немає — компонент показує ініціали (без 404-запитів).

import { formatCompanyName } from "./utils";

const LOGO_FILES: Record<string, string> = {
  arsenal: "/logos/arsenal.svg",
  arx: "/logos/arx.svg",
  "bbs-insurance": "/logos/bbs-insurance.webp",
  brokbyzness: "/logos/brokbyzness.png",
  eia: "/logos/eia.webp",
  esa: "/logos/esa.webp",
  euroins: "/logos/euroins.svg",
  express: "/logos/express.svg",
  guardian: "/logos/guardian.svg",
  ingo: "/logos/ingo.svg",
  inho: "/logos/ingo.svg",
  "inter-polis": "/logos/inter-polis.webp",
  interpolis: "/logos/interpolis.webp",
  knyazha: "/logos/knyazha.svg",
  oranta: "/logos/oranta.svg",
  pzu: "/logos/pzu.svg",
  tas: "/logos/tas.svg",
  unika: "/logos/uniqa.svg",
  usg: "/logos/usg.svg",
  ush: "/logos/usg.svg",
  utico: "/logos/utico.png",
  vuso: "/logos/vuso.webp",
  "yevroins-ukrayina": "/logos/euroins.svg",
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

// Транслітерація Ukr→Lat для отримання слага з назви компанії (та сама логіка,
// що в OfferCard). ь → '' (нульовий символ), а не '-'.
const TR: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ye", ж: "zh",
  з: "z", и: "y", і: "i", ї: "yi", й: "y", к: "k", л: "l", м: "m", н: "n",
  о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
  ч: "ch", ш: "sh", щ: "shch", ь: "", ю: "yu", я: "ya",
};
function transliterate(text: string): string {
  return text.toLowerCase().split("").map((c) => TR[c] ?? c).join("")
    .replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

/** Лого страхової за її публічною назвою (напр. з пропозиції Ukasko). */
export function companyLogo(publicName: string): string | null {
  return logoSrc(transliterate(formatCompanyName(publicName)));
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
