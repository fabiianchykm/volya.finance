// Калькулятори Ukasko віддають 200 і список пропозицій, а збої окремих СК кладуть в
// errorInfo: [{ errorText, step, moduleName, code? }]. errorText — що завгодно: HTML
// «403 Forbidden» від nginx СК, JSON з message, PHP-трейс, «cURL error 28». Тут —
// людське зведення для клієнта: яка СК і чому не порахувала.

export interface InsurerErrorRaw { errorText?: unknown; step?: unknown; moduleName?: unknown; code?: unknown }
export type InsurerFailReason = "unavailable" | "plate" | "rejected";
export interface InsurerFailure { module: string; name: string; reason: InsurerFailReason; detail: string }

// moduleName Ukasko → публічна назва СК (невідомі — як є, з великої).
const MODULE_NAMES: Record<string, string> = {
  ingo: "ІНГО", pzu: "PZU", arx: "ARX", uniqa: "Уніка", unika: "Уніка", oranta: "Оранта", knyazha: "Княжа",
  kniazha: "Княжа", usg: "УСГ", vuso: "ВУСО", tas: "ТАС", euroins: "Євроінс", arsenal: "Арсенал",
  bbs: "ББС Іншуранс", brokbusiness: "Брокбізнес", express: "Експрес", guardian: "Гардіан",
  interpolis: "Інтер-Поліс", "inter-polis": "Інтер-Поліс", utico: "ЮТІКО", utsk: "УТСК", esa: "ЄСА", eia: "ЄСА",
  respect: "Респект", colonnade: "Колоннейд", credo: "Кредо", universalna: "Універсальна", ultra: "Ультра",
  salamandra: "Саламандра", persha: "Перша", mega: "Мега-Гарант", alfa: "Альфа Страхування",
};

export function insurerPublicName(module: string): string {
  const m = module.trim().toLowerCase();
  if (MODULE_NAMES[m]) return MODULE_NAMES[m];
  return m ? m.charAt(0).toUpperCase() + m.slice(1) : "Страхова";
}

function textOf(v: unknown): string {
  if (typeof v === "string") return v;
  if (v && typeof v === "object") { try { return JSON.stringify(v); } catch { return ""; } }
  return v == null ? "" : String(v);
}

// Витягує людський фрагмент із errorText: message з JSON або перший рядок без HTML.
function detailOf(raw: string): string {
  const m = raw.match(/"message"\s*:\s*"([^"]{3,160})"/);
  if (m) return m[1];
  return raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 120);
}

export function summarizeInsurerErrors(errorInfo: unknown): InsurerFailure[] {
  if (!Array.isArray(errorInfo)) return [];
  const out: InsurerFailure[] = [];
  const seen = new Set<string>();
  for (const e of errorInfo as InsurerErrorRaw[]) {
    const mod = textOf(e?.moduleName).trim().toLowerCase() || "unknown";
    if (seen.has(mod)) continue;
    seen.add(mod);
    const raw = textOf(e?.errorText);
    const code = Number(e?.code);
    const detail = detailOf(raw);
    let reason: InsurerFailReason = "rejected";
    if (/формат[\s\S]{0,12}реєстраційн|держномер|carNumber|реєстраційн[^\s]* номер/i.test(raw)) reason = "plate";
    else if (code === 403 || code >= 500 || /403 Forbidden|50\d\b|cURL error|timed? ?out|Unable to connect|ECONNRESET|<html|Server Error|exception|must be of the type|non-object|Undefined (index|offset)/i.test(raw)) reason = "unavailable";
    out.push({ module: mod, name: insurerPublicName(mod), reason, detail });
  }
  return out;
}

// Один короткий рядок для плашки над списком (укр).
export function insurerFailuresText(failures: InsurerFailure[]): string {
  if (!failures.length) return "";
  const unavailable = failures.filter((f) => f.reason === "unavailable").map((f) => f.name);
  const plate = failures.filter((f) => f.reason === "plate").map((f) => f.name);
  const rejected = failures.filter((f) => f.reason === "rejected");
  const parts: string[] = [];
  if (unavailable.length) parts.push(`${unavailable.join(", ")} — тимчасово не відповіда${unavailable.length > 1 ? "ють" : "є"}`);
  if (plate.length) parts.push(`${plate.join(", ")} — не прийма${plate.length > 1 ? "ють" : "є"} цей формат держномера`);
  for (const r of rejected) parts.push(`${r.name} — ${r.detail || "відмовила в розрахунку"}`);
  return parts.join("; ");
}
