export const AUTO_CATEGORIES = [
  { value: "B1", label: "до 1600 см³", labelEn: "up to 1600 cm³ (Car)", type: "Легковий" },
  { value: "B2", label: "1601–2000 см³", labelEn: "1601–2000 cm³ (Car)", type: "Легковий" },
  { value: "B3", label: "2001–3000 см³", labelEn: "2001–3000 cm³ (Car)", type: "Легковий" },
  { value: "B4", label: "більше 3001 см³", labelEn: "over 3001 cm³ (Car)", type: "Легковий" },
  { value: "B5", label: "Електромобіль", labelEn: "Electric vehicle", type: "Легковий" },
  { value: "A1", label: "до 300 см³", labelEn: "Motorcycle up to 300 cm³", type: "Мотоцикл" },
  { value: "A2", label: "більше 300 см³", labelEn: "Motorcycle over 300 cm³", type: "Мотоцикл" },
  { value: "D1", label: "до 20 місць", labelEn: "Bus up to 20 seats", type: "Автобус" },
  { value: "D2", label: "більше 20 місць", labelEn: "Bus over 20 seats", type: "Автобус" },
  { value: "C1", label: "до 20 т", labelEn: "Truck up to 20 t", type: "Вантажний" },
  { value: "C2", label: "більше 20 т", labelEn: "Truck over 20 t", type: "Вантажний" },
  { value: "E", label: "до вантажних", labelEn: "Trailer for trucks", type: "Причіп" },
  { value: "F", label: "до легкових", labelEn: "Trailer for cars", type: "Причіп" },
] as const;

export const PERIODS = [
  { id: 15, label: "15 днів", type: "Тимчасова" },
  { id: 21, label: "21 день", type: "Тимчасова" },
  { id: 1, label: "1 місяць", type: "Тимчасова" },
  { id: 2, label: "2 місяці", type: "Тимчасова" },
  { id: 3, label: "3 місяці", type: "Тимчасова" },
  { id: 4, label: "4 місяці", type: "Тимчасова" },
  { id: 5, label: "5 місяців", type: "Тимчасова" },
  { id: 6, label: "6 місяців", type: "Постійна" },
  { id: 12, label: "12 місяців", type: "Постійна" },
] as const;

export const CUSTOMER_TYPES = [
  { id: 1, label: "Фізична особа" },
  { id: 2, label: "Юридична особа" },
  { id: 3, label: "Пільговик" },
] as const;

export const PRIVILEGES = [
  { id: 1, slug: "no", label: "Немає пільг", labelEn: "No benefits" },
  { id: 2, slug: "retired", label: "Пенсіонер", labelEn: "Pensioner" },
  { id: 3, slug: "war", label: "Учасник війни", labelEn: "War participant" },
  { id: 4, slug: "invalid", label: "Інвалід II групи", labelEn: "Person with disability group II" },
  { id: 5, slug: "chernobyl", label: "Постраждалий від ЧАЕС", labelEn: "Chornobyl survivor" },
  { id: 6, slug: "e_retired", label: "Пенсіонер (е-посвідчення)", labelEn: "Pensioner (e-certificate)" },
  { id: 7, slug: "maidan", label: "Учасник Революції Гідності", labelEn: "Participant of the Revolution of Dignity" },
  { id: 8, slug: "invalid_i", label: "Інвалід I групи", labelEn: "Person with disability group I" },
  { id: 9, slug: "invalid_war", label: "Інвалід внаслідок війни", labelEn: "Person with disability due to war" },
  { id: 10, slug: "ubd", label: "Учасник бойових дій", labelEn: "Participant of hostilities" },
] as const;

export const DOCUMENT_TYPES = [
  { id: 1, slug: "DOCUMENT_PASSPORT", label: "Паспорт" },
  { id: 2, slug: "DOCUMENT_EXTERNAL_PASSPORT", label: "Закордонний паспорт" },
  { id: 3, slug: "DOCUMENT_ID_CARD", label: "ID-карта" },
  { id: 4, slug: "DOCUMENT_DRIVERS_LICENSE", label: "Водійське посвідчення" },
  { id: 7, slug: "DOCUMENT_RETIREE", label: "Пенсійне посвідчення" },
  { id: 8, slug: "DOCUMENT_E_RETIREE", label: "Е-посвідчення пенсіонера" },
  { id: 9, slug: "DOCUMENT_VETERAN_CERTIFICATE", label: "Посвідчення УБД" },
] as const;

export const REGISTRATION_TYPES = [
  { id: 1, label: "Постійна реєстрація" },
  { id: 2, label: "Тимчасова реєстрація" },
  { id: 3, label: "Тимчасовий в'їзд" },
] as const;

// Бонус за покупку полісу — % від вартості, що нараховується на бонусний
// рахунок клієнта. Показується у пропозиціях (див. OfferCard, GreenCard/Tourism).
export const BONUS_RATE = 0.01; // 1%
