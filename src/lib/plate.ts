// Нормалізація держномера для API Ukasko: верхній регістр, без пробілів/дефісів,
// кирилиця, що виглядає як латиниця (А В С Е Н І К М О Р Т Х), → латиниця.
// Використовується в пошуку авто за номером і в калькуляторі ОСЦПВ v2 (carNumber).
const CYR_TO_LAT: Record<string, string> = {
  А: "A", В: "B", С: "C", Е: "E", Н: "H", І: "I", К: "K", М: "M", О: "O", Р: "P", Т: "T", Х: "X",
};

export function normalizePlate(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[\s-]/g, "")
    .split("")
    .map((ch) => CYR_TO_LAT[ch] ?? ch)
    .join("");
}
