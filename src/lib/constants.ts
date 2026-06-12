export const AUTO_CATEGORIES = [
  { value: "B1", label: "до 1600 см³", type: "Легковий" },
  { value: "B2", label: "1601–2000 см³", type: "Легковий" },
  { value: "B3", label: "2001–3000 см³", type: "Легковий" },
  { value: "B4", label: "більше 3001 см³", type: "Легковий" },
  { value: "B5", label: "Електромобіль", type: "Легковий" },
  { value: "A1", label: "до 300 см³", type: "Мотоцикл" },
  { value: "A2", label: "більше 300 см³", type: "Мотоцикл" },
  { value: "D1", label: "до 20 місць", type: "Автобус" },
  { value: "D2", label: "більше 20 місць", type: "Автобус" },
  { value: "C1", label: "до 20 т", type: "Вантажний" },
  { value: "C2", label: "більше 20 т", type: "Вантажний" },
  { value: "E", label: "до вантажних", type: "Причіп" },
  { value: "F", label: "до легкових", type: "Причіп" },
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
  { id: 1, slug: "no", label: "Немає пільг" },
  { id: 2, slug: "retired", label: "Пенсіонер" },
  { id: 3, slug: "war", label: "Учасник війни" },
  { id: 4, slug: "invalid", label: "Інвалід II групи" },
  { id: 5, slug: "chernobyl", label: "Постраждалий від ЧАЕС" },
  { id: 6, slug: "e_retired", label: "Пенсіонер (е-посвідчення)" },
  { id: 7, slug: "maidan", label: "Учасник Революції Гідності" },
  { id: 8, slug: "invalid_i", label: "Інвалід I групи" },
  { id: 9, slug: "invalid_war", label: "Інвалід внаслідок війни" },
  { id: 10, slug: "ubd", label: "Учасник бойових дій" },
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
