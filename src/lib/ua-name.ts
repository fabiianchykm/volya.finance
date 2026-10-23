// ПІБ для заявок Ukasko: лише українська кирилиця, апостроф, дефіс і пробіл.
// Перевірено на проді 23.10.2026 (v2 oscpv/order/create, insurer.patronymic):
// латиниця, цифри, крапка та самотній «-» → 422 «має хибний формат»;
// «Ів'янович», «Ів’янович», «Іван-Петрович», ВЕЛИКІ/малі, пробіли по краях — ок.

const UA_NAME_RE = /^[А-ЯІЇЄҐа-яіїєґ'’ʼ`\-\s]+$/u;
// Плейсхолдери «немає по батькові»: «-», «—», «.», «н/д» тощо → порожньо.
const PLACEHOLDER_RE = /^[\s.\-–—_/нНдД]*$/u;

/** Прибирає зайві пробіли; плейсхолдер типу «-» перетворює на порожній рядок. */
export function normalizeUaName(raw: string): string {
  const s = raw.replace(/\s+/g, " ").trim();
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
