// Довідник страхових для каталогу + профілю + відгуків.
// ⚠️ Поля профілю (about/founded/offices/phones/website) — ПРИКЛАД/ЗАГЛУШКА.
// Заміни на реальні дані. `match` — щоб визначити, чи купував користувач поліс
// саме цієї СК (порівняння з policy.company).

// Розділ страхових (каталог /insurers + профілі + відгуки). false → увімкнено.
// Профілі показують лише реальні дані (назва, лого, сайт) + відгуки; приклад-поля
// (about/offices/phones) на сторінці НЕ рендеряться, поки нема реальних.
export const INSURERS_FROZEN = false;

export interface InsurerProfile {
  slug: string;
  name: string;         // публічна назва для показу
  match: RegExp;        // матч на назву компанії в полісі
  founded?: string;     // рік заснування (приклад)
  about?: string;       // короткий опис/історія (приклад)
  offices?: string[];   // адреси офісів (приклад)
  phones?: string[];    // контактні телефони (приклад)
  website?: string;     // офіційний сайт
  /** Показники ОСЦПВ з дашборду МТСБУ (вносимо вручну щокварталу, період — MTSBU_PERIOD). */
  mtsbu?: { settlementDays?: number; complaintsPer10k?: number };
  /** Рік заснування в Україні (перевірено за джерелами 20.11.2026; без даних — не показуємо). */
  foundedYear?: number;
  /** Країна капіталу (материнська група): прапор + назва. */
  origin?: { flag: string; country: string; group?: string };
}

// Приклад-профіль (однаковий шаблон) — щоб було видно, як виглядатиме сторінка.
const SAMPLE = {
  founded: "приклад: 2005",
  about:
    "Приклад опису: тут буде коротка історія страхової компанії, її спеціалізація, "
    + "ключові показники та переваги. Замініть на реальний текст.",
  offices: ["приклад: вул. Прикладна, 1, Київ", "приклад: вул. Демонстраційна, 10, Львів"],
  phones: ["0 800 00 00 00 (приклад)"],
};

/** Період показників МТСБУ в полі mtsbu (підпис на сайті). Оновлювати разом із цифрами. */
export const MTSBU_PERIOD = "3 кв. 2026";
/** Звідки взято показники МТСБУ (посилання біля цифр). */
export const MTSBU_SOURCE_URL = "https://mtsbu.ua/about/statistics";

export const INSURERS: InsurerProfile[] = [
  { slug: "inho",         name: "ІНГО",          match: /інго|ingo/i,                 website: "https://ingo.ua", ...SAMPLE, origin: { flag: "🇺🇦", country: "Україна" } },
  { slug: "pzu",          name: "PZU",           match: /\bpzu\b|пзу/i,               website: "https://pzu.com.ua", ...SAMPLE, foundedYear: 1993, origin: { flag: "🇵🇱", country: "Польща", group: "PZU Group" } },
  { slug: "arx",          name: "ARX",           match: /\barx\b|аркс/i,              website: "https://arx.com.ua", ...SAMPLE, foundedYear: 1994, origin: { flag: "🇨🇦", country: "Канада", group: "Fairfax Financial" } },
  { slug: "unika",        name: "Уніка",         match: /уніка|uniqa/i,               website: "https://uniqa.ua", ...SAMPLE, origin: { flag: "🇦🇹", country: "Австрія", group: "UNIQA Group" } },
  { slug: "oranta",       name: "Оранта",        match: /оранта/i,                    website: "https://oranta.ua", ...SAMPLE, origin: { flag: "🇺🇦", country: "Україна" } },
  { slug: "knyazha",      name: "Княжа",         match: /княжа/i,                     website: "https://kniazha.ua", ...SAMPLE, foundedYear: 1997, origin: { flag: "🇦🇹", country: "Австрія", group: "Vienna Insurance Group" } },
  { slug: "usg",          name: "УСГ",           match: /усг|\busg\b/i,               ...SAMPLE, foundedYear: 2000, origin: { flag: "🇦🇹", country: "Австрія", group: "Vienna Insurance Group" } },
  { slug: "vuso",         name: "ВУСО",          match: /вусо|vuso/i,                 website: "https://vuso.ua", ...SAMPLE, foundedYear: 2001, origin: { flag: "🇺🇦", country: "Україна" } },
  { slug: "tas",          name: "ТАС",           match: /(^|[^а-яіїєґa-z])тас($|[^а-яіїєґa-z])|\btas\b/i,     website: "https://sg.tas.ua", ...SAMPLE, foundedYear: 1998, origin: { flag: "🇺🇦", country: "Україна" } },
  { slug: "euroins",      name: "Євроінс",       match: /євроінс|euroins/i,           website: "https://euroins.com.ua", ...SAMPLE, origin: { flag: "🇧🇬", country: "Болгарія", group: "Eurohold" } },
  { slug: "arsenal",      name: "Арсенал",       match: /арсенал/i,                   website: "https://arsenal-ic.ua", ...SAMPLE, foundedYear: 2005, origin: { flag: "🇺🇦", country: "Україна" } },
  { slug: "brokbyzness",  name: "Брокбізнес / BBS", match: /брокбізнес|ббс|bbs/i,     ...SAMPLE, origin: { flag: "🇺🇦", country: "Україна" } },
  { slug: "express",      name: "Експрес",       match: /експрес|express/i,           ...SAMPLE, origin: { flag: "🇺🇦", country: "Україна" } },
  { slug: "guardian",     name: "Гардіан",       match: /гардіан|guardian/i,          ...SAMPLE, foundedYear: 2007, origin: { flag: "🇺🇦", country: "Україна" } },
  { slug: "inter-polis",  name: "Інтер-Поліс",   match: /інтер[\s-]?поліс|inter[\s-]?polis/i, ...SAMPLE, foundedYear: 1993, origin: { flag: "🇺🇦", country: "Україна" } },
  { slug: "utico",        name: "ЮТІКО",         match: /ютіко|ютико|utico/i,         ...SAMPLE, origin: { flag: "🇺🇦", country: "Україна" } },
  { slug: "utsk",         name: "УТСК",          match: /утск|utsk|українська транспортна|укр.*трансп/i, ...SAMPLE, origin: { flag: "🇺🇦", country: "Україна" } },
  { slug: "eia",          name: "ЄСА",           match: /(^|[^а-яіїєґa-z])єса($|[^а-яіїєґa-z])|европейс|європейс/i, ...SAMPLE, origin: { flag: "🇺🇦", country: "Україна" } },
];

/** Відгуки про сам сервіс volya.finance зберігаються в тій самій таблиці під цим слагом. */
export const SERVICE_REVIEW_SLUG = "volya";
export const SERVICE_REVIEW_NAME = "volya.finance";

/** Профіль для відгуків: страхова за слагом або псевдо-профіль сервісу (будь-який поліс = клієнт). */
export function getReviewTarget(slug: string): { slug: string; name: string; match: RegExp } | undefined {
  if (slug === SERVICE_REVIEW_SLUG) return { slug, name: SERVICE_REVIEW_NAME, match: /./ };
  const ins = getInsurer(slug);
  return ins ? { slug: ins.slug, name: ins.name, match: ins.match } : undefined;
}

export function getInsurer(slug: string): InsurerProfile | undefined {
  return INSURERS.find((i) => i.slug === slug);
}

// Чи є в переліку компаній (з полісів) така, що належить цій СК.
export function matchesInsurer(slug: string, companyNames: (string | null | undefined)[]): boolean {
  const ins = getInsurer(slug);
  if (!ins) return false;
  return companyNames.some((c) => !!c && ins.match.test(c));
}

export function insurerBySlug(slug: string | null | undefined): InsurerProfile | undefined {
  return slug ? INSURERS.find((i) => i.slug === slug) : undefined;
}
