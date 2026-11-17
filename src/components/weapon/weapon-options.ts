// Довідники форми «Страхування зброї». Окремий модуль без іконок, щоб імпортувати
// і в клієнтський флоу, і в серверний API (валідація значень).

export type Tr = { uk: string; en: string };

export const WEAPON_TYPES: { value: string; label: Tr }[] = [
  { value: "hunting-smooth", label: { uk: "Мисливська гладкоствольна", en: "Hunting smoothbore" } },
  { value: "hunting-rifled", label: { uk: "Мисливська нарізна", en: "Hunting rifled" } },
  { value: "traumatic", label: { uk: "Травматична / газова", en: "Traumatic / gas" } },
  { value: "pneumatic", label: { uk: "Пневматична", en: "Pneumatic" } },
  { value: "cold", label: { uk: "Холодна", en: "Cold steel" } },
  { value: "other", label: { uk: "Інша (нагородна, колекційна)", en: "Other (award, collectible)" } },
];

export const WEAPON_TERMS: { value: string; label: Tr }[] = [
  { value: "1", label: { uk: "1 рік", en: "1 year" } },
  { value: "3", label: { uk: "3 роки (на строк дозволу)", en: "3 years (permit term)" } },
];

export const WEAPON_SUMS: { value: number; label: Tr }[] = [
  { value: 100_000, label: { uk: "100 000 ₴", en: "UAH 100,000" } },
  { value: 250_000, label: { uk: "250 000 ₴", en: "UAH 250,000" } },
  { value: 500_000, label: { uk: "500 000 ₴", en: "UAH 500,000" } },
  { value: 1_000_000, label: { uk: "1 000 000 ₴", en: "UAH 1,000,000" } },
];

export const WEAPON_MAX_UNITS = 20;

export function weaponTypeLabel(value: string): string {
  return WEAPON_TYPES.find((w) => w.value === value)?.label.uk ?? value;
}
