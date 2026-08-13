// Довідник страхових для каталогу + профілю + відгуків.
// ⚠️ Поля профілю (about/founded/offices/phones/website) — ПРИКЛАД/ЗАГЛУШКА.
// Заміни на реальні дані. `match` — щоб визначити, чи купував користувач поліс
// саме цієї СК (порівняння з policy.company).

// Розділ страхових (каталог /insurers + профілі + відгуки) ТИМЧАСОВО заморожений,
// поки не додані реальні дані профілів. Повернути у false — щоб знову увімкнути.
export const INSURERS_FROZEN = true;

export interface InsurerProfile {
  slug: string;
  name: string;         // публічна назва для показу
  match: RegExp;        // матч на назву компанії в полісі
  founded?: string;     // рік заснування (приклад)
  about?: string;       // короткий опис/історія (приклад)
  offices?: string[];   // адреси офісів (приклад)
  phones?: string[];    // контактні телефони (приклад)
  website?: string;     // офіційний сайт
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

export const INSURERS: InsurerProfile[] = [
  { slug: "inho",         name: "ІНГО",          match: /інго|ingo/i,                 website: "https://ingo.ua", ...SAMPLE },
  { slug: "pzu",          name: "PZU",           match: /\bpzu\b|пзу/i,               website: "https://pzu.com.ua", ...SAMPLE },
  { slug: "arx",          name: "ARX",           match: /\barx\b|аркс/i,              website: "https://arx.com.ua", ...SAMPLE },
  { slug: "unika",        name: "Уніка",         match: /уніка|uniqa/i,               website: "https://uniqa.ua", ...SAMPLE },
  { slug: "oranta",       name: "Оранта",        match: /оранта/i,                    website: "https://oranta.ua", ...SAMPLE },
  { slug: "knyazha",      name: "Княжа",         match: /княжа/i,                     website: "https://kniazha.ua", ...SAMPLE },
  { slug: "usg",          name: "УСГ",           match: /\bусг\b|\busg\b/i,           ...SAMPLE },
  { slug: "vuso",         name: "ВУСО",          match: /вусо|vuso/i,                 website: "https://vuso.ua", ...SAMPLE },
  { slug: "tas",          name: "ТАС",           match: /\bтас\b|«тас»|\btas\b/i,     website: "https://sg.tas.ua", ...SAMPLE },
  { slug: "euroins",      name: "Євроінс",       match: /євроінс|euroins/i,           website: "https://euroins.com.ua", ...SAMPLE },
  { slug: "arsenal",      name: "Арсенал",       match: /арсенал/i,                   website: "https://arsenal-ic.ua", ...SAMPLE },
  { slug: "brokbyzness",  name: "Брокбізнес / BBS", match: /брокбізнес|bbs/i,         ...SAMPLE },
  { slug: "express",      name: "Експрес",       match: /експрес|express/i,           ...SAMPLE },
  { slug: "guardian",     name: "Гардіан",       match: /гардіан|guardian/i,          ...SAMPLE },
  { slug: "inter-polis",  name: "Інтер-Поліс",   match: /інтер[\s-]?поліс|inter[\s-]?polis/i, ...SAMPLE },
  { slug: "utico",        name: "ЮТІКО",         match: /ютіко|ютико|utico/i,         ...SAMPLE },
  { slug: "eia",          name: "ЄСА",           match: /\bєса\b|европейс|європейс/i, ...SAMPLE },
];

export function getInsurer(slug: string): InsurerProfile | undefined {
  return INSURERS.find((i) => i.slug === slug);
}

// Чи є в переліку компаній (з полісів) така, що належить цій СК.
export function matchesInsurer(slug: string, companyNames: (string | null | undefined)[]): boolean {
  const ins = getInsurer(slug);
  if (!ins) return false;
  return companyNames.some((c) => !!c && ins.match.test(c));
}
