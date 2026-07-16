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
  city: City;
  additionalParameters: {
    capacity: string;
    ownWeight: string;
    totalWeight: string;
    numberOfSeats: string;
  };
}

export interface DgoOffer {
  data: Record<string, unknown>;
  cost: string;
  external_id: number;
  zone: string;
  periodId: number;
  autoCategory: string;
  externalIdCompany: number;
  coverage: number;
  company_id: string;
  newCompany: Record<string, unknown>;
  is_hidden: number;
  id: string;
  earning: number;
  earningParent: number | null;
}

export interface AutolawyerOffer {
  id: string;
  otherData: unknown;
  price: number;
  auto_category_type: string;
  zone: number;
  program: number | null;
  earning: number;
  earningParent: number | null;
}

export interface MtsbuRating {
  quarter: string | null;
  paramAssessment: number | null;
  paramQuality: number | null;
  paramClaims: number | null;
}

export interface InsuranceCompany {
  id: string;
  logo: string | null;
  picture: string | null;
  exampleBlank: string | null;
  publicName: string;
  website: string | null;
  companyLink: string | null;
  companyDgoLink: string | null;
  // Обов'язкові інформаційні документи страхового продукту (посилання на PDF).
  docProduct: string | null; // Інформація про страховий продукт
  docCompany: string | null; // Інформація про страхову компанію
  docAgent: string | null;   // Інформація про страхового посередника
  docZusp: string | null;    // Загальні умови страхового продукту (ЗУСП)
  rating: number | null;
  email: string;
  ratingAdmins: string;
  reviewsAmount: number;
  compensationDays: number;
  directSettlement: number;
  supportEverytime: number;
  medicineHelp: number;
  marketLeader: number;
  orderPosition: number;
  isHidden: number;
  innStatus: number;
  mtsbuRating: MtsbuRating;
}

export interface InsuranceOffer {
  registerType: number;
  moduleId: number;
  price: number;
  startPrice: number;
  isTaxi: number;
  otkDate: string | null;
  endDate: string | null;
  periodId: number;
  offerId: string;
  companyNamePublic: string;
  startDate: string;
  franchise: number;
  companyName: string;
  listDgo: DgoOffer[] | null;
  isEuroCar: number;
  autoCategoryType: string;
  externalIdTariff: string | number;
  customerPrivilege: string;
  registrationPlaceId: string;
  customerType: number;
  otherData: Record<string, unknown> | null;
  tariffName: string;
  usageMonths: number;
  dateFromMax: number;
  ex_id: string;
  ex_tariff_id: string;
  companyId: string;
  company: InsuranceCompany;
  programmName: string;
  allowed_documents: Record<string, unknown>;
  listAutolawyer: AutolawyerOffer[] | null;
  earnings: number;
  earningsParent: number | null;
  hasCompanyBranch: boolean;
  available_documents: string[];
}

export interface OffersResponse {
  status: "success" | "error" | string;
  message: string;
  data: InsuranceOffer[];
  errorInfo: unknown[];
  count?: number;
}

export interface CalculatorParams {
  autoCategoryType: string;
  isTaxi: 0 | 1;
  franchise: 0;
  isEuroCar: 0 | 1;
  customerType: number;
  registrationPlaceId?: number;
  zone?: number;
  withoutOtk: 1;
  startDate: string;
  customerPrivilege: number;
  registrationType: number;
  period_id: number;
  "car[year]": number;
  "car[birthdayAt]": string;
  "customer[dateBirth]"?: string;
  customerBirthday?: string;
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
