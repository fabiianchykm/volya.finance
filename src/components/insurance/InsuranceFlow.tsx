"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { HeroSection } from "@/components/sections/HeroSection";
import { OffersSection } from "./OffersSection";
import { BuyerModal } from "./BuyerModal";
import type { InsuranceOffer } from "@/types/api";
import { DEFAULT_BUYER, type BuyerData, type VehicleData } from "@/types/insurance";

const VehicleConfirmModal = dynamic(() => import("./VehicleConfirmModal").then(mod => mod.VehicleConfirmModal), { ssr: false });

// Ціни оферів можуть змінюватись — тихо перезавантажуємо список, поки
// користувач на екрані пропозицій. Фінальну ціну ще раз звіряємо на checkout.
const OFFERS_TTL_MS = 10 * 60 * 1000;

type FlowStep = "hero" | "offers";

interface FlowState {
  step: FlowStep;
  plate: string;
  vehicle: VehicleData | null;
  buyer: BuyerData;
  offers: InsuranceOffer[];
  offersLoading: boolean;
  periodId: number;
}

export function InsuranceFlow() {
  const router = useRouter();
  
  const [state, setState] = useState<FlowState>({
    step: "hero",
    plate: "",
    vehicle: null,
    buyer: DEFAULT_BUYER,
    offers: [],
    offersLoading: false,
    periodId: 12,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  // true → модалка відкрита для редагування наявних даних (з екрана пропозицій),
  // тож одразу показуємо форму, а не екран підтвердження.
  const [editingVehicle, setEditingVehicle] = useState(false);
  const [showBuyerModal, setShowBuyerModal] = useState(false);

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
          // Якщо реєстр повернув місто — беремо його; інакше дефолт Київ (зона 1).
          // Поле міста в модалці редаговане, тож користувач може змінити Київ на потрібне.
          ...(car.city?.id
            ? {
                cityId: car.city.id,
                cityName: car.city.name_full_name_ua || car.city.name_ua || "",
                zone: car.city.zone,
              }
            : { cityId: 1, cityName: "м. Київ", zone: 1 }),
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
      setEditingVehicle(false); // пошук по номеру → екран підтвердження, не редагування
      setShowVehicleModal(true); // Always show modal — either with data or manual form
    }
  };

  // Відкрити модалку для зміни даних авто прямо з екрана пропозицій.
  const handleEditVehicle = () => {
    setError(null);
    setLookupError(null);
    setEditingVehicle(true);
    setShowVehicleModal(true);
  };

  const handleEditBuyer = () => {
    setError(null);
    setShowBuyerModal(true);
  };

  // Step 2: vehicle confirmed — validate synchronously, then transition to the
  // offers screen immediately and load offers asynchronously in the background.
  const handleVehicleConfirm = (vehicle: VehicleData) => {
    // --- Validate vehicle data before sending ---
    const missing: string[] = [];
    if (!vehicle.autoCategory) missing.push("autoCategory");
    if (!vehicle.year || vehicle.year < 1900 || vehicle.year > new Date().getFullYear() + 1) missing.push(`year=${vehicle.year}`);
    if (!vehicle.cityId) missing.push("cityId (registrationPlaceId)");
    if (vehicle.zone === undefined || vehicle.zone === null || vehicle.zone < 0) missing.push(`zone=${vehicle.zone}`);
    if (!state.periodId) missing.push("periodId");

    if (missing.length > 0) {
      // Keep the modal open so the user can correct the data.
      setError(`Відсутні обов'язкові поля: ${missing.join(", ")}`);
      return;
    }

    // Transition to the offers screen right away — no blocking spinner in the modal.
    setError(null);
    setShowVehicleModal(false);
    setEditingVehicle(false);
    setState((s) => ({ ...s, step: "offers", vehicle, offers: [], offersLoading: true }));

    // Fetch offers without blocking the UI transition.
    void fetchOffers(vehicle, state.buyer);
  };

  // Зміна даних страхувальника з банера → зберігаємо й перераховуємо пропозиції.
  const handleBuyerConfirm = (buyer: BuyerData) => {
    setShowBuyerModal(false);
    if (!state.vehicle) return;
    setState((s) => ({ ...s, buyer, offers: [], offersLoading: true }));
    void fetchOffers(state.vehicle, buyer);
  };

  // Loads offers for a confirmed vehicle and updates state when they arrive.
  // buyer передаємо явно (а не зі state), щоб одразу після зміни читати свіжі дані.
  const fetchOffers = async (vehicle: VehicleData, buyer: BuyerData) => {
    try {
      // --- Build params ---
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const startDate = `${String(tomorrow.getDate()).padStart(2, "0")}.${String(tomorrow.getMonth() + 1).padStart(2, "0")}.${tomorrow.getFullYear()}`;

      const paramsObj = {
        autoCategoryType: vehicle.autoCategory,
        customerType: String(buyer.customerType),
        registrationPlaceId: String(vehicle.cityId),
        zone: String(vehicle.zone),
        startDate,
        customerPrivilege: String(buyer.privilegeId),
        registrationType: "1",
        period_id: String(state.periodId),
        carYear: String(vehicle.year),
        carBirthdayAt: buyer.birthDate,
      };

      const res = await fetch(`/api/insurance/offers?${new URLSearchParams(paramsObj)}`);
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error ?? "Помилка завантаження пропозицій");
      }

      const offersResp = json.data;
      const offers: InsuranceOffer[] = Array.isArray(offersResp?.data) ? offersResp.data : [];

      if (offers.length === 0) {
        throw new Error("Не знайдено пропозицій для вашого авто. Спробуйте змінити параметри.");
      }

      setState((s) => ({ ...s, offers, offersLoading: false }));
    } catch (e) {
      console.error("[offers] error →", e);
      setError(e instanceof Error ? e.message : "Помилка");
      setState((s) => ({ ...s, offersLoading: false }));
    }
  };

  // Поки користувач на екрані оферів — тихо оновлюємо список кожні OFFERS_TTL_MS,
  // щоб не показувати застарілі ціни (без скелетона, щоб не миготіло).
  useEffect(() => {
    if (state.step !== "offers" || !state.vehicle) return;
    const vehicle = state.vehicle;
    const buyer = state.buyer;
    const id = setInterval(() => { void fetchOffers(vehicle, buyer); }, OFFERS_TTL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.step, state.vehicle, state.buyer]);

  // Step 3: user selects offer → store data and navigate to /checkout
  const handleSelectOffer = (
    offer: InsuranceOffer,
    dgoId: string | null,
    autolawyerId: string | null
  ) => {
    sessionStorage.setItem("checkout_data", JSON.stringify({
      vehicle: state.vehicle,
      buyer: state.buyer,
      offer,
      periodId: state.periodId,
      selectedDgoId: dgoId,
      selectedAutolawyerId: autolawyerId,
    }));
    
    router.push("/checkout");
  };

  // --- Render ---

  // Модалка редагування/підтвердження авто — доступна і на головній, і на екрані
  // пропозицій (щоб можна було змінити дані прямо там, під «Автоцивілка»).
  const vehicleModal = (
    <VehicleConfirmModal
      open={showVehicleModal}
      onClose={() => { setShowVehicleModal(false); setEditingVehicle(false); }}
      vehicle={state.vehicle}
      plate={state.plate}
      onConfirm={handleVehicleConfirm}
      loading={loading}
      lookupError={lookupError}
      editMode={editingVehicle}
    />
  );

  if (state.step === "offers" && state.vehicle) {
    return (
      <>
        {/* Світлий фон екрана пропозицій → навбар у непрозорому стилі, щоб лого/меню було видно. */}
        <Navbar solid />
        <OffersSection
          offers={state.offers}
          loading={state.offersLoading}
          vehicle={state.vehicle}
          buyer={state.buyer}
          onBack={() => setState((s) => ({ ...s, step: "hero" }))}
          onEdit={handleEditVehicle}
          onEditBuyer={handleEditBuyer}
          onSelectOffer={handleSelectOffer}
        />
        {vehicleModal}
        <BuyerModal
          open={showBuyerModal}
          onClose={() => setShowBuyerModal(false)}
          buyer={state.buyer}
          onConfirm={handleBuyerConfirm}
          loading={state.offersLoading}
        />
        {error && <ErrorToast message={error} onClose={() => setError(null)} />}
      </>
    );
  }

  return (
    <>
      {/* Темний герой → навбар прозорий (білий текст добре читається). */}
      <Navbar />
      <HeroSection onSearch={handlePlateSearch} loading={loading} />

      {vehicleModal}

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
