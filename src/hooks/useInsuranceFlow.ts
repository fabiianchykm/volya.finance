"use client";

import { useState, useCallback } from "react";
import type { InsuranceFormState, InsuranceStep, VehicleData } from "@/types/insurance";
import type { InsuranceOffer } from "@/types/api";

const initialState: InsuranceFormState = {
  step: "search",
  vehiclePlate: "",
  vehicleData: null,
  selectedOffer: null,
  selectedDgoId: null,
  selectedAutolawyerId: null,
  orderId: null,
  periodId: 12,
  startDate: new Date(),
};

export function useInsuranceFlow() {
  const [state, setState] = useState<InsuranceFormState>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setStep = useCallback((step: InsuranceStep) => {
    setState((prev) => ({ ...prev, step }));
    setError(null);
  }, []);

  const setVehiclePlate = useCallback((plate: string) => {
    setState((prev) => ({ ...prev, vehiclePlate: plate }));
  }, []);

  const setVehicleData = useCallback((data: VehicleData | null) => {
    setState((prev) => ({ ...prev, vehicleData: data }));
  }, []);

  const setSelectedOffer = useCallback((offer: InsuranceOffer | null) => {
    setState((prev) => ({
      ...prev,
      selectedOffer: offer,
      selectedDgoId: null,
      selectedAutolawyerId: null,
    }));
  }, []);

  const setSelectedDgo = useCallback((dgoId: string | null) => {
    setState((prev) => ({ ...prev, selectedDgoId: dgoId }));
  }, []);

  const setSelectedAutolawyer = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, selectedAutolawyerId: id }));
  }, []);

  const setOrderId = useCallback((id: string) => {
    setState((prev) => ({ ...prev, orderId: id }));
  }, []);

  const setPeriod = useCallback((periodId: number) => {
    setState((prev) => ({ ...prev, periodId }));
  }, []);

  const setStartDate = useCallback((date: Date) => {
    setState((prev) => ({ ...prev, startDate: date }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
    setError(null);
  }, []);

  return {
    state,
    loading,
    error,
    setLoading,
    setError,
    setStep,
    setVehiclePlate,
    setVehicleData,
    setSelectedOffer,
    setSelectedDgo,
    setSelectedAutolawyer,
    setOrderId,
    setPeriod,
    setStartDate,
    reset,
  };
}
