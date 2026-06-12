export type InsuranceStep =
  | "search"
  | "vehicle-confirm"
  | "customer-form"
  | "offers"
  | "payment";

export interface VehicleData {
  number: string;
  vin: string;
  year: number;
  model: string;
  mark: string;
  autoCategory: string;
  cityId: number;
  cityName: string;
  zone: number;
  capacity?: number;
  numberOfSeats?: number;
  ownWeight?: number;
  totalWeight?: number;
}

export interface InsuranceFormState {
  step: InsuranceStep;
  vehiclePlate: string;
  vehicleData: VehicleData | null;
  selectedOffer: import("./api").InsuranceOffer | null;
  selectedDgoId: string | null;
  selectedAutolawyerId: string | null;
  orderId: string | null;
  periodId: number;
  startDate: Date;
}

export interface PriceBreakdown {
  base: number;
  dgo: number;
  autolawyer: number;
  total: number;
}
