export interface AuthResponse {
  token: string;
  isPartner: boolean;
  isShowBonus: boolean;
  info: {
    id: number;
    email: string;
    type_id: number;
    level_id: number;
    active: number;
  };
}

export interface City {
  id: number;
  kaotuu: string;
  zone: number;
  name_ua: string;
  name_ru: string;
  name_full_name_ua: string;
  name_full_name_ru: string;
  cdb_mtibu_code: number;
  type_population: string | null;
}

export interface CarInfo {
  vin: string;
  number: string;
  year: string;
  model: string;
  mark: string;
  type: string;
  autoCategory: string;
  // Дані власника з реєстру (МТСБУ): дата народження + вік. ПІБ/ІПН НЕ повертаються.
  birthDateOwner?: string;  // "YYYY-MM-DD"
  age?: number | string;
  city: City;
  additionalParameters: {
    capacity: string;
    ownWeight: string;
    totalWeight: string;
    numberOfSeats: string;
  };
}

// Варіант ДЦВ (добровільна цивілка) до пропозиції ОСЦПВ. З API v2 — спрощений:
// id варіанта (dgoId для заявлення), ліміт покриття та ціна (НЕ входить у price оферу).
export interface DgoOffer {
  id: string;
  cost: string;            // ціна, грн (рядок — історично так читає OfferCard)
  coverage: number;        // ліміт покриття, грн
  company_id: string;      // СК, що надає ДЦВ (може відрізнятись від СК ОСЦПВ)
  companyName?: string | null;
  sameCompany?: boolean;   // false → ДЦВ надає інша компанія (підказка клієнту)
}

// Варіант «Автоюрист» (окрема послуга Ukasko) до пропозиції ОСЦПВ.
export interface AutolawyerOffer {
  id: string;
  price: number;
  program: number | null;  // 1 Стандарт, 2 Комфорт, 3 Комфорт плюс
  programName?: string | null;
}

export interface InsuranceCompany {
  id: string;
  publicName: string;
  logo: string | null;
  // Обов'язкові інформаційні документи страхового продукту (посилання на PDF).
  docProduct: string | null; // Інформація про страховий продукт
  docCompany: string | null; // Інформація про страхову компанію
  docAgent: string | null;   // Інформація про страхового посередника
  docZusp: string | null;    // Загальні умови страхового продукту (ЗУСП)
  descriptionLink?: string | null;
  // Legacy v1 (у v2 не віддаються) — лишаємо опційними для карток інших продуктів.
  directSettlement?: number;
  compensationDays?: number;
  website?: string | null;
  [extra: string]: unknown;
}

// Пропозиція ОСЦПВ у форматі, який споживає UI (OfferCard/OffersSection/Checkout).
// Джерело — Ukasko API v2 (/v2/insurance/oscpv/calculate), адаптер у offers-роуті.
// Інші продукти (ЗК, туризм…) мапляться в цю ж форму, щоб переюзати OfferCard.
export interface InsuranceOffer {
  offerId: string;             // ULID пропозиції — дійсна до кінця поточної доби
  companyId: string;
  companyName: string;
  companyNamePublic: string;
  company: InsuranceCompany;
  price: number;
  startDate: string;           // d.m.Y
  endDate: string | null;      // d.m.Y (рахуємо з периоду)
  periodId: number;            // 6 | 12 (місяці)
  dateFromMax: number | null;  // макс. днів наперед для дати початку
  autoCategoryType: string;
  customerType: number;        // 1 фізособа, 2 юрособа, 3 пільговик
  tariffName: string;
  programmName?: string | null;
  listDgo: DgoOffer[] | null;
  listAutolawyer: AutolawyerOffer[] | null;
  // v2: чиїм віком СК рахує тариф + підказка словами для картки.
  ageSemantic?: "owner" | "insurer" | "driver" | null;
  driverAgeHint?: string | null;
  // v2: СК оформлює цю пропозицію ЛИШЕ разом із ДЦВ (dgoId обов'язковий).
  dgoRequired?: boolean;
  discountPrice?: number;
  discountPercent?: number | null;
  // Legacy v1 поля (опційно, для адаптерів інших продуктів).
  moduleId?: number;
  isTaxi?: number;
  franchise?: number;
  [extra: string]: unknown;
}

export interface OffersResponse {
  status: "success" | "error" | string;
  message: string;
  data: InsuranceOffer[];
  errorInfo: unknown[];
  count?: number;
}

// ─── ОСЦПВ v2 (Ukasko Connect API v2, /api/v2/insurance/oscpv/*) ─────────────────

// Калькуляція: пласкі поля, без zone (виводиться з cityId) і без {mode}.
export interface OsagoV2CalcParams {
  autoCategoryType: string;
  cityId?: number | null;         // обов'язковий, якщо не isEuroCar
  isEuroCar?: boolean;
  isTaxi?: boolean;
  userType: 1 | 2;                // 1 фізособа, 2 юрособа
  privilegeType?: number | null;  // 1 без пільг … 10 УБД (лише userType=1)
  startDate: string;              // d.m.Y, не раніше завтра
  periodId?: 6 | 12;
  registrationType?: 1 | 2 | 3;
  carNumber: string;              // обов'язковий
  carBrand?: string | null;
  carYear?: number | null;
  driverBirthDate?: string | null;   // ДН наймолодшого водія
  insurerBirthDate?: string | null;  // ДН страхувальника
  ownerBirthDate?: string | null;    // ДН власника ТЗ
  kilometers?: number | null;
  identificationCode?: string | null; // РНОКПП — персональний тариф окремих СК
  promoCode?: string | null;
}

export interface OsagoV2Company {
  id: string;
  name: string;
  logo: string | null;
  descriptionLink: string | null;
  docAgent: string | null;
  docCompany: string | null;
  docProduct: string | null;
  docZusp: string | null;
}

export interface OsagoV2Offer {
  offerId: string;
  company: OsagoV2Company;
  price: number;
  discountPrice: number;
  discountPercent: number | null;
  promoCodeApplied: boolean | null;
  promoCodeMessage: string | null;
  startDate: string;
  periodId: number;
  dateFromMax: number | null;
  autoCategoryType: string;
  customerType: number;
  tariffName: string | null;
  programName: string | null;
  ageSemantic: "owner" | "insurer" | "driver" | null;
  driverAgeHint: string | null;
  dgo: {
    company: Partial<OsagoV2Company> | null;
    sameCompany: boolean;
    required: boolean;
    options: { id: string; coverage: number; price: number }[];
  } | null;
  autolawyer: {
    company: Partial<OsagoV2Company> | null;
    options: { id: string; program: number; programName: string; price: number }[];
  } | null;
}

// Заявлення (order/create): сервер бере тариф/ціну/СК зі збереженого офера.
export interface OsagoV2Document {
  type: 1 | 2 | 3 | 4;      // 1 паспорт, 2 закордонний, 3 ID-картка, 4 посвідчення водія
  serial?: string | null;   // усі типи, крім ID-картки (для неї — insurer.unzr)
  number: string;
  dateOfIssue: string;      // d.m.Y
  endDateOfIssue?: string | null;
  issuedBy?: string | null;
}

export interface OsagoV2Insurer {
  // фізособа / пільговик
  name?: string;
  surname?: string;
  patronymic?: string | null;
  dateBirth?: string;             // d.m.Y
  identificationCode?: string | null;
  withoutIdentificationCode?: boolean;
  unzr?: string | null;           // обов'язковий для document.type=3
  // юрособа
  companyName?: string;
  erdpyCode?: string;
  signerFullName?: string;
  // спільні
  phone: string;
  email: string;
  cityId: number;
  street: string;
  house: string;
  apartment?: string | null;
  isVehicleOwner?: boolean;
  document?: OsagoV2Document;
  privilegeDocument?: {
    type: number;                 // = privilegeType калькуляції (2…10)
    serial?: string | null;
    number: string;
    dateOfIssue: string;          // d.m.Y
    issuedBy?: string | null;
  };
}

export interface OsagoV2Vehicle {
  brand: string;
  model: string;
  number: string;
  vin?: string | null;
  withoutVin?: boolean;
  year: number;
  cityId?: number | null;         // місто реєстрації — має бути тієї ж зони, що в калькуляції
  ownerBirthDate?: string | null;
  driverBirthDate?: string | null;
  kilometers?: number | null;
  engineSize?: number | null;
  kvt?: number | null;
  ownWeight?: number | null;
  totalWeight?: number | null;
  nSeating?: number | null;
}

export interface OsagoV2OrderRequest {
  offerId: string;
  dgoId?: string | null;
  autolawyerId?: string | null;
  promoCode?: string | null;
  insurer: OsagoV2Insurer;
  vehicle: OsagoV2Vehicle;
  isSendPhoneMessage?: boolean;
}

// Результат заявлення: заявку вже задекларовано в СК, OTP надіслано на email.
export interface OsagoV2OrderResult {
  id: string;                     // orderId
  statusId: number;               // 5 declared
  status: string;
  mtsbuCode: string | null;
  mtsbuLink: string | null;
  offerDocument: string | null;   // PDF переддоговірної інформації
  warningCancelMessage: string | null; // чинні поліси на це ТЗ буде розірвано
  price: number;                  // ціна ОСЦПВ після декларування (без ДЦВ/автоюриста)
  previousPrice: number | null;
  priceChanged: boolean;
  otpSent: boolean;
  otpLength: number | null;
  dgo: {
    id: string;
    coverage: number;
    price: number;
    contractNumber: string | null;
    otpRequired: boolean;         // СК видала окремий код для підпису ДЦВ (otpDgo)
    otpLength: number | null;
  } | null;
  autolawyer: {
    id: string;
    program: number;
    programName: string;
    price: number;
    offerDocument: string | null;
  } | null;
  // Текст попередження СК (дублює warningCancelMessage) або "OK".
  message?: string;
}

export interface V2PaymentSystem {
  id: number;
  code: string;                   // provider для checkout (напр. "liqpay")
  title: string;
  percentage_acquiring: number;
  available_options: ("client" | "agent")[];
  is_enabled: boolean;
  partial_pay_periods: number[];
}

export interface V2PaymentStatus {
  status: "none" | "pending" | "paid" | "failed";
  invoiceId: string | null;
  provider: string | null;
  paidAt: string | null;
  message: string | null;
}

export interface CustomerDocumentation {
  type: number;
  serial: string;
  number: string;
  issuedBy: string;
  dateOfIssue: number;
  endDateOfIssue: number | null;
}

export interface CustomerAddress {
  cityId: number;
  street: string;
  house: string;
  number?: string;
  cityName: string;
  full: string;
}

export interface Customer {
  customerType: number;
  name: string;
  surname?: string;
  patronymic?: string;
  identificationCode?: string;
  erdpyCode?: string;
  dateBirth: number;
  phone: string;
  email: string;
  documentation: CustomerDocumentation;
  address: CustomerAddress;
  /** Пільговий документ — лише коли обрано пільгу (customerPrivilege ≠ 1). */
  privilege?: CustomerPrivilege;
}

// Пільговий документ ОСЦПВ (v2: insurer.privilegeDocument). type — категорія
// пільги (privilegeType 2…10, та сама, що в калькуляції). Дата — unix timestamp.
export interface CustomerPrivilege {
  type: number;        // категорія пільги (2 пенсіонер … 10 УБД)
  serial: string;
  number: string;
  issuedBy: string;
  dateOfIssue: number;
  endDateOfIssue?: number | null;
}

export interface OrderDraft {
  id: string;
  statusId: number;
  status: string;
}

export interface PolicyStatus {
  id: string;
  status: string;
  mtsbuLink?: string;
}

export type AutoCategoryType =
  | "A1" | "A2"
  | "B1" | "B2" | "B3" | "B4" | "B5"
  | "D1" | "D2"
  | "E" | "F"
  | "C1" | "C2";

export type PeriodId = 15 | 21 | 1 | 2 | 3 | 4 | 5 | 6 | 12;
export type CustomerTypeId = 1 | 2 | 3;
export type RegistrationTypeId = 1 | 2 | 3;
export type PrivilegeId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

// Пропозиція «Зелена карта» (POST /insurance/greencard/calculator).
export interface GreenCardOffer {
  offerId: string;
  moduleId: number;
  price: number;
  startDate?: string;
  companyId?: string;
  companyName: string;
  companyNamePublic: string;
  company?: { logo?: string | null; [k: string]: unknown };
  dateFromMax?: number;
  // Типи документів страхувальника, які приймає ЦЕЙ страховик (константи Ukasko,
  // напр. "DOCUMENT_ID_CARD"). Різні СК приймають різні набори — ARX/INGO лише
  // закордонний паспорт, тож checkout показує тільки дозволені типи.
  available_documents?: string[];
}

// ── Міні-КАСКО ──────────────────────────────────────────────────────────────
// Калькулятор повертає масив груп по СК; ми сплющуємо у список офферів із даними
// компанії. coverage — сума покриття (400000 / 800000 / 1200000 грн).
export interface MiniKaskoOffer {
  offerId: number;
  price: number;
  coverage: number;
  title?: string | null;
  companyId: string;
  companyName: string;
  companyNamePublic: string;
  logo?: string | null;
}

export interface MiniKaskoParams {
  start_date: string; // YYYY-MM-DD, строго пізніше сьогодні
  city_id: number;
}

// ── Страхування житла (Home) ────────────────────────────────────────────────
export interface HomeOffer {
  offerId: string;
  moduleId: number;
  companyId: string;
  companyName: string;
  companyNamePublic: string;
  price: number;
  home_type: "flat" | "house";
  insurance_amount: number;
  insurance_period: string;   // "12m"
  earnings?: number;          // сума комісії агента (грн)
  earnings_param?: number;    // відсоток комісії, переданий у /calculator — має збігатись у /order
  available_documents?: string[];
  company?: { logo?: string | null; publicName?: string; ex_id?: string; [k: string]: unknown };
}

export interface HomeParams {
  homeType: "flat" | "house";
  insuranceAmount: number;
  insurancePeriod: string;    // "5m".."12m"
  earnings: number;           // відсоток комісії агента
  startFrom: string;          // YYYY-MM-DD
}

export interface GreenCardParams {
  country: number;       // 60 = Європа, 117 = Молдова
  userType: number;      // 1 = фізособа, 2 = юрособа
  startDate: string;     // YYYY-MM-DD
  periodOption: number;  // 15/21 = дні, 1..12 = місяці
  carType: string;       // B/C/D/A/E
  carNumber?: string;
}

// Туристичне страхування (POST /insurance/calculator/tourism).
export interface TourismParams {
  birthDates: string[];              // дати народження туристів, "d.m.Y"
  country: { id: number; name: string };
  date: string;                      // початок поїздки, "d.m.Y"
  days: number;
  multiVisa: boolean;
  tourists: number;
}

export interface TourismOffer {
  offerId: string;
  company?: { logo?: string | null; name?: string; publicName?: string; [k: string]: unknown };
  name?: string;
  title?: string;
  tripProgram?: string;        // econom | standart | elit
  price: number;
  coverage?: number | string;  // сума покриття (може прийти рядком "30000.00")
  limit?: number;
  limit_currency?: string;     // EUR | USD
  covid_help?: boolean;
  franchise?: number | string;
  // Період дії ДОГОВОРУ (ISO "YYYY-MM-DD"). У мультивізі endDate−startDate = термін
  // дії полісу (напр. ІНТЕР-ПОЛІС дає 365 незалежно від ліміту поїздки).
  startDate?: string;
  endDate?: string | null;
  // Набір опцій/ризиків, що покриває поліс (medicine_help, dentistry, baggage_loss,
  // trip_impossible, visa_impossible, avia_await, cv…) — {status, value}. Саме цим
  // оффери відрізняються між собою.
  options?: Record<string, { status?: boolean; value?: number } | boolean | number | string | null | undefined>;
  // Перелік ризиків із лімітами й описом (найчистіше джерело для деталізації).
  programs?: Array<{ code?: number; limit?: number; limitCurrency?: string; description?: string }>;
}

// Страхування тварин (POST /insurance/pets/calculator).
export interface PetsParams {
  startFrom: string;               // "d.m.Y", не раніше ніж через 10 днів
  insurancePeriod: "6m" | "9m" | "12m";
  earnings: number;                // комісія агента (тариф), напр. 15
}

export interface PetsOffer {
  offerId: string;
  price: number;
  insurancePeriod: string;
  moduleId?: number;
  companyName?: string;
  companyNamePublic?: string;
  companyLogo?: string | null;
  company?: { publicName?: string; logo?: string | null; [k: string]: unknown };
  earnings?: number;
  startFrom?: string;
}

// ── Нещасні випадки (НВ) ─────────────────────────────────────────────────────
// Калькулятор POST /{mode}/insurance/calculator/accident. Дати — d.m.Y.
export type AccidentPeriod = "10_days" | "15_days" | "30_days" | "3_month" | "6_month" | "9_month" | "12_month";
export type AccidentProtection = "24_7" | "study_work_hours" | "sport_hours";
export type AccidentFactor = "warRisk" | "sport" | "profession";
// Пакети ризиків ІНГО (оновлення API 14.10.2026): adults — програма B (НВ),
// sick_leave — A (лікарняні, ТВП 0,3%/день), complex — D (НВ + хвороба),
// child — C (дитяча, вік 1–17; для дітей інших пакетів немає).
export type AccidentPackage = "adults" | "sick_leave" | "complex" | "child";
export type YN = "Y" | "N";
// ⚠️ У ключах RiskGroup…Аccident у Ukasko КИРИЛИЧНА «А» — так в API, не чіпати.
export interface AccidentRisks {
  RiskDeathAccident?: YN;          // смерть від НВ — завжди Y (обовʼязковий)
  RiskGroupOneАccident?: YN;       // інвалідність 1 гр. від НВ
  RiskGroupTwoАccident?: YN;       // інвалідність 2 гр. від НВ
  RiskGroupThreeАccident?: YN;     // інвалідність 3 гр. від НВ (потребує 1–2)
  RiskInjuriesAccident?: YN;       // тілесні ушкодження (не для complex)
  RiskDeathIllness?: YN;           // смерть від хвороби (complex)
  RiskGroupOneIllness?: YN;
  RiskGroupTwoIllness?: YN;
  RiskGroupThreeIllness?: YN;
  RiskDisabledChild?: YN;          // «дитина з інвалідністю» (child)
  RiskTemporaryDisability?: { TemporaryDisability03P?: YN; TemporaryDisability01P?: YN };
}
export interface AccidentParams {
  startDate: string;               // d.m.Y, не раніше завтра
  birthDate: string;               // d.m.Y, вік 1–75
  period: AccidentPeriod;
  protectionPeriod: AccidentProtection;
  sum: number;                     // 10000…300000 (фіксований перелік)
  countryId: 1 | 2;                // 1 Україна, 2 весь світ
  activeFactor: AccidentFactor;
  activeFactors?: AccidentFactor[]; // кілька факторів одночасно (пріоритет над activeFactor)
  warRisk?: boolean;
  sportType?: string;              // код виду спорту з довідника
  sportCategory?: "amateur" | "professional" | string; // рівень (рядок; старі числові коди теж приймаються)
  profession?: "none" | "builder" | "electrician" | "firefighter" | "guard" | "other";
  selectedPackage?: AccidentPackage;
  accidentRisks?: AccidentRisks;
  moduleId?: number | null;
}
export interface AccidentOffer {
  offerId: string;
  moduleId?: number;
  companyId?: number;
  companyName?: string;
  companyNamePublic?: string;
  price: number;
  fullPrice?: number;
  discountPrice?: number | null;
  earnings?: number;
  program?: string;
  fromDate?: string;
  term?: number;
  insuranceSum?: number;
  activeFactor?: string;
  protectionPeriod?: string;
  countryId?: number;
  company?: { id?: number; logo?: string | null; publicName?: string; rating?: number | null; docProduct?: string | null; [k: string]: unknown };
}
export interface AccidentSport { id: number; code: string; name: string; coefficient?: number }
