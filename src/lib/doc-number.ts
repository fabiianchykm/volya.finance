// Серія і номер документа для Ukasko ЗАВЖДИ йдуть окремими полями: serial="GH",
// number="636131". Клієнти ж вводять їх одним рядком («GH636131», «СН 123456»,
// «FA-123456») — або все в номер, або все в серію. Розбиваємо на бекенді/при
// формуванні payload, щоб форма могла лишатися з одним полем.
//
// Інцидент 21.10.2026: туризм, СК «Респект» — number="GH636131", serial="" →
// OTP не генерувався (500 «Сталася помилка перевірки коду ОТП»).

const LETTERS = "A-Za-zА-Яа-яІіЇїЄєҐґ";
const COMBINED_RE = new RegExp(`^([${LETTERS}]{1,3})[\\s-]*(\\d{4,9})$`);

/** Повертає {serial, number} як їх очікує Ukasko: серія окремо, номер — лише цифри. */
export function splitDocSerialNumber(serialRaw: unknown, numberRaw: unknown): { serial: string; number: string } {
  const serial0 = String(serialRaw ?? "").trim();
  const number0 = String(numberRaw ?? "").trim();

  // «Серія+номер» у полі номера → розбити; серія з поля номера має пріоритет
  // (клієнт щойно її бачив і вводив), навіть якщо окреме поле серії заповнене.
  const m = number0.replace(/\s+/g, " ").match(COMBINED_RE);
  if (m) return { serial: m[1].toUpperCase(), number: m[2] };

  // Серія порожня, а все записано в полі серії («GH636131», коли номер порожній).
  if (!number0) {
    const ms = serial0.replace(/\s+/g, " ").match(COMBINED_RE);
    if (ms) return { serial: ms[1].toUpperCase(), number: ms[2] };
  }

  // Номер починається з тієї самої серії, що й окреме поле («GH» + «GH636131»).
  // Дефіс у серії лишаємо: для ID-картки в цьому полі може бути УНЗР («19910520-01234»).
  const serial = serial0.replace(/\s+/g, "").toUpperCase();
  let number = number0.replace(/[\s-]/g, "");
  if (serial && number.toUpperCase().startsWith(serial) && /^\d+$/.test(number.slice(serial.length))) {
    number = number.slice(serial.length);
  }
  return { serial, number };
}
