// Спільні хелпери для українських номерів (ліди КАСКО / Зелена карта).

/** Нормалізує український номер до вигляду +380XXXXXXXXX (best-effort). */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("380")) return `+${digits}`;
  if (digits.length === 10 && digits.startsWith("0")) return `+38${digits}`;
  if (digits.length === 9) return `+380${digits}`;
  return raw.trim();
}

/** Груба перевірка, що це схоже на телефон (9–13 цифр). */
export function isValidPhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 9 && digits.length <= 13;
}
