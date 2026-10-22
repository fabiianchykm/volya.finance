// Житло: Ukasko тримає ДВА довідники міст. Поле houseInfo.city (обʼєкт страхування)
// резолвиться з житлового (/directories/home/cities), а info.city (адреса
// страхувальника) — із ЗАГАЛЬНОГО (/directories/cities). Id у них різні, тому
// житловий id у info.city дає чуже місто (перевірено 22.10.2026: home#11915
// «м. Бережани» → general#11915 «с. Кошарне, Донецька обл.»). Тут — підбір
// відповідника в загальному довіднику за типом населеного пункту, назвою й областю.

export interface HomeCityEntry { id: number; name: string; name_full_name_ua?: string; region?: string }
export interface GeneralCityEntry { id: number; name_ua?: string; name?: string; name_full_name_ua?: string }

const TYPE_RE = /^(м\.|с\.|смт\.?|с-ще|сщ\.|с\/р)\s*/i;

export function bareCityName(name: string): string {
  return name.replace(TYPE_RE, "").trim();
}

function cityType(name: string): string | null {
  const m = name.match(TYPE_RE);
  return m ? m[1].replace(/\.$/, "").toLowerCase() : null;
}

function fullOf(c: GeneralCityEntry): string {
  return c.name_full_name_ua ?? "";
}

// Повертає запис загального довідника, що найкраще відповідає житловому місту,
// або null, якщо впевненого збігу немає (тоді краще нічого не підміняти).
export function pickGeneralCity(home: HomeCityEntry, general: GeneralCityEntry[]): GeneralCityEntry | null {
  const bare = bareCityName(home.name).toLowerCase();
  const type = cityType(home.name);
  const region = (home.region ?? home.name_full_name_ua?.split(",")[1] ?? "").replace(/область|обл\./gi, "").trim().toLowerCase();

  const sameName = general.filter((c) => {
    const n = (c.name_ua ?? c.name ?? "").trim().toLowerCase();
    return n === bare || fullOf(c).toLowerCase().startsWith(`${type ? type + ". " : ""}${bare},`) || fullOf(c).toLowerCase().startsWith(`${type ?? ""} ${bare},`.trim());
  });
  if (sameName.length === 0) return null;

  const sameType = type ? sameName.filter((c) => cityType(fullOf(c)) === type) : sameName;
  const pool = sameType.length > 0 ? sameType : sameName;
  if (region) {
    const inRegion = pool.find((c) => fullOf(c).toLowerCase().includes(region));
    if (inRegion) return inRegion;
    // Київ / Севастополь: область у житловому довіднику = назва міста.
    if (pool.length === 1 && sameName.length === 1) return pool[0];
    return null;
  }
  return pool.length === 1 ? pool[0] : null;
}
