export interface VehicleData {
  number: string;
  vin: string;
  year: number;
  model: string;
  mark: string;
  autoCategory: string;
  // Місто/зона можуть бути відсутні: реєстр не завжди повертає місце реєстрації.
  // Не дефолтимо їх до Києва — користувач підтверджує місто у VehicleConfirmModal.
  cityId?: number;
  cityName?: string;
  zone?: number;
  capacity?: number;
  numberOfSeats?: number;
  ownWeight?: number;
  totalWeight?: number;
}

// Дані страхувальника, що впливають на ціну поліса (вводяться на екрані пропозицій).
// customerType виводиться з пільги: без пільги → 1 (фіз. особа), інакше → 3 (пільговик).
export interface BuyerData {
  customerType: number;
  privilegeId: number; // id з PRIVILEGES
  birthDate: string;   // ДН власника авто (з реєстру за номером) — основа для СК, що рахують за власником
  // Обовʼязкові поля з калькулятора: різні СК рахують ціну за віком різної особи
  // (див. osago-age-basis). "DD.MM.YYYY".
  policyholderBirthDate?: string; // ДН страхувальника
  youngestBirthDate?: string;     // ДН наймолодшого водія (за нею ж рахуємо «водія»)
}

export const DEFAULT_BUYER: BuyerData = {
  customerType: 1,
  privilegeId: 1,
  // Порожньо: НЕ підставляємо фейкову дату народження — калькулятор рахує без неї,
  // а точну ціну під реальну ДН уточнюємо на checkout. (Було "01.01.1990".)
  birthDate: "",
  policyholderBirthDate: "",
  youngestBirthDate: "",
};

export interface VehicleDetails {
  odometr: string;
  kilometers: string;
  capacity: string;
  numberOfSeats: string;
  ownWeight: string;
  totalWeight: string;
  birthdayAt: string;
  // Ідентифікація авто — заповнюється на кроці оформлення (не потрібна для розрахунку).
  mark?: string;
  model?: string;
  vin?: string;
}
