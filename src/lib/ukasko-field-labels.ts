// Тексти валідації Ukasko v2 містять технічні назви полів («Поле insurer.patronymic
// має хибний формат.») — підміняємо на людські, щоб клієнт зрозумів, що виправити.
export const V2_FIELD_LABELS: Record<string, string> = {
  "insurer.surname": "Прізвище", "insurer.name": "Імʼя", "insurer.patronymic": "По батькові",
  "insurer.phone": "Телефон", "insurer.email": "Email", "insurer.dateBirth": "Дата народження",
  "insurer.identificationCode": "ІПН", "insurer.street": "Вулиця", "insurer.house": "Будинок",
  "insurer.cityId": "Місто", "insurer.document.serial": "Серія документа", "insurer.document.number": "Номер документа",
  "insurer.document.dateOfIssue": "Дата видачі документа", "insurer.document.issuedBy": "Ким виданий документ",
  "vehicle.vin": "VIN", "vehicle.number": "Держномер", "vehicle.brand": "Марка авто", "vehicle.model": "Модель авто",
};
export function humanizeV2FieldErrors(message: string): string {
  let out = message;
  for (const [field, label] of Object.entries(V2_FIELD_LABELS)) {
    const f = field.replace(/\./g, "\\.");
    out = out
      .replace(new RegExp(`Поле ${f} має хибний формат\\.?`, "g"), `${label}: невірний формат (лише українські літери).`)
      .replace(new RegExp(`Поле ${f}`, "g"), `Поле «${label}»`)
      .replace(new RegExp(`(^|[^\\w.])${f}(?![\\w.])`, "g"), `$1«${label}»`);
  }
  return out;
}
