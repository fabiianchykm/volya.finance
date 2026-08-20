import type { AgeBasisKind } from "./osago-age-basis";

// Модулі ОСЦПВ-калькулятора Ukasko (прод) → основа розрахунку ціни кожної СК.
// Дозволяє тягнути КОЖНУ страхову окремим легким запитом (moduleId) паралельно,
// замість важкого повного батча (~10с) чи кількох повних батчів під різні ДН.
// Це швидше (перші офери за ~2с, усі за ~5с) і надійніше (падіння однієї СК не
// валить усю видачу). Джерело мапи — жива видача (категорія B1).
//
// Якщо Ukasko додасть/змінить модуль — оновити тут (як GC_MODULE_IDS). Невідомий
// модуль не «загубиться»: якщо по-модульно нічого не прийшло — офери-роут падає у
// фолбек на повний батч.
export const OSAGO_MODULE_BASIS: { moduleId: number; basis: AgeBasisKind }[] = [
  { moduleId: 9,  basis: "owner" },        // УСГ
  { moduleId: 10, basis: "owner" },        // ВУСО
  { moduleId: 11, basis: "youngest" },     // ТАС
  { moduleId: 12, basis: "youngest" },     // ББС
  { moduleId: 14, basis: "youngest" },     // Експрес
  { moduleId: 15, basis: "policyholder" }, // Княжа
  { moduleId: 16, basis: "youngest" },     // Гардіан
  { moduleId: 17, basis: "driver" },       // УТСК
  { moduleId: 18, basis: "driver" },       // Оранта
  { moduleId: 19, basis: "policyholder" }, // Інтер-Поліс
  { moduleId: 20, basis: "youngest" },     // Євроінс
  { moduleId: 23, basis: "youngest" },     // ЄСА
  { moduleId: 26, basis: "policyholder" }, // ПЗУ
  { moduleId: 28, basis: "policyholder" }, // Арсенал
  { moduleId: 29, basis: "youngest" },     // ІНГО
];
