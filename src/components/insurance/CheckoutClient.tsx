"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { OtpModal } from "./OtpModal";
import { PaymentModal } from "./PaymentModal";
import { SuccessModal } from "./SuccessModal";
import { Button } from "@/components/ui/Button";
import { DateInput, parseUaDate } from "@/components/ui/DateInput";
import type { InsuranceOffer, Customer } from "@/types/api";
import { DEFAULT_BUYER, type BuyerData, type VehicleData, type VehicleDetails } from "@/types/insurance";

export function CheckoutClient() {
  const router = useRouter();
  
  // Checkout state
  const [vehicle, setVehicle] = useState<VehicleData | null>(null);
  const [offer, setOffer] = useState<InsuranceOffer | null>(null);
  const [periodId, setPeriodId] = useState<number>(12);
  const [buyer, setBuyer] = useState<BuyerData>(DEFAULT_BUYER);
  const [selectedDgoId, setSelectedDgoId] = useState<string | null>(null);
  const [selectedAutolawyerId, setSelectedAutolawyerId] = useState<string | null>(null);
  
  // UI state
  const [loaded, setLoaded] = useState(false);
  const [step, setStep] = useState<"customer" | "vehicle" | "otp" | "payment" | "success">("customer");
  
  // Data state
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [contractId, setContractId] = useState<string | null>(null);
  
  // Network state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [priceNotice, setPriceNotice] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    try {
      const data = sessionStorage.getItem("checkout_data");
      if (!data) {
        if (isMounted) router.push("/osago");
        return;
      }
      
      const parsed = JSON.parse(data);
      if (isMounted) {
        // sessionStorage доступний лише на клієнті, тож читаємо його раз на маунті
        // в ефекті: під час SSR-рендеру window недоступний і lazy-init стану не
        // спрацював би (React не перезапускає ініціалізатор при гідрації).
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setVehicle(parsed.vehicle);
        setOffer(parsed.offer);
        setPeriodId(parsed.periodId || 12);
        setBuyer(parsed.buyer ?? DEFAULT_BUYER);
        setSelectedDgoId(parsed.selectedDgoId || null);
        setSelectedAutolawyerId(parsed.selectedAutolawyerId || null);
        setLoaded(true);
      }
    } catch (e) {
      console.error("Failed to load checkout data", e);
      if (isMounted) router.push("/osago");
    }
    return () => { isMounted = false; };
  }, [router]);

  // Повідомлення (помилка/зміна ціни) рендеряться нагорі — підкручуємо до них,
  // бо кнопка «Продовжити» внизу довгої форми й інакше результат лишається поза екраном.
  useEffect(() => {
    if (error || priceNotice) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [error, priceNotice]);

  // Трекінг воронки для Telegram (fire-and-forget). Крок і контекст тримаємо у ref,
  // щоб слухач pagehide читав актуальні значення без переприв'язки листенера.
  const trackRef = useRef<{ step: string; context: Record<string, unknown> }>({ step, context: {} });
  useEffect(() => {
    trackRef.current = {
      step,
      context: {
        company: offer?.companyNamePublic || offer?.companyName,
        price: offer?.price,
        car: [vehicle?.mark, vehicle?.model].filter(Boolean).join(" "),
        plate: vehicle?.number,
        phone: customer?.phone,
        email: customer?.email,
      },
    };
  }, [step, offer, vehicle, customer]);

  useEffect(() => {
    // pagehide (а не visibilitychange) — щоб перемикання на пошту за OTP-кодом не
    // рахувалось «зривом»; спрацьовує лише при реальному виході зі сторінки.
    const onLeave = () => {
      const { step: s, context } = trackRef.current;
      if (s !== "otp" && s !== "payment") return;
      const payload = JSON.stringify({ event: "abandoned", step: s, context });
      navigator.sendBeacon?.("/api/track", new Blob([payload], { type: "application/json" }));
    };
    window.addEventListener("pagehide", onLeave);
    return () => window.removeEventListener("pagehide", onLeave);
  }, []);

  if (!loaded || !vehicle || !offer) {
    return <div className="p-8 text-center text-zinc-500">Завантаження...</div>;
  }

  // Submit flow
  const handleCustomerSubmit = (data: Customer) => {
    setCustomer(data);
    setStep("vehicle");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Перераховуємо ціну обраного оффера перед оформленням — вона могла змінитись,
  // поки користувач заповнював форму. Повертає актуальний оффер або null, якщо зник.
  const revalidateOffer = async (): Promise<InsuranceOffer | null> => {
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
    };

    // offerId Ukasko генерує заново на КОЖЕН запит (ULID), тож матчимо за стабільним
    // ключем: компанія + тариф. Крім того, Ukasko інтермітентно повертає різний набір
    // оферів — тому пробуємо кілька разів, поки обраний страховик не зʼявиться.
    const matches = (o: InsuranceOffer) =>
      o.companyId === offer.companyId && String(o.externalIdTariff) === String(offer.externalIdTariff);

    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await fetch(`/api/insurance/offers?${new URLSearchParams(paramsObj)}`);
      const json = await res.json();
      if (!json.success) continue; // тимчасовий збій — пробуємо ще раз
      const list: InsuranceOffer[] = Array.isArray(json.data?.data) ? json.data.data : [];
      const found = list.find(matches);
      if (found) return found;
    }
    return null;
  };

  const handleVehicleSubmit = async (details: VehicleDetails) => {
    if (!customer) return;
    setLoading(true);
    setError(null);
    setPriceNotice(null);
    // Один ключ ідемпотентності на спробу оформлення — захищає draft/declare від
    // дублів при подвійному кліку чи ретраї мережі.
    const idemKey = crypto.randomUUID();
    try {
      // Best-effort звірка ціни/свіжого offerId. Якщо Ukasko не повернув обраний оффер
      // (буває через інтермітентну видачу) — НЕ блокуємо покупку, оформлюємо з обраним;
      // фінальну валідацію зробить draft/declare на боці Ukasko.
      const fresh = await revalidateOffer();
      if (fresh && fresh.price !== offer.price) {
        setOffer(fresh);
        setPriceNotice(
          `Ціна оновилася: ${offer.price} → ${fresh.price} грн. Перевірте суму й натисніть «Продовжити» ще раз.`
        );
        return;
      }

      const payload = buildOrderPayload(
        vehicle,
        fresh ?? offer,
        periodId,
        selectedDgoId,
        selectedAutolawyerId,
        customer,
        details,
        buyer.privilegeId
      );

      // 5a. Створити чернетку
      const draftRes = await fetch("/api/insurance/order", {
        method: "POST",
        headers: { "content-type": "application/json", "idempotency-key": idemKey },
        body: JSON.stringify({ action: "draft", ...payload }),
      });
      const draftJson = await draftRes.json();
      if (!draftJson.success) throw new Error(draftJson.error ?? "Помилка створення чернетки");
      const id = draftJson.data.id;

      // 5b. Заявити поліс
      const declareRes = await fetch("/api/insurance/order", {
        method: "POST",
        headers: { "content-type": "application/json", "idempotency-key": idemKey },
        body: JSON.stringify({ action: "declare", ...payload, orderId: id }),
      });
      const declareJson = await declareRes.json();
      if (!declareJson.success) throw new Error(declareJson.error ?? "Помилка заявлення поліса");

      const declaredId = declareJson.data?.id ?? id;
      
      // Надіслати OTP на email
      await fetch("/api/insurance/otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "send", orderId: declaredId }),
      });

      setOrderId(declaredId);
      setStep("otp");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Помилка");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpConfirm = async (otp: string) => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/insurance/otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "check", orderId, otp }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      if (!json.valid) throw new Error("Невірний код. Спробуйте ще раз.");

      setStep("payment");

      // Sales-бот: клієнт дійшов до оплати (fire-and-forget, не блокує UI).
      void fetch("/api/track", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          event: "payment_started",
          step: "payment",
          context: {
            company: offer.companyNamePublic || offer.companyName,
            price: offer.price,
            car: [vehicle.mark, vehicle.model].filter(Boolean).join(" "),
            plate: vehicle.number,
            phone: customer?.phone,
            email: customer?.email,
          },
        }),
      }).catch(() => {});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Помилка");
    } finally {
      setLoading(false);
    }
  };

  const handlePaid = (cId: string) => {
    setContractId(cId);
    setStep("success");

    // Привʼязуємо поліс до email клієнта, щоб він зʼявився в кабінеті після входу
    // через Google (за збігом email). Fire-and-forget — не блокуємо екран успіху.
    if (customer?.email && vehicle && offer) {
      void fetch("/api/policies", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: cId || orderId,
          email: customer.email,
          contractId: cId,
          orderId,
          company: offer.companyNamePublic || offer.companyName,
          vehicle: { mark: vehicle.mark, model: vehicle.model, year: vehicle.year, plate: vehicle.number },
          price: offer.price,
          startDate: offer.startDate,
          endDate: offer.endDate,
        }),
      }).catch(() => {});
    }

    sessionStorage.removeItem("checkout_data");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => {
            if (step === "vehicle") setStep("customer");
            else router.push("/osago");
          }} 
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm border border-zinc-200 text-zinc-500 transition-colors hover:text-zinc-900"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Оформлення поліса</h1>
          <p className="text-sm text-zinc-500">Крок {step === "customer" ? 1 : step === "vehicle" ? 2 : 3} з 3</p>
        </div>
      </div>

      {/* Повідомлення — НАГОРІ (під заголовком), щоб користувач їх точно побачив
          одразу після «Продовжити», а не нижче довгої форми. */}
      {priceNotice && step !== "otp" && (
        <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-700 border border-amber-200">
          <span className="font-semibold">Увага: </span>{priceNotice}
        </div>
      )}
      {error && step !== "otp" && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-100">
          <span className="font-semibold">Помилка: </span>{error}
        </div>
      )}

      <div className="rounded-2xl bg-white p-6 shadow-sm border border-zinc-200">
        {step === "customer" && (
          // We extract the form content from CustomerFormModal into a normal component, 
          // or we can reuse the modal logic by keeping it open inline. 
          // However, for a true page feeling, it's better to render just the form.
          // Since the user wants a full page checkout, let's render the forms directly.
          <CheckoutCustomerForm onSubmit={handleCustomerSubmit} />
        )}

        {step === "vehicle" && (
          <CheckoutVehicleForm 
            vehicle={vehicle} 
            customerBirthDate={
              customer
                ? new Date(customer.dateBirth * 1000)
                    .toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit", year: "numeric" })
                    .replace(/\//g, ".")
                : ""
            }
            onSubmit={handleVehicleSubmit}
            loading={loading}
          />
        )}
      </div>

      <OtpModal
        open={step === "otp"}
        onClose={() => {}} // Block closing
        onConfirm={handleOtpConfirm}
        onResend={async () => {
          if (orderId) await fetch("/api/insurance/otp", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ action: "send", orderId }),
          });
        }}
        email={customer?.email ?? ""}
        loading={loading}
        error={error}
      />

      {orderId && (
        <PaymentModal
          open={step === "payment"}
          onClose={() => {}} // Block closing
          orderId={orderId}
          amount={
            offer.price +
            (selectedDgoId
              ? Number(offer.listDgo?.find((d) => d.id === selectedDgoId)?.cost ?? 0)
              : 0) +
            (selectedAutolawyerId
              ? offer.listAutolawyer?.find((a) => a.id === selectedAutolawyerId)?.price ?? 0
              : 0)
          }
          onPaid={handlePaid}
        />
      )}

      {contractId && (
        <SuccessModal
          open={step === "success"}
          onClose={() => router.push("/")}
          contractId={contractId}
        />
      )}

    </div>
  );
}

// -------------------------------------------------------------------------
// Below are the un-modaled versions of the forms for the checkout page
// -------------------------------------------------------------------------

interface CityOption { id: number; name_ua: string; name_full_name_ua: string; zone: number; }

function CheckoutCustomerForm({ onSubmit }: { onSubmit: (c: Customer) => void }) {
  const [form, setForm] = useState({
    name: "",
    surname: "",
    patronymic: "",
    phone: "",
    email: "",
    identificationCode: "",
    dateBirth: "",
    street: "",
    house: "",
    docSerial: "",
    docNumber: "",
    docIssuedBy: "",
    docDate: "",
  });

  // Місто страхувальника обираємо з довідника, щоб надіслати коректний cityId
  // (а не хардкод Києва). full_name/zone беремо з обраного запису.
  const [cityQuery, setCityQuery] = useState("");
  const [cityResults, setCityResults] = useState<CityOption[]>([]);
  const [selectedCity, setSelectedCity] = useState<CityOption | null>(null);
  const [cityError, setCityError] = useState(false);
  const [dobError, setDobError] = useState(false);
  const [docDateError, setDocDateError] = useState(false);
  const cityRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cityQuery || cityQuery.length < 2 || selectedCity) return;
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/vehicle/cities?q=${encodeURIComponent(cityQuery)}`);
      const json = await res.json();
      if (json.success) setCityResults(json.data);
    }, 300);
    return () => clearTimeout(timer);
  }, [cityQuery, selectedCity]);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dob = parseUaDate(form.dateBirth);
    if (!dob) { setDobError(true); return; }
    setDobError(false);
    const issue = parseUaDate(form.docDate);
    if (!issue) { setDocDateError(true); return; }
    setDocDateError(false);
    if (!selectedCity) { setCityError(true); return; }
    const dateBirth = Math.floor(dob.getTime() / 1000);
    const dateOfIssue = Math.floor(issue.getTime() / 1000);

    const cityName = selectedCity.name_full_name_ua || selectedCity.name_ua;

    onSubmit({
      customerType: 1,
      name: form.name,
      surname: form.surname,
      patronymic: form.patronymic,
      identificationCode: form.identificationCode,
      dateBirth,
      phone: `+380${form.phone}`,
      email: form.email,
      documentation: {
        type: 3,
        serial: form.docSerial,
        number: form.docNumber,
        issuedBy: form.docIssuedBy,
        dateOfIssue,
        endDateOfIssue: null,
      },
      address: {
        cityId: selectedCity.id,
        street: form.street,
        house: form.house,
        cityName,
        full: `${cityName}, ${form.street}, ${form.house}`,
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-lg font-semibold text-zinc-900">Дані страхувальника</h2>
      
      <div className="space-y-5">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Особисті дані
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input label="Прізвище" value={form.surname} onChange={set("surname")} required />
            <Input label="Ім'я" value={form.name} onChange={set("name")} required />
            <Input label="По-батькові" value={form.patronymic} onChange={set("patronymic")} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DateInput
            label="Дата народження"
            value={form.dateBirth}
            onChange={(v) => { setForm((f) => ({ ...f, dateBirth: v })); if (dobError) setDobError(false); }}
            error={dobError ? "Вкажіть дату народження" : undefined}
            defaultYear={1990}
            required
          />
          <Input
            label="ІПН / ЄДРПО"
            value={form.identificationCode}
            onChange={set("identificationCode")}
            placeholder="1234567890"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Телефон</label>
            <div className="flex items-center rounded-xl border border-zinc-200 bg-white transition-colors focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
              <span className="select-none pl-4 pr-1 text-sm text-zinc-500">+380</span>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="67 123 45 67"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, "").slice(0, 9) }))}
                required
                className="h-11 w-full rounded-r-xl bg-transparent px-2 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none"
              />
            </div>
          </div>
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={set("email")}
            placeholder="email@example.com"
            required
          />
        </div>

        <div className="border-t border-zinc-100 pt-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            ID-карта (документ)
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Серія/Запис №"
              value={form.docSerial}
              onChange={set("docSerial")}
              placeholder="19860427-09718"
              required
            />
            <Input
              label="Номер документа"
              value={form.docNumber}
              onChange={set("docNumber")}
              required
            />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Ким видано (код органу)"
              value={form.docIssuedBy}
              onChange={set("docIssuedBy")}
              required
            />
            <DateInput
              label="Дата видачі"
              value={form.docDate}
              onChange={(v) => { setForm((f) => ({ ...f, docDate: v })); if (docDateError) setDocDateError(false); }}
              error={docDateError ? "Вкажіть дату видачі" : undefined}
              required
            />
          </div>
        </div>

        <div className="border-t border-zinc-100 pt-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Адреса проживання
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Input label="Вулиця" value={form.street} onChange={set("street")} required />
            </div>
            <Input label="Будинок / кв." value={form.house} onChange={set("house")} required />
          </div>
          <div className="mt-4 relative" ref={cityRef}>
            <label className="text-sm font-medium text-zinc-700">Місто</label>
            <input
              type="text"
              value={cityQuery}
              onChange={(e) => {
                setCityQuery(e.target.value);
                setSelectedCity(null);
                setCityError(false);
              }}
              placeholder="Почніть вводити місто..."
              required
              className={`mt-1.5 h-11 w-full rounded-xl border bg-white px-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 transition-colors ${
                cityError
                  ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                  : "border-zinc-200 focus:border-indigo-500 focus:ring-indigo-500"
              }`}
            />
            {selectedCity && (
              <p className="mt-1 text-xs font-medium text-emerald-600">
                ✓ {selectedCity.name_full_name_ua || selectedCity.name_ua} (зона {selectedCity.zone})
              </p>
            )}
            {cityError && !selectedCity && (
              <p className="mt-1 text-xs font-medium text-red-500">Оберіть місто зі списку</p>
            )}
            {cityResults.length > 0 && !selectedCity && cityQuery.length >= 2 && (
              <div className="absolute z-20 mt-1 w-full rounded-xl border border-zinc-200 bg-white shadow-lg overflow-hidden">
                {cityResults.map((city) => (
                  <button
                    key={city.id}
                    type="button"
                    onClick={() => {
                      setSelectedCity(city);
                      setCityQuery(city.name_full_name_ua || city.name_ua);
                      setCityResults([]);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                  >
                    {city.name_full_name_ua || city.name_ua}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-zinc-100">
        <Button type="submit" variant="primary" size="lg" className="w-full sm:w-auto px-8">
          Продовжити
        </Button>
      </div>
    </form>
  );
}

function CheckoutVehicleForm({ 
  vehicle, 
  customerBirthDate, 
  onSubmit, 
  loading 
}: { 
  vehicle: VehicleData, 
  customerBirthDate: string, 
  onSubmit: (v: VehicleDetails) => void,
  loading: boolean
}) {
  const [form, setForm] = useState<VehicleDetails>({
    odometr: "",
    kilometers: "",
    capacity: vehicle.capacity ? String(vehicle.capacity) : "",
    numberOfSeats: vehicle.numberOfSeats ? String(vehicle.numberOfSeats) : "",
    ownWeight: vehicle.ownWeight ? String(vehicle.ownWeight) : "",
    totalWeight: vehicle.totalWeight ? String(vehicle.totalWeight) : "",
    birthdayAt: customerBirthDate,
  });

  const set = (key: keyof VehicleDetails) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const isElectric = vehicle.autoCategory === "B5";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-lg font-semibold text-zinc-900">Дані транспортного засобу</h2>
      
      <div className="space-y-5">
        {/* Дані з API — тільки для перегляду */}
        <div className="rounded-xl bg-zinc-50 border border-zinc-100 px-5 py-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
            Дані з реєстру
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2">
            {[
              { label: "Марка", value: vehicle.mark },
              { label: "Модель", value: vehicle.model },
              { label: "Рік", value: vehicle.year },
              { label: "Номер", value: vehicle.number },
              { label: "VIN", value: vehicle.vin || "—" },
              { label: "Категорія", value: vehicle.autoCategory },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col">
                <span className="text-xs text-zinc-500">{label}</span>
                <span className="text-sm font-semibold text-zinc-900">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Дата народження водія */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Водій
          </p>
          <DateInput
            label="Дата народження наймолодшого водія"
            value={form.birthdayAt}
            onChange={(v) => setForm((f) => ({ ...f, birthdayAt: v }))}
            defaultYear={1990}
            required
          />
        </div>

        {/* Пробіг */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Пробіг
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Поточний пробіг (км)"
              placeholder="50000"
              value={form.odometr}
              onChange={set("odometr")}
              required
            />
            <Input
              label="Максимальний пробіг ТЗ (км)"
              placeholder="200000"
              value={form.kilometers}
              onChange={set("kilometers")}
              required
            />
          </div>
        </div>

        {/* Технічні характеристики */}
        <div className="border-t border-zinc-100 pt-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Технічні характеристики
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {isElectric ? (
              <Input
                label="Потужність (кВт)"
                placeholder="150"
                value={form.capacity}
                onChange={set("capacity")}
                required
              />
            ) : (
              <Input
                label="Об'єм двигуна (см³)"
                placeholder="1600"
                value={form.capacity}
                onChange={set("capacity")}
                required
              />
            )}
            <Input
              label="Кількість місць"
              placeholder="5"
              value={form.numberOfSeats}
              onChange={set("numberOfSeats")}
              required
            />
            <Input
              label="Маса без навантаження (кг)"
              placeholder="1200"
              value={form.ownWeight}
              onChange={set("ownWeight")}
              required
            />
            <Input
              label="Повна маса (кг)"
              placeholder="1600"
              value={form.totalWeight}
              onChange={set("totalWeight")}
              required
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-zinc-100">
        <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full sm:w-auto px-8">
          Продовжити
        </Button>
      </div>
    </form>
  );
}

// Re-using same input component since it's missing from local scope
function Input({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-zinc-700">{label}</label>
      <input
        {...props}
        className={`h-11 rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors ${props.className || ""}`}
      />
    </div>
  );
}

function buildOrderPayload(
  vehicle: VehicleData, 
  offer: InsuranceOffer, 
  periodId: number, 
  selectedDgoId: string | null, 
  selectedAutolawyerId: string | null, 
  customer: Customer,
  details: VehicleDetails,
  privilegeId: number
) {
  const v = vehicle;
  const nowTs = Math.floor(Date.now() / 1000);
  const startDate = nowTs + 86400;
  // Кінець дії поліса залежить від period_id: 15/21 — це дні, 1–12 — місяці.
  // Раніше тут було жорстко +365 днів, тож для нерічних періодів дата розходилась.
  const finishAt = periodId === 15 || periodId === 21
    ? startDate + periodId * 86400
    : (() => {
        const d = new Date(startDate * 1000);
        d.setMonth(d.getMonth() + periodId);
        return Math.floor(d.getTime() / 1000);
      })();

  const selectedDgo = selectedDgoId
    ? offer.listDgo?.find((d) => d.id === selectedDgoId)
    : null;

  const selectedAutolawyer = selectedAutolawyerId
    ? offer.listAutolawyer?.find((a) => a.id === selectedAutolawyerId)
    : null;

  const isElectric = v.autoCategory === "B5";

  return {
    productType: "osago",
    dateFromMax: offer.dateFromMax,
    franchise: 0,
    moduleId: false,
    companyId: offer.companyId,
    isTaxi: 0,
    autoCategoryType: v.autoCategory,
    registrationPlaceId: v.cityId,
    customerPrivilege: privilegeId,
    isEuroCar: 0,
    otkDate: null,
    endDate: null,
    startDate,
    finishAt,
    period_id: periodId,
    offerId: offer.offerId,
    price: offer.price,
    registrationType: 1,
    cityRegistration: {
      id: v.cityId,
      zone: v.zone,
      name_ua: v.cityName?.replace(/,?\s*Україна$/i, "").trim() ?? "",
      name_full_name_ua: v.cityName ?? "",
    },
    customer,
    car: {
      vin: v.vin || "0",
      year: v.year,
      brand: v.mark,
      model: v.model,
      number: v.number,
      withoutVin: v.vin ? 0 : 1,
      kilometers: details.kilometers || "0",
      odometr: details.odometr || "0",
      birthdayAt: details.birthdayAt || "01.01.1990",
      additional_parameters: {
        capacity: isElectric ? null : (Number(details.capacity) || v.capacity || 1600),
        kvt: isElectric ? (Number(details.capacity) || null) : null,
        ownWeight: Number(details.ownWeight) || v.ownWeight || 1000,
        totalWeight: Number(details.totalWeight) || v.totalWeight || 1500,
        numberOfSeats: Number(details.numberOfSeats) || v.numberOfSeats || 5,
      },
    },
    ...(selectedDgo
      ? {
          dgo: {
            id: selectedDgo.id,
            compensation: String(selectedDgo.coverage),
            company_id: selectedDgo.company_id,
            price: selectedDgo.cost,
          },
        }
      : {}),
    ...(selectedAutolawyer
      ? {
          autolawyer: {
            id: selectedAutolawyer.id,
            program: selectedAutolawyer.program,
            price: selectedAutolawyer.price,
            zone: v.zone,
            auto_category_type: v.autoCategory,
          },
        }
      : {}),
  };
}
