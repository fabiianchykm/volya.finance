// Кожна страхова рахує ціну ОСЦПВ за віком РІЗНОЇ особи. Показуємо це на картці,
// щоб клієнт розумів, чию дату народження враховує конкретна СК (джерело — Ukasko).
// А ще — беремо ПРАВИЛЬНУ дату для розрахунку ціни кожної СК (osagoDobForCompany).

export type AgeBasisKind = "owner" | "youngest" | "policyholder" | "driver";
export interface AgeBasis { kind: AgeBasisKind; uk: string; en: string }

const OWNER: AgeBasis = { kind: "owner", uk: "власника авто", en: "the vehicle owner" };
const YOUNGEST: AgeBasis = { kind: "youngest", uk: "наймолодшого водія", en: "the youngest driver" };
const POLICYHOLDER: AgeBasis = { kind: "policyholder", uk: "страхувальника", en: "the policyholder" };
const DRIVER: AgeBasis = { kind: "driver", uk: "водія", en: "the driver" };

// Порядок важливий (специфічніше — раніше). «Ingo New» до «Ingo» (обидва → водій,
// але лишаємо явно). ЄСА, PZU тощо — за назвами з видачі Ukasko.
const RULES: { match: RegExp; basis: AgeBasis }[] = [
  { match: /вусо|vuso/i,                     basis: OWNER },
  { match: /\bусг\b|\busg\b/i,               basis: OWNER },
  { match: /уніка|uniqa/i,                   basis: OWNER },
  { match: /брокбізнес|брок|bbs|brock/i,     basis: YOUNGEST },
  { match: /\bтас\b|«тас»|\btas\b/i,         basis: YOUNGEST },
  { match: /експрес|express/i,               basis: YOUNGEST },
  { match: /євроінс|euroins/i,               basis: YOUNGEST },
  { match: /інго\s*нью|ingo\s*new/i,         basis: YOUNGEST },
  { match: /інго|ingo/i,                     basis: YOUNGEST },
  { match: /\bєса\b|европейс|європейс/i,     basis: YOUNGEST },
  { match: /гардіан|guardian/i,              basis: YOUNGEST },
  { match: /княжа/i,                         basis: POLICYHOLDER },
  { match: /інтер[\s-]?поліс|inter[\s-]?polis/i, basis: POLICYHOLDER },
  { match: /\bпзу\b|\bpzu\b/i,               basis: POLICYHOLDER },
  { match: /арсенал|arsenal/i,               basis: POLICYHOLDER },
  { match: /оранта|oranta/i,                 basis: DRIVER },
  { match: /утск|utsk|укр.*трансп/i,         basis: DRIVER },
];

export function osagoAgeBasis(companyName: string | undefined): AgeBasis | null {
  if (!companyName) return null;
  return RULES.find((r) => r.match.test(companyName))?.basis ?? null;
}

// Дати народження, які збирає калькулятор ОСЦПВ. owner — з реєстру за номером;
// policyholder/youngest — вводить клієнт (обовʼязкові). Вік «водія» окремо не питаємо
// → для СК, що рахують за водієм, беремо наймолодшого (консервативно й коректно для
// поодинокого водія).
export interface OsagoDobs {
  owner?: string;
  policyholder?: string;
  youngest?: string;
}

// Повертає ДАТУ (DD.MM.YYYY), за якою треба рахувати ціну конкретної СК, з розумними
// фолбеками, якщо потрібної дати немає. Порожньо → викликач підставляє свій дефолт.
export function osagoDobForBasis(kind: AgeBasisKind | undefined, dobs: OsagoDobs): string {
  const { owner = "", policyholder = "", youngest = "" } = dobs;
  switch (kind) {
    case "owner":
      return owner || policyholder || youngest;
    case "policyholder":
      return policyholder || owner || youngest;
    case "youngest":
    case "driver":
      return youngest || policyholder || owner;
    default:
      // Невідома основа — рахуємо за страхувальником (найпоширеніша).
      return policyholder || owner || youngest;
  }
}

export function osagoDobForCompany(companyName: string | undefined, dobs: OsagoDobs): string {
  return osagoDobForBasis(osagoAgeBasis(companyName)?.kind, dobs);
}
