// Довідники для «Віньєтки» (оплата платних доріг Європи). Без іконок, щоб
// імпортувати і в клієнтський флоу, і в серверний API. Ціни — орієнтовні
// офіційні тарифи операторів на 2026 рік для легковика до 3,5 т; точну суму
// називає менеджер (залежить від країни, строку й курсу).

export type Tr = { uk: string; en: string };

export interface VignetteCountry {
  code: string;
  flag: string;
  name: Tr;
  /** Доступні строки в цій країні (ключі з VIGNETTE_PERIODS). */
  periods: string[];
  /** Орієнтир «від» для найпопулярнішого короткого строку. */
  hint: Tr;
  /** Як працює: електронна за номером чи наліпка. */
  note: Tr;
}

export const VIGNETTE_COUNTRIES: VignetteCountry[] = [
  { code: "AT", flag: "🇦🇹", name: { uk: "Австрія", en: "Austria" }, periods: ["1d", "10d", "2m", "1y"], hint: { uk: "10 днів ≈ €12.80", en: "10 days ≈ €12.80" }, note: { uk: "Електронна, за номером авто (ASFINAG)", en: "Digital, by plate number (ASFINAG)" } },
  { code: "CZ", flag: "🇨🇿", name: { uk: "Чехія", en: "Czechia" }, periods: ["1d", "10d", "30d", "1y"], hint: { uk: "10 днів ≈ 310 Kč", en: "10 days ≈ CZK 310" }, note: { uk: "Електронна, за номером авто (edalnice)", en: "Digital, by plate number (edalnice)" } },
  { code: "SK", flag: "🇸🇰", name: { uk: "Словаччина", en: "Slovakia" }, periods: ["1d", "10d", "30d", "1y"], hint: { uk: "10 днів ≈ €12", en: "10 days ≈ €12" }, note: { uk: "Електронна, за номером авто (eznamka)", en: "Digital, by plate number (eznamka)" } },
  { code: "HU", flag: "🇭🇺", name: { uk: "Угорщина", en: "Hungary" }, periods: ["1d", "10d", "30d", "1y"], hint: { uk: "10 днів ≈ 6 900 Ft", en: "10 days ≈ HUF 6,900" }, note: { uk: "Електронна, за номером авто (e-matrica)", en: "Digital, by plate number (e-matrica)" } },
  { code: "SI", flag: "🇸🇮", name: { uk: "Словенія", en: "Slovenia" }, periods: ["7d", "30d", "1y"], hint: { uk: "7 днів ≈ €16", en: "7 days ≈ €16" }, note: { uk: "Електронна, за номером авто (DarsGo)", en: "Digital, by plate number (DarsGo)" } },
  { code: "CH", flag: "🇨🇭", name: { uk: "Швейцарія", en: "Switzerland" }, periods: ["1y"], hint: { uk: "рік ≈ CHF 40", en: "year ≈ CHF 40" }, note: { uk: "Лише річна, електронна за номером", en: "Annual only, digital by plate" } },
  { code: "RO", flag: "🇷🇴", name: { uk: "Румунія", en: "Romania" }, periods: ["1d", "10d", "30d", "1y"], hint: { uk: "10 днів ≈ €6", en: "10 days ≈ €6" }, note: { uk: "Електронна (rovinieta), за номером авто", en: "Digital (rovinieta), by plate number" } },
  { code: "BG", flag: "🇧🇬", name: { uk: "Болгарія", en: "Bulgaria" }, periods: ["1d", "7d", "30d", "1y"], hint: { uk: "7 днів ≈ €10", en: "7 days ≈ €10" }, note: { uk: "Електронна, за номером авто (bgtoll)", en: "Digital, by plate number (bgtoll)" } },
  { code: "MD", flag: "🇲🇩", name: { uk: "Молдова", en: "Moldova" }, periods: ["7d", "30d", "1y"], hint: { uk: "7 днів ≈ €4", en: "7 days ≈ €4" }, note: { uk: "Електронна, для авто з іноземною реєстрацією", en: "Digital, for foreign-registered cars" } },
];

export const VIGNETTE_PERIODS: { value: string; label: Tr }[] = [
  { value: "1d", label: { uk: "1 день", en: "1 day" } },
  { value: "7d", label: { uk: "7 днів", en: "7 days" } },
  { value: "10d", label: { uk: "10 днів", en: "10 days" } },
  { value: "30d", label: { uk: "30 днів", en: "30 days" } },
  { value: "2m", label: { uk: "2 місяці", en: "2 months" } },
  { value: "1y", label: { uk: "1 рік", en: "1 year" } },
];

export const VIGNETTE_VEHICLES: { value: string; label: Tr }[] = [
  { value: "car", label: { uk: "Легковий до 3,5 т", en: "Car up to 3.5 t" } },
  { value: "moto", label: { uk: "Мотоцикл", en: "Motorcycle" } },
  { value: "camper", label: { uk: "Кемпер / бус до 3,5 т", en: "Camper / van up to 3.5 t" } },
  { value: "heavy", label: { uk: "Понад 3,5 т (дорожній збір за км)", en: "Over 3.5 t (per-km toll)" } },
];

export function vignetteCountryName(code: string): string {
  return VIGNETTE_COUNTRIES.find((c) => c.code === code)?.name.uk ?? code;
}
export function vignettePeriodLabel(value: string): string {
  return VIGNETTE_PERIODS.find((p) => p.value === value)?.label.uk ?? value;
}
export function vignetteVehicleLabel(value: string): string {
  return VIGNETTE_VEHICLES.find((v) => v.value === value)?.label.uk ?? value;
}
