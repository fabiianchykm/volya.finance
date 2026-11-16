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
