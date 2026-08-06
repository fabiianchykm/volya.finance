// Збереження профілю страхувальника НА ПРИСТРОЇ (localStorage), прив'язане до email.
// Мета: не вводити ті самі дані (ПІБ, ІПН, документ, адреса) щоразу. Коли користувач
// вводить свій email — форма підставляє раніше збережені дані.
//
// Приватність: дані лежать ЛИШЕ в браузері користувача (його пристрій), тому паспорт/
// ІПН не витікають іншим. Крос-девайс синхронізацію (з сервера) робимо окремо й лише
// для залогінених користувачів за їхнім власним email.

export interface SavedCity {
  id: number;
  name_ua: string;
  name_full_name_ua: string;
  zone: number;
}

export interface CustomerProfile {
  surname: string;
  name: string;
  patronymic: string;
  /** Латиницею (як у закордонному паспорті) — для Зеленої карти / Тварин / туристичного. */
  surnameLat?: string;
  nameLat?: string;
  /** Закордонний паспорт (для туристичного). */
  passportSerial?: string;
  passportNumber?: string;
  passportDate?: string;     // видачі, "дд.мм.рррр"
  passportEndDate?: string;  // дійсний до
  passportIssuedBy?: string;
  phone: string;            // 9 цифр без +380
  email: string;
  identificationCode: string;
  dateBirth: string;        // "дд.мм.рррр"
  street: string;
  house: string;
  docType: 1 | 3 | 4;
  docSerial: string;
  docNumber: string;
  docIssuedBy: string;
  docDate: string;          // "дд.мм.рррр"
  // Дані документа памʼятаються ОКРЕМО по кожному типу — щоб дані ID-картки ніколи
  // не показувались під «водійським» тощо. docType вгорі — лише «останній обраний».
  docByType?: Partial<Record<1 | 3 | 4, DocFields>>;
  city: SavedCity | null;
  cityQuery: string;
  savedAt: number;
}

export interface DocFields {
  serial: string;
  number: string;
  issuedBy: string;
  date: string;
}

const KEY = "volya_profiles";       // map: email(lower) → CustomerProfile
const LAST_KEY = "volya_last_email"; // останній використаний email
const MAX = 10;                      // не даємо мапі рости безмежно

type ProfileMap = Record<string, CustomerProfile>;

function readMap(): ProfileMap {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as ProfileMap) : {};
  } catch {
    return {};
  }
}

function normEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Зберегти профіль під email (частковий — кожен продукт пише лише свої поля).
 *  Мерджимо з наявним записом, щоб продукт без якогось поля (напр. ОСЦПВ не має
 *  латиниці/паспорта, туристичне — укр. ПІБ/ІПН) не затирав раніше збережене. */
export function saveProfile(p: Partial<Omit<CustomerProfile, "savedAt">> & { email: string }): void {
  const email = normEmail(p.email);
  if (!email) return;
  try {
    const map = readMap();
    const prev = map[email] ?? ({} as CustomerProfile);
    // Оновлюємо памʼять документа для АКТИВНОГО типу, зберігаючи дані інших типів.
    const activeType = p.docType ?? prev.docType ?? 3;
    const prevByType = prev.docByType ?? {};
    const docByType = { ...prevByType };
    if (p.docSerial !== undefined || p.docNumber !== undefined || p.docIssuedBy !== undefined || p.docDate !== undefined) {
      docByType[activeType] = {
        serial: p.docSerial ?? prevByType[activeType]?.serial ?? "",
        number: p.docNumber ?? prevByType[activeType]?.number ?? "",
        issuedBy: p.docIssuedBy ?? prevByType[activeType]?.issuedBy ?? "",
        date: p.docDate ?? prevByType[activeType]?.date ?? "",
      };
    }
    // Явна нормалізація: обовʼязкові рядкові поля не мають бути undefined,
    // інакше інпути стають uncontrolled. Опційні (латиниця/паспорт) лишаємо як є.
    map[email] = {
      surname: p.surname ?? prev.surname ?? "",
      name: p.name ?? prev.name ?? "",
      patronymic: p.patronymic ?? prev.patronymic ?? "",
      surnameLat: p.surnameLat ?? prev.surnameLat,
      nameLat: p.nameLat ?? prev.nameLat,
      phone: p.phone ?? prev.phone ?? "",
      email,
      identificationCode: p.identificationCode ?? prev.identificationCode ?? "",
      dateBirth: p.dateBirth ?? prev.dateBirth ?? "",
      street: p.street ?? prev.street ?? "",
      house: p.house ?? prev.house ?? "",
      docType: activeType,
      docSerial: p.docSerial ?? prev.docSerial ?? "",
      docNumber: p.docNumber ?? prev.docNumber ?? "",
      docIssuedBy: p.docIssuedBy ?? prev.docIssuedBy ?? "",
      docDate: p.docDate ?? prev.docDate ?? "",
      docByType,
      city: p.city ?? prev.city ?? null,
      cityQuery: p.cityQuery ?? prev.cityQuery ?? "",
      passportSerial: p.passportSerial ?? prev.passportSerial,
      passportNumber: p.passportNumber ?? prev.passportNumber,
      passportDate: p.passportDate ?? prev.passportDate,
      passportEndDate: p.passportEndDate ?? prev.passportEndDate,
      passportIssuedBy: p.passportIssuedBy ?? prev.passportIssuedBy,
      savedAt: Date.now(),
    };

    // Тримаємо не більше MAX найсвіжіших профілів.
    const entries = Object.entries(map).sort((a, b) => b[1].savedAt - a[1].savedAt);
    const trimmed: ProfileMap = {};
    for (const [k, v] of entries.slice(0, MAX)) trimmed[k] = v;

    localStorage.setItem(KEY, JSON.stringify(trimmed));
    localStorage.setItem(LAST_KEY, email);
  } catch {
    // localStorage може бути недоступний (приватний режим, квота) — просто пропускаємо.
  }
}

/** Профіль за конкретним email (або null). */
export function loadProfile(email: string): CustomerProfile | null {
  const e = normEmail(email);
  if (!e) return null;
  const map = readMap();
  return map[e] ?? null;
}

/** Найсвіжіший збережений профіль (для автопідстановки при відкритті форми). */
export function loadLastProfile(): CustomerProfile | null {
  try {
    const last = localStorage.getItem(LAST_KEY);
    const map = readMap();
    if (last && map[last]) return map[last];
    // fallback — найсвіжіший за часом
    const entries = Object.values(map).sort((a, b) => b.savedAt - a.savedAt);
    return entries[0] ?? null;
  } catch {
    return null;
  }
}
