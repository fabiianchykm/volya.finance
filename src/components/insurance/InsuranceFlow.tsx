"use client";

import { useEffect, useRef, useState } from "react";
import { useFlowReset } from "@/lib/nav-reset";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { HeroSection } from "@/components/sections/HeroSection";
import { OffersSection } from "./OffersSection";
import { BuyerModal } from "./BuyerModal";
import type { InsuranceOffer } from "@/types/api";
import { DEFAULT_BUYER, type BuyerData, type VehicleData } from "@/types/insurance";
import { trackEvent, trackCalc } from "@/lib/analytics";
import { useI18n } from "@/lib/i18n";

const VehicleConfirmModal = dynamic(() => import("./VehicleConfirmModal").then(mod => mod.VehicleConfirmModal), { ssr: false });
import type { DriverAges } from "./VehicleConfirmModal";

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
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [state, setState] = useState<FlowState>({
    step: "hero",
    plate: "",
    vehicle: null,
    buyer: DEFAULT_BUYER,
    offers: [],
    offersLoading: false,
    periodId: 12,
  });

  // Клік по «Автоцивілка» в меню, коли вже показані пропозиції → на перший екран.
  useFlowReset(() => setState((s) => ({ ...s, step: "hero" })));

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
    trackEvent("calculate_cost", { product: "osago" });
    trackCalc("osago", { plate });

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
        // Реєстр віддає лише ВІК: у birthDateOwner правильний РІК, а день/місяць = сьогодні
        // (фейкові). Тож беремо лише рік → "01.01.РРРР" (для ціни важливий вік/рік, не день).
        const ownerYear = typeof car.birthDateOwner === "string" && /^\d{4}-\d{2}-\d{2}$/.test(car.birthDateOwner)
          ? car.birthDateOwner.slice(0, 4)
          : "";
        const ownerDob = ownerYear ? `01.01.${ownerYear}` : "";
        setState((s) => ({ ...s, plate, vehicle, buyer: { ...s.buyer, birthDate: ownerDob } }));
      } else {
        // Lookup failed — show modal with manual input
        setLookupError(json.error ?? t({ uk: "Авто не знайдено в реєстрі", en: "Vehicle not found in the registry" }));
        setState((s) => ({ ...s, plate, vehicle: null }));
      }
    } catch {
      setLookupError(t({ uk: "Помилка з'єднання з реєстром", en: "Registry connection error" }));
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
  const handleVehicleConfirm = (vehicle: VehicleData, periodId?: number, ages?: DriverAges) => {
    const period = periodId ?? state.periodId;
    // ДН страхувальника + наймолодшого водія (обовʼязкові в модалці) — впливають на
    // ціну: різні СК рахують за віком різної особи (osago-age-basis).
    const buyer: BuyerData = ages
      ? { ...state.buyer, policyholderBirthDate: ages.policyholderBirthDate, youngestBirthDate: ages.youngestBirthDate }
      : state.buyer;
    // --- Validate vehicle data before sending ---
    const missing: string[] = [];
    if (!vehicle.autoCategory) missing.push("autoCategory");
    if (!vehicle.year || vehicle.year < 1900 || vehicle.year > new Date().getFullYear() + 1) missing.push(`year=${vehicle.year}`);
    if (!vehicle.cityId) missing.push("cityId (registrationPlaceId)");
    if (vehicle.zone === undefined || vehicle.zone === null || vehicle.zone < 0) missing.push(`zone=${vehicle.zone}`);
    if (!period) missing.push("periodId");

    if (missing.length > 0) {
      // Keep the modal open so the user can correct the data.
      setError(t({ uk: `Відсутні обов'язкові поля: ${missing.join(", ")}`, en: `Missing required fields: ${missing.join(", ")}` }));
      return;
    }

    // Transition to the offers screen right away — no blocking spinner in the modal.
    setError(null);
    setShowVehicleModal(false);
    setEditingVehicle(false);
    setState((s) => ({ ...s, step: "offers", vehicle, buyer, periodId: period, offers: [], offersLoading: true }));
    // Номер авто (напівпублічний) — у URL через РОУТЕР (не replaceState), щоб клік по
    // меню на /osago розпізнавався як навігація й повертав на головний екран.
    router.replace(`${pathname}?step=offers&plate=${encodeURIComponent(vehicle.number || state.plate)}`, { scroll: false });

    // Fetch offers without blocking the UI transition (period передаємо явно).
    void fetchOffers(vehicle, buyer, period);
  };

  // Зміна даних страхувальника з банера → зберігаємо й перераховуємо пропозиції.
  const handleBuyerConfirm = (buyer: BuyerData) => {
    setShowBuyerModal(false);
    if (!state.vehicle) return;
    // BuyerModal («Індивідуальна пропозиція») повертає пільгу + ДН страхувальника
    // та наймолодшого водія. Мержимо поверх поточного (ДН власника з реєстру лишається).
    const merged: BuyerData = { ...state.buyer, ...buyer };
    setState((s) => ({ ...s, buyer: merged, offers: [], offersLoading: true }));
    void fetchOffers(state.vehicle, merged, state.periodId);
  };

  // Loads offers for a confirmed vehicle and updates state when they arrive.
  // buyer передаємо явно (а не зі state), щоб одразу після зміни читати свіжі дані.
  const fetchOffers = async (vehicle: VehicleData, buyer: BuyerData, periodId: number) => {
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
        period_id: String(periodId),
        carYear: String(vehicle.year),
        carBirthdayAt: buyer.birthDate,
        policyholderBirthday: buyer.policyholderBirthDate ?? "",
        youngestBirthday: buyer.youngestBirthDate ?? "",
      };

      const res = await fetch(`/api/insurance/offers?${new URLSearchParams(paramsObj)}`);
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error ?? t({ uk: "Помилка завантаження пропозицій", en: "Error loading offers" }));
      }

      const offersResp = json.data;
      const offers: InsuranceOffer[] = Array.isArray(offersResp?.data) ? offersResp.data : [];

      if (offers.length === 0) {
        throw new Error(t({ uk: "Не знайдено пропозицій для вашого авто. Спробуйте змінити параметри.", en: "No offers found for your vehicle. Try changing the parameters." }));
      }

      setState((s) => ({ ...s, offers, offersLoading: false }));
    } catch (e) {
      console.error("[offers] error →", e);
      setError(e instanceof Error ? e.message : t({ uk: "Помилка", en: "Error" }));
      setState((s) => ({ ...s, offersLoading: false }));
    }
  };

  // Відновлення з URL при перезавантаженні: за номером авто робимо lookup і одразу
  // показуємо пропозиції (з дефолтним страхувальником; ПІБ/ДН — не в URL). Крок
  // оформлення (/checkout) і так переживає reload через sessionStorage.
  const didRestore = useRef(false);
  useEffect(() => {
    if (didRestore.current) return;
    didRestore.current = true;
    const sp = new URLSearchParams(window.location.search);
    const plate = sp.get("plate");
    if (sp.get("step") !== "offers" || !plate) return;
    (async () => {
      try {
        const res = await fetch(`/api/vehicle/${encodeURIComponent(plate)}`);
        const json = await res.json();
        if (!json.success) return; // не вдалося — лишаємось на головному екрані
        const car = json.data;
        const vehicle: VehicleData = {
          number: car.number ?? plate,
          vin: car.vin ?? "",
          year: Number(car.year),
          model: car.model ?? "",
          mark: car.mark ?? "",
          autoCategory: car.autoCategory ?? "B1",
          ...(car.city?.id
            ? { cityId: car.city.id, cityName: car.city.name_full_name_ua || car.city.name_ua || "", zone: car.city.zone }
            : { cityId: 1, cityName: "м. Київ", zone: 1 }),
          capacity: car.additionalParameters?.capacity ? Number(car.additionalParameters.capacity) : undefined,
          numberOfSeats: car.additionalParameters?.numberOfSeats ? Number(car.additionalParameters.numberOfSeats) : undefined,
          ownWeight: car.additionalParameters?.ownWeight ? Number(car.additionalParameters.ownWeight) : undefined,
          totalWeight: car.additionalParameters?.totalWeight ? Number(car.additionalParameters.totalWeight) : undefined,
        };
        // Лише рік із реєстру (день/місяць фейкові = сьогодні) → "01.01.РРРР".
        const ownerYear = typeof car.birthDateOwner === "string" && /^\d{4}-\d{2}-\d{2}$/.test(car.birthDateOwner)
          ? car.birthDateOwner.slice(0, 4)
          : "";
        const ownerDob = ownerYear ? `01.01.${ownerYear}` : "";
        const restoredBuyer = { ...DEFAULT_BUYER, birthDate: ownerDob };
        setState((s) => ({ ...s, plate, vehicle, buyer: restoredBuyer, step: "offers", offers: [], offersLoading: true }));
        void fetchOffers(vehicle, restoredBuyer, 12);
      } catch {
        // мережевий збій — лишаємось на головному екрані
      }
    })();
     
  }, []);

  // Клік по меню на /osago, поки показані пропозиції: URL стає без «?step=offers» —
  // повертаємось на головний екран (введення номера). stepRef (синхронізуємо ефектом,
  // не в рендері) — щоб не залежати від state.step у deps, інакше скидання спрацьовувало
  // б у момент самого показу оферів (гонка).
  const stepRef = useRef(state.step);
  useEffect(() => { stepRef.current = state.step; });
  useEffect(() => {
    if (searchParams.get("step") !== "offers" && stepRef.current === "offers") {
      setState((s) => ({ ...s, step: "hero" }));
    }
  }, [searchParams]);

  // Поки користувач на екрані оферів — тихо оновлюємо список кожні OFFERS_TTL_MS,
  // щоб не показувати застарілі ціни (без скелетона, щоб не миготіло).
  useEffect(() => {
    if (state.step !== "offers" || !state.vehicle) return;
    const vehicle = state.vehicle;
    const buyer = state.buyer;
    const period = state.periodId;
    const id = setInterval(() => { void fetchOffers(vehicle, buyer, period); }, OFFERS_TTL_MS);
    return () => clearInterval(id);
  }, [state.step, state.vehicle, state.buyer, state.periodId]);

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
      periodId={state.periodId}
      collectAges
      initialAges={{
        policyholderBirthDate: state.buyer.policyholderBirthDate ?? "",
        youngestBirthDate: state.buyer.youngestBirthDate ?? "",
      }}
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
          onBack={() => { setState((s) => ({ ...s, step: "hero" })); router.replace(pathname, { scroll: false }); }}
          onEdit={handleEditVehicle}
          onEditBuyer={handleEditBuyer}
          onSelectOffer={handleSelectOffer}
          periodId={state.periodId}
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
  const { t } = useI18n();
  return (
    <div
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 max-w-sm w-full mx-4 rounded-2xl bg-zinc-900 px-5 py-3.5 text-sm text-white shadow-xl cursor-pointer"
      onClick={onClose}
    >
      <span className="font-medium text-red-400">{t({ uk: "Помилка: ", en: "Error: " })}</span>
      {message}
    </div>
  );
}
