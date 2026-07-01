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
  birthDate: string;   // формат "DD.MM.YYYY" — параметр carBirthdayAt
}

export const DEFAULT_BUYER: BuyerData = {
  customerType: 1,
  privilegeId: 1,
  birthDate: "01.01.1990",
};

export interface VehicleDetails {
  odometr: string;
  kilometers: string;
  capacity: string;
  numberOfSeats: string;
  ownWeight: string;
  totalWeight: string;
  birthdayAt: string;
}
