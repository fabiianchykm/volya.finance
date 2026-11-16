// Константи подарункових сертифікатів, спільні для клієнта й сервера (без node-залежностей).
export const GIFT_PRESETS = [1000, 2000, 4000, 10000] as const;
export const GIFT_MIN = 500;
export const GIFT_MAX = 50000;
export const GIFT_VALID_MONTHS = 12;

// Реквізити для оплати переказом. IBAN — через NEXT_PUBLIC_GIFT_IBAN (поки порожній,
// сторінка пише «реквізити надішле менеджер»).
export const GIFT_PAYEE = {
  name: "ФОП Александров Володимир Петрович",
  ipn: "3397909111",
  iban: process.env.NEXT_PUBLIC_GIFT_IBAN ?? "",
};

// Старт продажів — 1 січня 2027 (за Києвом). До того форма показує картки й
// пропонує лишити телефон для нагадування; /api/gift заявки не приймає.
export const GIFT_LAUNCH_AT = new Date("2027-01-01T00:00:00+02:00");
export const GIFT_LAUNCH_LABEL = { uk: "1 січня 2027", en: "1 January 2027" };
export function isGiftLaunched(now = new Date()): boolean {
  return now.getTime() >= GIFT_LAUNCH_AT.getTime();
}
