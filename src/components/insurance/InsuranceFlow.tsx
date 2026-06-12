"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { HeroSection } from "@/components/sections/HeroSection";
import { OffersSection } from "./OffersSection";
import type { InsuranceOffer, Customer } from "@/types/api";
import type { VehicleData } from "@/types/insurance";

const VehicleConfirmModal = dynamic(() => import("./VehicleConfirmModal").then(mod => mod.VehicleConfirmModal), { ssr: false });

type FlowStep = "hero" | "offers";

interface FlowState {
  step: FlowStep;
  plate: string;
  vehicle: VehicleData | null;
  offers: InsuranceOffer[];
  periodId: number;
}

export function InsuranceFlow() {
  const router = useRouter();
  
  const [state, setState] = useState<FlowState>({
    step: "hero",
    plate: "",
    vehicle: null,
    offers: [],
    periodId: 12,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [showVehicleModal, setShowVehicleModal] = useState(false);

  // Step 1: user submits a plate — try auto-lookup, always show modal
  const handlePlateSearch = async (plate: string) => {
    setLoading(true);
    setError(null);
    setLookupError(null);

    try {
      const res = await fetch(`/api/vehicle/${encodeURIComponent(plate)}`);
      const json = await res.json();

      if (json.success) {
        const car = json.data;
        const vehicle: VehicleData = {
          number: car.number ?? plate,
          vin: car.vin ?? "",
          year: Number(car.year),
          model: car.model ?? "",
          mark: car.mark ?? "",
          autoCategory: car.autoCategory ?? "B1",
          cityId: car.city?.id ?? 1,
          cityName: car.city?.name_full_name_ua ?? "м. Київ, Україна",
          zone: car.city?.zone ?? 1,
          capacity: car.additionalParameters?.capacity
            ? Number(car.additionalParameters.capacity)
            : undefined,
          numberOfSeats: car.additionalParameters?.numberOfSeats
            ? Number(car.additionalParameters.numberOfSeats)
            : undefined,
          ownWeight: car.additionalParameters?.ownWeight
            ? Number(car.additionalParameters.ownWeight)
            : undefined,
          totalWeight: car.additionalParameters?.totalWeight
            ? Number(car.additionalParameters.totalWeight)
            : undefined,
        };
        setState((s) => ({ ...s, plate, vehicle }));
      } else {
        // Lookup failed — show modal with manual input
        setLookupError(json.error ?? "Авто не знайдено в реєстрі");
        setState((s) => ({ ...s, plate, vehicle: null }));
      }
    } catch {
      setLookupError("Помилка з'єднання з реєстром");
      setState((s) => ({ ...s, plate, vehicle: null }));
    } finally {
      setLoading(false);
      setShowVehicleModal(true); // Always show modal — either with data or manual form
    }
  };

  // Step 2: vehicle confirmed — validate, fetch offers, transition to offers screen
  const handleVehicleConfirm = async (vehicle: VehicleData) => {
    setLoading(true);
    setError(null);

    try {
      // --- Validate vehicle data before sending ---
      const missing: string[] = [];
      if (!vehicle.autoCategory) missing.push("autoCategory");
      if (!vehicle.year || vehicle.year < 1900 || vehicle.year > new Date().getFullYear() + 1) missing.push(`year=${vehicle.year}`);
      if (!vehicle.cityId) missing.push("cityId (registrationPlaceId)");
      if (vehicle.zone === undefined || vehicle.zone === null || vehicle.zone < 0) missing.push(`zone=${vehicle.zone}`);
      if (!state.periodId) missing.push("periodId");

      console.log("[offers] vehicle validation:", missing.length === 0 ? "OK" : "FAILED →", missing, { vehicle, periodId: state.periodId });

      if (missing.length > 0) {
        throw new Error(`Відсутні обов'язкові поля: ${missing.join(", ")}`);
      }

      // --- Build params ---
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const startDate = `${String(tomorrow.getDate()).padStart(2, "0")}.${String(tomorrow.getMonth() + 1).padStart(2, "0")}.${tomorrow.getFullYear()}`;

      const paramsObj = {
        autoCategoryType: vehicle.autoCategory,
        customerType: "1",
        registrationPlaceId: String(vehicle.cityId),
        zone: String(vehicle.zone),
        startDate,
        customerPrivilege: "1",
        registrationType: "1",
        period_id: String(state.periodId),
        carYear: String(vehicle.year),
        carBirthdayAt: "01.01.1990",
      };

      console.log("[offers] request payload →", paramsObj);

      const res = await fetch(`/api/insurance/offers?${new URLSearchParams(paramsObj)}`);
      const json = await res.json();

      console.log("[offers] response →", {
        success: json.success,
        httpStatus: res.status,
        status: json.data?.status,
        count: json.data?.count,
        dataIsArray: Array.isArray(json.data?.data),
        offersCount: Array.isArray(json.data?.data) ? json.data.data.length : "N/A",
        error: json.error,
        errorInfo: json.data?.errorInfo,
      });

      if (!json.success) {
        throw new Error(json.error ?? "Помилка завантаження пропозицій");
      }

      const offersResp = json.data;
      const offers: InsuranceOffer[] = Array.isArray(offersResp?.data) ? offersResp.data : [];
      const errInfo: unknown[] = Array.isArray(offersResp?.errorInfo) ? offersResp.errorInfo : [];

      if (errInfo.length > 0) {
        console.warn(`[offers] ${errInfo.length} insurer(s) failed (partial), ${offers.length} offer(s) returned`, errInfo);
      }

      if (offers.length === 0) {
        throw new Error("Не знайдено пропозицій для вашого авто. Спробуйте змінити параметри.");
      }

      // Success — close modal and show offers
      setShowVehicleModal(false);
      setState((s) => ({ ...s, step: "offers", vehicle, offers }));
    } catch (e) {
      console.error("[offers] error →", e);
      setError(e instanceof Error ? e.message : "Помилка");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: user selects offer → store data and navigate to /checkout
  const handleSelectOffer = (
    offer: InsuranceOffer,
    dgoId: string | null,
    autolawyerId: string | null
  ) => {
    sessionStorage.setItem("checkout_data", JSON.stringify({
      vehicle: state.vehicle,
      offer,
      periodId: state.periodId,
      selectedDgoId: dgoId,
      selectedAutolawyerId: autolawyerId,
    }));
    
    router.push("/checkout");
  };

  // --- Render ---

  if (state.step === "offers" && state.vehicle) {
    return (
      <>
        <OffersSection
          offers={state.offers}
          vehicle={state.vehicle}
          periodId={state.periodId}
          onPeriodChange={(id) => setState((s) => ({ ...s, periodId: id }))}
          onBack={() => setState((s) => ({ ...s, step: "hero" }))}
          onSelectOffer={handleSelectOffer}
        />
        {error && <ErrorToast message={error} onClose={() => setError(null)} />}
      </>
    );
  }

  return (
    <>
      <HeroSection onSearch={handlePlateSearch} loading={loading} />

      <VehicleConfirmModal
        open={showVehicleModal}
        onClose={() => setShowVehicleModal(false)}
        vehicle={state.vehicle}
        plate={state.plate}
        onConfirm={handleVehicleConfirm}
        loading={loading}
        lookupError={lookupError}
      />

      {error && <ErrorToast message={error} onClose={() => setError(null)} />}
    </>
  );
}

function ErrorToast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 max-w-sm w-full mx-4 rounded-2xl bg-zinc-900 px-5 py-3.5 text-sm text-white shadow-xl cursor-pointer"
      onClick={onClose}
    >
      <span className="font-medium text-red-400">Помилка: </span>
      {message}
    </div>
  );
}
