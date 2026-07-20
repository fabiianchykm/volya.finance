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
  city: SavedCity | null;
  cityQuery: string;
  savedAt: number;
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

/** Зберегти профіль під email. Обрізає найстаріші записи, якщо їх забагато. */
export function saveProfile(p: Omit<CustomerProfile, "savedAt">): void {
  const email = normEmail(p.email);
  if (!email) return;
  try {
    const map = readMap();
    map[email] = { ...p, email, savedAt: Date.now() };

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
