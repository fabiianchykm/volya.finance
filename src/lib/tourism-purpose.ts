// Мета поїздки — поле заявки Ukasko v2 (необовʼязкове, дефолт travel). На ціну не
// впливає (калькулятори його не приймають), але йде в договір як заявлена мета:
// робота/спорт під «туризмом» — привід для відмови у виплаті. Обирається в
// калькуляторі (до списку пропозицій), щоб клієнт одразу бачив, що програма
// «econom» без активностей йому не підходить.
export const TRIP_PURPOSES = [
  { v: "travel", uk: "Туризм, відпочинок", en: "Tourism, leisure" },
  { v: "business_travel", uk: "Відрядження", en: "Business trip" },
  { v: "work", uk: "Робота за кордоном", en: "Work abroad" },
  { v: "teaching", uk: "Навчання", en: "Studies" },
  { v: "activeTravel", uk: "Активний відпочинок", en: "Active leisure" },
  { v: "sport", uk: "Аматорський спорт", en: "Amateur sport" },
  { v: "professionalSports", uk: "Професійний спорт", en: "Professional sport" },
  { v: "extrim", uk: "Екстремальний відпочинок", en: "Extreme activities" },
] as const;

export type TripPurpose = (typeof TRIP_PURPOSES)[number]["v"];

export const DEFAULT_TRIP_PURPOSE: TripPurpose = "travel";

export function isTripPurpose(v: unknown): v is TripPurpose {
  return typeof v === "string" && TRIP_PURPOSES.some((p) => p.v === v);
}

// Мета з активностями при програмі «econom» (без активностей) — попереджаємо, не блокуємо.
const ACTIVE_PURPOSES: ReadonlySet<string> = new Set(["activeTravel", "sport", "professionalSports", "extrim"]);
export const isActivePurpose = (p: string): boolean => ACTIVE_PURPOSES.has(p);

// Програма без активностей (у видачі Ukasko — tripProgram "econom").
export const isEconomProgram = (tripProgram: string | null | undefined): boolean => (tripProgram ?? "").toLowerCase() === "econom";
