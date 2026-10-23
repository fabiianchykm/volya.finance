// VIN для заявок Ukasko/МТСБУ: лише латиниця A–Z і цифри (МТСБУ: «Невірний формат VIN.
// В коді тільки цифри (0-9), латинські букви (A-Z)…», інцидент 23.10.2026). Клієнти
// часто вводять VIN з українськими літерами-двійниками (А, В, Е, К, М, Н, О, Р, С, Т, Х, І),
// пробілами чи дефісами — нормалізуємо, а не відхиляємо.

const CYR_TO_LAT: Record<string, string> = {
  "А": "A", "В": "B", "Е": "E", "К": "K", "М": "M", "Н": "H", "О": "O", "Р": "P", "С": "C", "Т": "T", "Х": "X", "І": "I", "У": "Y", "Ѕ": "S",
};

export function normalizeVin(raw: string): string {
  return raw
    .toUpperCase()
    .split("")
    .map((ch) => CYR_TO_LAT[ch] ?? ch)
    .join("")
    .replace(/[^A-Z0-9]/g, "");
}

/** Порожньо — ок (withoutVin); інакше 5–17 символів A–Z/0–9 після нормалізації. */
export function isValidVin(normalized: string): boolean {
  return normalized === "" || /^[A-Z0-9]{5,17}$/.test(normalized);
}
