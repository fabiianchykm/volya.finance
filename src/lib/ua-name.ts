// ПІБ для заявок Ukasko: лише українська кирилиця, апостроф, дефіс і пробіл.
// Перевірено на проді 23.10.2026 (v2 oscpv/order/create, insurer.patronymic):
// латиниця, цифри, крапка та самотній «-» → 422 «має хибний формат»;
// «Ів'янович», «Ів’янович», «Іван-Петрович», ВЕЛИКІ/малі, пробіли по краях — ок.

const UA_NAME_RE = /^[А-ЯІЇЄҐа-яіїєґ'’ʼ`\-\s]+$/u;
// Плейсхолдери «немає по батькові»: «-», «—», «.», «н/д» тощо → порожньо.
const PLACEHOLDER_RE = /^[\s.\-–—_/нНдД]*$/u;

// Латинські літери-двійники → кирилиця (клієнт набрав «Iванович» або «Oлена» в латинській
// розкладці). Мапимо лише однозначні гомогліфи; справжня латиниця (v, g, zh…) лишається
// і далі дає помилку «введіть українською».
const LAT_TO_CYR: Record<string, string> = {
  A: "А", B: "В", C: "С", E: "Е", H: "Н", I: "І", K: "К", M: "М", O: "О", P: "Р", T: "Т", X: "Х", Y: "У",
  a: "а", c: "с", e: "е", i: "і", o: "о", p: "р", x: "х", y: "у", k: "к", m: "м", t: "т", h: "н", b: "в",
};

/** Прибирає зайві пробіли, замінює латинські двійники на кирилицю; плейсхолдер типу «-» → "". */
export function normalizeUaName(raw: string): string {
  const s = raw.replace(/\s+/g, " ").trim().split("").map((ch) => LAT_TO_CYR[ch] ?? ch).join("");
  return PLACEHOLDER_RE.test(s) ? "" : s;
}

/** true, якщо рядок порожній або складається лише з дозволених символів. */
export function isUaName(raw: string): boolean {
  const s = normalizeUaName(raw);
  return s === "" || UA_NAME_RE.test(s);
}

/** Підказка, чому імʼя не приймається (або null, якщо все добре). */
export function uaNameProblem(raw: string): "latin" | "chars" | null {
  const s = normalizeUaName(raw);
  if (!s || UA_NAME_RE.test(s)) return null;
  return /[A-Za-z]/.test(s) ? "latin" : "chars";
}
