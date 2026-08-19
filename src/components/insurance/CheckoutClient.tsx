"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { OtpModal } from "./OtpModal";
import { PaymentModal } from "./PaymentModal";
import { SuccessModal } from "./SuccessModal";
import { Button } from "@/components/ui/Button";
import { registerPendingOrder } from "@/lib/pending-order-client";
import { DateInput, parseUaDate } from "@/components/ui/DateInput";
import { AutocompleteInput } from "@/components/ui/AutocompleteInput";
import { searchMarks, searchModels } from "@/lib/car-catalog";
import { saveProfile, loadProfile, loadLastProfile, fetchServerProfile, docFieldsByKind, type CustomerProfile, type DocFields, type DocKind } from "@/lib/customer-profile";

// Локальні числові коди документів ОСЦПВ → канонічний тип-сутність.
const OSAGO_DOC_KIND: Record<1 | 3 | 4, DocKind> = { 1: "passport", 3: "idcard", 4: "license" };
import { useSession } from "next-auth/react";
import type { InsuranceOffer, Customer } from "@/types/api";
import { DEFAULT_BUYER, type BuyerData, type VehicleData, type VehicleDetails } from "@/types/insurance";
import { trackEvent, trackCheckoutStarted } from "@/lib/analytics";
import { cityShort, cityLong } from "@/lib/utils";
import { osagoDobForCompany } from "@/lib/osago-age-basis";
import { useI18n } from "@/lib/i18n";

// Відображення телефону групами: "671234567" → "67 123 45 67" (зберігаємо цифри).
function formatUaPhone(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 9);
  return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(" ");
}

// Unix-секунди → "DD.MM.YYYY" (формат carBirthdayAt для калькулятора ОСЦПВ).
function unixToUaDate(sec: number): string {
  const d = new Date(sec * 1000);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

export function CheckoutClient() {
  const router = useRouter();
  const { t } = useI18n();

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
    return <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">{t({ uk: "Завантаження...", en: "Loading..." })}</div>;
  }

  // Submit flow
  const handleCustomerSubmit = (data: Customer, youngestBirth: string) => {
    setCustomer(data);
    // Оновлюємо ДН у buyer, щоб перерахунок ціни (revalidateOffer) враховував
    // саме те, що клієнт підтвердив на цьому кроці.
    setBuyer((b) => ({ ...b, policyholderBirthDate: unixToUaDate(data.dateBirth), youngestBirthDate: youngestBirth || b.youngestBirthDate }));
    setStep("vehicle");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Перераховуємо ціну обраного оффера перед оформленням під РЕАЛЬНІ дані страхувальника
  // (дата народження впливає на ціну!). Раніше рахували з buyer.birthDate — дефолтною
  // 01.01.1990, тож різниця не ловилась і клієнт міг оплатити не ту суму.
  const revalidateOffer = async (): Promise<InsuranceOffer | null> => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startDate = `${String(tomorrow.getDate()).padStart(2, "0")}.${String(tomorrow.getMonth() + 1).padStart(2, "0")}.${tomorrow.getFullYear()}`;

    // Ця СК рахує ціну за віком конкретної особи (власник/страхувальник/наймолодший —
    // osago-age-basis). Беремо саме ЇЇ дату, щоб перерахунок збігся з ціною у видачі.
    // Страхувальник — реальна ДН із форми checkout (фолбек — введена в калькуляторі).
    const realPolicyholder = customer?.dateBirth ? unixToUaDate(customer.dateBirth) : (buyer.policyholderBirthDate || buyer.birthDate);
    const dobs = {
      owner: buyer.birthDate,
      policyholder: realPolicyholder,
      youngest: buyer.youngestBirthDate || buyer.birthDate,
    };
    const companyName = [offer.companyNamePublic, offer.companyName].filter(Boolean).join(" ");
    const effectiveDob = osagoDobForCompany(companyName, dobs) || realPolicyholder;

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
      carBirthdayAt: effectiveDob,
    };

    // Матчимо ЛИШЕ за companyId (стабільний). УВАГА: externalIdTariff — це JSON
    // коефіцієнтів, що ЗМІНЮЄТЬСЯ з датою народження (K4 = вік) і містить саму ціну,
    // тож матч по ньому падав при зміні ДН → ціна не оновлювалась. Для ОСЦПВ один
    // базовий офер на компанію, тож companyId однозначний.
    const matches = (o: InsuranceOffer) => o.companyId === offer.companyId;

    for (let attempt = 0; attempt < 3; attempt++) {
      // nocache — щоб отримати СВІЖИЙ offerId (кешований міг протухнути → 422).
      const res = await fetch(`/api/insurance/offers?${new URLSearchParams({ ...paramsObj, nocache: "1" })}`);
      const json = await res.json();
      if (!json.success) continue; // тимчасовий збій — пробуємо ще раз
      const list: InsuranceOffer[] = Array.isArray(json.data?.data) ? json.data.data : [];
      const found = list.find(matches);
      if (found) return found;
    }
    return null;
  };

  const handleVehicleSubmit = async (details: VehicleDetails) => {
    if (!customer || !vehicle) return;
    // Марку/модель/VIN користувач заповнює саме тут (на розрахунок не впливають) —
    // вливаємо їх у vehicle для замовлення й подальших екранів.
    const mergedVehicle: VehicleData = {
      ...vehicle,
      mark: details.mark?.trim() || vehicle.mark || "",
      model: details.model?.trim() || vehicle.model || "",
      vin: details.vin?.trim() || vehicle.vin || "",
    };
    setVehicle(mergedVehicle);
    setLoading(true);
    setError(null);
    setPriceNotice(null);
    // Один ключ ідемпотентності на спробу оформлення — захищає draft/declare від
    // дублів при подвійному кліку чи ретраї мережі.
    const idemKey = crypto.randomUUID();
    try {
      // Обовʼязково беремо СВІЖИЙ offerId: пропозиції ОСЦПВ мають короткий термін
      // життя, і застарілий offerId Ukasko відхиляє з 422 «offer id не коректне».
      // Тож НЕ declare-имось зі старим — якщо свіжого нема, просимо повторити.
      const fresh = await revalidateOffer();
      if (!fresh) {
        setError(t({
          uk: "Пропозиція застаріла або страхова тимчасово недоступна. Натисніть «Продовжити» ще раз, а якщо не спрацює — поверніться до пропозицій і перерахуйте вартість.",
          en: "The offer has expired or the insurer is temporarily unavailable. Click \"Continue\" again; if it doesn't work, go back to the offers and recalculate.",
        }));
        setLoading(false);
        return;
      }
      if (fresh.price !== offer.price) {
        setOffer(fresh);
        setPriceNotice(
          t({
            uk:
              `Страхова компанія перерахувала вартість поліса за вказаною датою народження. ` +
              `Актуальна ціна: ${fresh.price} грн (у пропозиції — ${offer.price} грн). ` +
              `Перевірте суму й натисніть «Продовжити», щоб перейти до оплати.`,
            en:
              `The insurance company recalculated the policy price based on the specified date of birth. ` +
              `Current price: ${fresh.price} UAH (in the offer — ${offer.price} UAH). ` +
              `Check the amount and click "Continue" to proceed to payment.`,
          })
        );
        return;
      }

      const payload = buildOrderPayload(
        mergedVehicle,
        fresh, // гарантовано свіжий оффер (див. перевірку !fresh вище)
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
      if (!draftJson.success) throw new Error(draftJson.error ?? t({ uk: "Помилка створення чернетки", en: "Error creating draft" }));
      const id = draftJson.data.id;

      // 5b. Заявити поліс
      const declareRes = await fetch("/api/insurance/order", {
        method: "POST",
        headers: { "content-type": "application/json", "idempotency-key": idemKey },
        body: JSON.stringify({ action: "declare", ...payload, orderId: id }),
      });
      const declareJson = await declareRes.json();
      if (!declareJson.success) throw new Error(declareJson.error ?? t({ uk: "Помилка заявлення поліса", en: "Error declaring the policy" }));

      const declaredId = declareJson.data?.id ?? id;

      // Контекст фіналізації — щоб /payment-success уклав поліс і зберіг його в
      // кабінет навіть якщо клієнта редіректнуло з модалки оплати.
      registerPendingOrder({
        orderId: declaredId, product: "osago",
        meta: {
          email: customer?.email, phone: customer?.phone,
          customerName: [customer?.surname, customer?.name, customer?.patronymic].filter(Boolean).join(" "),
          company: offer?.companyNamePublic || offer?.companyName,
          price: offer?.price,
          vehicle: { mark: mergedVehicle.mark, model: mergedVehicle.model, year: mergedVehicle.year, plate: mergedVehicle.number },
          startDate: offer?.startDate, endDate: offer?.endDate,
          productLabel: "Автоцивілка",
        },
      });

      // Надіслати OTP на email
      await fetch("/api/insurance/otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "send", orderId: declaredId }),
      });

      trackCheckoutStarted({
        product: "Автоцивілка",
        name: [customer?.surname, customer?.name, customer?.patronymic].filter(Boolean).join(" "),
        company: offer?.companyNamePublic || offer?.companyName,
        price: offer?.price,
        car: [mergedVehicle.mark, mergedVehicle.model].filter(Boolean).join(" "),
        phone: customer?.phone,
        email: customer?.email,
      });
      setOrderId(declaredId);
      setStep("otp");
    } catch (e) {
      setError(e instanceof Error ? e.message : t({ uk: "Помилка", en: "Error" }));
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
      if (!json.valid) throw new Error(t({ uk: "Невірний код. Спробуйте ще раз.", en: "Invalid code. Please try again." }));

      setStep("payment");

      // Клієнт дійшов до оплати — ще раз зберігаємо його дані (з даних замовлення).
      // saveProfile мержиться з локальним кешем, тож у БД летить повний профіль.
      if (customer?.email) {
        const doc = customer.documentation;
        const dt = doc?.type as 1 | 3 | 4;
        saveProfile({
          email: customer.email,
          surname: customer.surname,
          name: customer.name,
          patronymic: customer.patronymic,
          phone: customer.phone.replace(/^\+?380/, ""),
          identificationCode: customer.identificationCode,
          dateBirth: unixToUaDate(customer.dateBirth),
          street: customer.address?.street,
          house: customer.address?.house,
          docType: dt,
          docKind: OSAGO_DOC_KIND[dt],
          docSerial: doc?.serial,
          docNumber: doc?.number,
          docIssuedBy: doc?.issuedBy,
          docDate: doc?.dateOfIssue ? unixToUaDate(doc.dateOfIssue) : undefined,
        });
      }

      // Конверсія для GA4/Ads: клієнт дійшов до оплати.
      trackEvent("begin_checkout", {
        product: "osago",
        currency: "UAH",
        value: offer.price,
        company: offer.companyNamePublic || offer.companyName,
      });

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
      setError(e instanceof Error ? e.message : t({ uk: "Помилка", en: "Error" }));
    } finally {
      setLoading(false);
    }
  };

  const handlePaid = (cId: string) => {
    setContractId(cId);
    setStep("success");

    // Головна конверсія для GA4/Google Ads: поліс оплачено й оформлено.
    trackEvent("purchase", {
      product: "osago",
      currency: "UAH",
      value: offer?.price,
      company: offer?.companyNamePublic || offer?.companyName,
      transaction_id: cId,
    });

    // Зберігаємо поліс із ПОВНИМИ даними клієнта. Прив'язка до акаунта — і за email
    // (Google), і за телефоном (вхід за номером). Fire-and-forget — не блокуємо екран.
    if (customer?.email && vehicle && offer) {
      const customerName = [customer.surname, customer.name, customer.patronymic].filter(Boolean).join(" ");
      void fetch("/api/policies", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: cId || orderId,
          email: customer.email,
          phone: customer.phone,
          customerName,
          customer, // повний об'єкт: ПІБ, ІПН, документ, адреса, дата народження…
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
          aria-label={t({ uk: "Назад", en: "Back" })}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm border border-zinc-200 text-zinc-500 transition-colors hover:text-zinc-900 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{t({ uk: "Оформлення поліса", en: "Policy checkout" })}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{t({ uk: `Крок ${step === "customer" ? 1 : step === "vehicle" ? 2 : 3} з 3`, en: `Step ${step === "customer" ? 1 : step === "vehicle" ? 2 : 3} of 3` })}</p>
        </div>
      </div>

      {/* Повідомлення — НАГОРІ (під заголовком), щоб користувач їх точно побачив
          одразу після «Продовжити», а не нижче довгої форми. */}
      {priceNotice && step !== "otp" && (
        <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900">
          <span className="font-semibold">{t({ uk: "Увага: ", en: "Attention: " })}</span>{priceNotice}
        </div>
      )}
      {error && step !== "otp" && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-100 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900">
          <span className="font-semibold">{t({ uk: "Помилка: ", en: "Error: " })}</span>{error}
        </div>
      )}

      <div className="rounded-2xl bg-white p-6 shadow-sm border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-700">
        {step === "customer" && (
          // We extract the form content from CustomerFormModal into a normal component, 
          // or we can reuse the modal logic by keeping it open inline. 
          // However, for a true page feeling, it's better to render just the form.
          // Since the user wants a full page checkout, let's render the forms directly.
          <CheckoutCustomerForm
            onSubmit={handleCustomerSubmit}
            initialPolicyholderBirth={buyer.policyholderBirthDate || ""}
            initialYoungestBirth={buyer.youngestBirthDate || ""}
          />
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
        onClose={() => setStep("vehicle")}
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
          onClose={() => setStep("vehicle")}
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

function CheckoutCustomerForm({ onSubmit, initialPolicyholderBirth = "", initialYoungestBirth = "" }: {
  onSubmit: (c: Customer, youngestBirth: string) => void;
  // ДН, введені ще в калькуляторі — підтягуємо, щоб не вводити повторно.
  initialPolicyholderBirth?: string;
  initialYoungestBirth?: string;
}) {
  const { t } = useI18n();
  const [form, setForm] = useState({
    name: "",
    surname: "",
    patronymic: "",
    phone: "",
    email: "",
    identificationCode: "",
    dateBirth: initialPolicyholderBirth,
    street: "",
    house: "",
    docSerial: "",
    docNumber: "",
    docIssuedBy: "",
    docDate: "",
  });
  // ДН наймолодшого водія — окремо від профілю (у профіль не входить), підтягнута з калькулятора.
  const [youngestBirth, setYoungestBirth] = useState(initialYoungestBirth);
  const [youngestErr, setYoungestErr] = useState(false);

  // Місто страхувальника обираємо з довідника, щоб надіслати коректний cityId
  // (а не хардкод Києва). full_name/zone беремо з обраного запису.
  const [cityQuery, setCityQuery] = useState("");
  const [cityResults, setCityResults] = useState<CityOption[]>([]);
  const [selectedCity, setSelectedCity] = useState<CityOption | null>(null);
  const [cityError, setCityError] = useState(false);
  const [dobError, setDobError] = useState(false);
  const [docDateError, setDocDateError] = useState(false);
  const [docType, setDocType] = useState<1 | 3 | 4>(3); // 3 = ID-карта, 1 = паспорт, 4 = водійське посвідчення
  // Поля документа памʼятаються окремо по типу: при зміні типу сташимо поточні й
  // відновлюємо збережені для нового (або порожні, якщо для нього ще нема даних).
  const docStash = useRef<Record<number, { serial: string; number: string; issuedBy: string; date: string }>>({});
  const changeDocType = (t: 1 | 3 | 4) => {
    if (t === docType) return;
    docStash.current[docType] = { serial: form.docSerial, number: form.docNumber, issuedBy: form.docIssuedBy, date: form.docDate };
    const saved = docStash.current[t];
    setForm((f) => ({ ...f, docSerial: saved?.serial ?? "", docNumber: saved?.number ?? "", docIssuedBy: saved?.issuedBy ?? "", docDate: saved?.date ?? "" }));
    setDocType(t);
  };
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

  // Підставляє збережений профіль у всі поля форми.
  const applyProfile = (p: CustomerProfile) => {
    // Памʼять документів — з канонічних сутностей (щоб водійське/паспорт/ID не плутались).
    const stash: Record<number, DocFields> = {};
    ([1, 3, 4] as const).forEach((t) => { const fx = docFieldsByKind(p, OSAGO_DOC_KIND[t]); if (fx) stash[t] = fx; });
    docStash.current = stash;
    // Тип за збереженою сутністю, якщо ОСЦПВ його приймає (закордонний → ID-картка).
    const dt: 1 | 3 | 4 = p.lastDocKind === "passport" ? 1 : p.lastDocKind === "license" ? 4 : 3;
    const active = stash[dt];
    setForm({
      name: p.name,
      surname: p.surname,
      patronymic: p.patronymic,
      phone: p.phone,
      email: p.email,
      identificationCode: p.identificationCode,
      dateBirth: p.dateBirth,
      street: p.street,
      house: p.house,
      docSerial: active?.serial ?? "",
      docNumber: active?.number ?? "",
      docIssuedBy: active?.issuedBy ?? "",
      docDate: active?.date ?? "",
    });
    setDocType(dt);
    // ДН наймолодшого водія — окремо від form (у профілі зберігається). Не затираємо
    // значення з калькулятора порожнім: підставляємо лише якщо в профілі щось є.
    if (p.youngestBirthDate) setYoungestBirth(p.youngestBirthDate);
    if (p.city) {
      setSelectedCity(p.city);
      setCityQuery(cityShort(p.cityQuery || p.city.name_full_name_ua || p.city.name_ua));
    }
    setCityError(false);
    setDobError(false);
    setDocDateError(false);
  };

  // При відкритті форми — підставляємо останній збережений профіль (свій пристрій),
  // щоб повторним клієнтам не вводити все заново. Порожній email → нічого не робимо.
  const { status: authStatus } = useSession();
  const didAutofill = useRef(false);
  useEffect(() => {
    // Автозаповнення ЛИШЕ для авторизованих (гість / після виходу — без підстановки).
    if (authStatus !== "authenticated" || didAutofill.current) return;
    didAutofill.current = true;
    const last = loadLastProfile();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (last) applyProfile(last);
    // Fallback: кеш ще порожній (ProfileSync не встиг) — тягнемо профіль напряму.
    else void fetchServerProfile().then((p) => { if (p) applyProfile(p); });

  }, [authStatus]);

  // Email — окремий обробник: якщо введений email збігається зі збереженим профілем,
  // автозаповнюємо решту полів. Так «прив'язка під email» працює й при зміні пошти.
  const handleEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setForm((f) => ({ ...f, email }));
    if (authStatus === "authenticated") {
      const saved = loadProfile(email);
      if (saved) applyProfile(saved);
    }
  };

  // Тестове автозаповнення: ввести "007" у поле «Прізвище» → форма заповнюється
  // валідними тестовими даними (щоб не вбивати все вручну під час тестування).
  const fillTestData = () => {
    setForm({
      name: "Тест",
      surname: "Тестовий",
      patronymic: "Тестович",
      phone: "671234567",
      email: "test@volya.finance",
      identificationCode: "1234567890",
      dateBirth: "01.01.1990",
      street: "Хрещатик",
      house: "1",
      docSerial: "19860427-09718",
      docNumber: "123456789",
      docIssuedBy: "1234",
      docDate: "01.01.2020",
    });
    setSelectedCity({ id: 1, name_ua: "Київ", name_full_name_ua: "м. Київ, Україна", zone: 1 });
    setCityQuery("м. Київ, Україна");
    setCityError(false);
    setDobError(false);
    setDocDateError(false);
    setDocType(3);
  };

  const handleSurname = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value.trim() === "007") { fillTestData(); return; }
    setForm((f) => ({ ...f, surname: e.target.value }));
  };

  // Підписи/плейсхолдери полів документа залежно від обраного типу.
  const docFields = {
    3: { serial: t({ uk: "Запис № (УНЗР)", en: "Record no. (UNZR)" }), serialPh: "19860427-09718", number: t({ uk: "Номер документа", en: "Document number" }), numberPh: "", issuedBy: t({ uk: "Ким видано (код органу)", en: "Issued by (authority code)" }), issuedByPh: "1234" },
    1: { serial: t({ uk: "Серія", en: "Series" }), serialPh: "АА", number: t({ uk: "Номер", en: "Number" }), numberPh: "123456", issuedBy: t({ uk: "Ким виданий", en: "Issued by" }), issuedByPh: t({ uk: "Назва органу, що видав", en: "Name of issuing authority" }) },
    4: { serial: t({ uk: "Серія", en: "Series" }), serialPh: "ААХ", number: t({ uk: "Номер", en: "Number" }), numberPh: "123456", issuedBy: t({ uk: "Ким видано", en: "Issued by" }), issuedByPh: t({ uk: "Орган, що видав", en: "Issuing authority" }) },
  }[docType];

  // Зберегти профіль страхувальника (localStorage + БД для залогінених) — викликаємо
  // і на подачі даних, і на переході до оплати (гарантований дубль-запис).
  const persistProfile = () => {
    if (!form.email) return;
    saveProfile({
      surname: form.surname,
      name: form.name,
      patronymic: form.patronymic,
      phone: form.phone,
      email: form.email,
      identificationCode: form.identificationCode,
      dateBirth: form.dateBirth,
      youngestBirthDate: youngestBirth,
      street: form.street,
      house: form.house,
      docType,
      docKind: OSAGO_DOC_KIND[docType],
      docSerial: form.docSerial,
      docNumber: form.docNumber,
      docIssuedBy: form.docIssuedBy,
      docDate: form.docDate,
      city: selectedCity,
      cityQuery,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dob = parseUaDate(form.dateBirth);
    if (!dob) { setDobError(true); return; }
    setDobError(false);
    if (!parseUaDate(youngestBirth)) { setYoungestErr(true); return; }
    setYoungestErr(false);
    const issue = parseUaDate(form.docDate);
    if (!issue) { setDocDateError(true); return; }
    setDocDateError(false);
    if (!selectedCity) { setCityError(true); return; }
    const dateBirth = Math.floor(dob.getTime() / 1000);
    const dateOfIssue = Math.floor(issue.getTime() / 1000);

    const cityName = selectedCity.name_full_name_ua || selectedCity.name_ua;

    // Зберігаємо профіль на пристрої під email — для автозаповнення наступного разу.
    persistProfile();

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
        type: docType,
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
    }, youngestBirth);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{t({ uk: "Дані страхувальника (покупця)", en: "Policyholder (buyer) details" })}</h2>

      <div className="space-y-5">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            {t({ uk: "Особисті дані", en: "Personal details" })}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input label={t({ uk: "Прізвище", en: "Surname" })} value={form.surname} onChange={handleSurname} required />
            <Input label={t({ uk: "Ім'я", en: "First name" })} value={form.name} onChange={set("name")} required />
            <Input label={t({ uk: "По-батькові", en: "Patronymic" })} value={form.patronymic} onChange={set("patronymic")} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DateInput
            label={t({ uk: "Дата народження страхувальника (покупця)", en: "Policyholder's (buyer's) date of birth" })}
            value={form.dateBirth}
            onChange={(v) => { setForm((f) => ({ ...f, dateBirth: v })); if (dobError) setDobError(false); }}
            error={dobError ? t({ uk: "Вкажіть дату народження", en: "Enter the date of birth" }) : undefined}
            defaultYear={1990}
            required
          />
          <DateInput
            label={t({ uk: "Дата народження наймолодшого водія", en: "Youngest driver's date of birth" })}
            value={youngestBirth}
            onChange={(v) => { setYoungestBirth(v); if (youngestErr) setYoungestErr(false); }}
            error={youngestErr ? t({ uk: "Вкажіть дату народження", en: "Enter the date of birth" }) : undefined}
            defaultYear={1990}
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label={t({ uk: "ІПН / ЄДРПО", en: "Tax ID / USREOU" })}
            value={form.identificationCode}
            onChange={set("identificationCode")}
            placeholder="1234567890"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{t({ uk: "Телефон", en: "Phone" })}</label>
            <div className="flex items-center rounded-xl border border-zinc-200 bg-white transition-colors focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900">
              <span className="select-none pl-4 pr-1 text-sm text-zinc-500 dark:text-zinc-400">+380</span>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="67 123 45 67"
                value={formatUaPhone(form.phone)}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, "").slice(0, 9) }))}
                required
                className="h-11 w-full rounded-r-xl bg-transparent px-2 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none dark:text-zinc-100 dark:placeholder:text-zinc-500"
              />
            </div>
          </div>
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={handleEmail}
            placeholder="email@example.com"
            required
          />
        </div>

        <div className="border-t border-zinc-100 pt-5 dark:border-zinc-800">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            {t({ uk: "Документ, що посвідчує особу", en: "Identity document" })}
          </p>
          {/* Вибір типу документа: ID-карта (type 3) або паспорт старого зразка (type 1) */}
          <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {[
              { docT: 3 as const, label: t({ uk: "ID-карта", en: "ID card" }) },
              { docT: 1 as const, label: t({ uk: "Паспорт (старого зразка)", en: "Passport (old format)" }) },
              { docT: 4 as const, label: t({ uk: "Водійське посвідчення", en: "Driver's license" }) },
            ].map(({ docT, label }) => (
              <button
                key={docT}
                type="button"
                onClick={() => changeDocType(docT)}
                className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-medium leading-tight transition-colors ${
                  docType === docT
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 dark:border-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300 dark:ring-indigo-800"
                    : "border-zinc-200 bg-white text-zinc-600 hover:border-indigo-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label={docFields.serial}
              value={form.docSerial}
              onChange={set("docSerial")}
              placeholder={docFields.serialPh}
              required
            />
            <Input
              label={docFields.number}
              value={form.docNumber}
              onChange={set("docNumber")}
              placeholder={docFields.numberPh}
              required
            />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label={docFields.issuedBy}
              value={form.docIssuedBy}
              onChange={set("docIssuedBy")}
              placeholder={docFields.issuedByPh}
              required
            />
            <DateInput
              label={t({ uk: "Дата видачі", en: "Date of issue" })}
              value={form.docDate}
              onChange={(v) => { setForm((f) => ({ ...f, docDate: v })); if (docDateError) setDocDateError(false); }}
              error={docDateError ? t({ uk: "Вкажіть дату видачі", en: "Enter the date of issue" }) : undefined}
              required
            />
          </div>
        </div>

        <div className="border-t border-zinc-100 pt-5 dark:border-zinc-800">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            {t({ uk: "Адреса проживання", en: "Residential address" })}
          </p>
          {/* ПК: Місто + Вулиця + Будинок в один ряд; моб: стек. */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-5 sm:items-start">
            {/* Місто (з автопідбором) */}
            <div className="relative sm:col-span-2" ref={cityRef}>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-200">{t({ uk: "Місто", en: "City" })}</label>
              <input
                type="text"
                spellCheck={false}
                value={cityQuery}
                onChange={(e) => {
                  setCityQuery(e.target.value);
                  setSelectedCity(null);
                  setCityError(false);
                }}
                placeholder={t({ uk: "Почніть вводити місто...", en: "Start typing a city..." })}
                required
                className={`h-11 w-full rounded-xl border bg-white px-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 transition-colors dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 ${
                  cityError
                    ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                    : selectedCity
                      ? "border-emerald-400 bg-emerald-50/40 focus:border-emerald-500 focus:ring-emerald-500 dark:bg-emerald-950/40"
                      : "border-zinc-200 focus:border-indigo-500 focus:ring-indigo-500 dark:border-zinc-700"
                }`}
              />
              {cityError && !selectedCity && (
                <p className="mt-1 text-xs font-medium text-red-500">{t({ uk: "Оберіть місто зі списку", en: "Select a city from the list" })}</p>
              )}
              {cityResults.length > 0 && !selectedCity && cityQuery.length >= 2 && (
                <div className="absolute z-20 mt-1 w-full rounded-xl border border-zinc-200 bg-white shadow-lg overflow-hidden dark:border-zinc-700 dark:bg-zinc-900">
                  {cityResults.map((city) => (
                    <button
                      key={city.id}
                      type="button"
                      onClick={() => {
                        setSelectedCity(city);
                        setCityQuery(cityShort(city.name_full_name_ua || city.name_ua));
                        setCityResults([]);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50 transition-colors dark:text-zinc-200 dark:hover:bg-zinc-800/60"
                    >
                      {cityLong(city.name_full_name_ua || city.name_ua)}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Вулиця */}
            <div className="sm:col-span-2">
              <Input label={t({ uk: "Вулиця", en: "Street" })} value={form.street} onChange={set("street")} required />
            </div>
            {/* Будинок */}
            <Input label={t({ uk: "Будинок / кв.", en: "House / apt." })} value={form.house} onChange={set("house")} required />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-zinc-100 dark:border-zinc-800">
        <Button type="submit" variant="primary" size="lg" className="w-full sm:w-auto px-8">
          {t({ uk: "Продовжити", en: "Continue" })}
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
  const { t } = useI18n();
  const [form, setForm] = useState<VehicleDetails>({
    // Пробіг більше не запитуємо у формі — API його не вимагатиме; шлемо дефолт "0".
    odometr: "0",
    kilometers: "0",
    capacity: vehicle.capacity ? String(vehicle.capacity) : "",
    numberOfSeats: vehicle.numberOfSeats ? String(vehicle.numberOfSeats) : "",
    ownWeight: vehicle.ownWeight ? String(vehicle.ownWeight) : "",
    totalWeight: vehicle.totalWeight ? String(vehicle.totalWeight) : "",
    birthdayAt: customerBirthDate,
    // Ідентифікація авто — заповнюється тут (не потрібна для розрахунку ціни).
    mark: vehicle.mark ?? "",
    model: vehicle.model ?? "",
    vin: vehicle.vin ?? "",
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
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{t({ uk: "Дані транспортного засобу", en: "Vehicle details" })}</h2>

      <div className="space-y-5">
        {/* Дані з розрахунку — тільки для перегляду */}
        <div className="rounded-xl bg-zinc-50 border border-zinc-100 px-5 py-4 space-y-3 dark:bg-zinc-800/50 dark:border-zinc-800">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2 dark:text-zinc-400">
            {t({ uk: "З розрахунку", en: "From the quote" })}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2">
            {[
              { label: t({ uk: "Рік", en: "Year" }), value: vehicle.year },
              { label: t({ uk: "Номер", en: "Plate" }), value: vehicle.number },
              { label: t({ uk: "Категорія", en: "Category" }), value: vehicle.autoCategory },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col">
                <span className="text-xs text-zinc-500 dark:text-zinc-400">{label}</span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ідентифікація авто — заповнюється тут (для розрахунку не потрібна) */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            {t({ uk: "Дані авто", en: "Vehicle" })}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AutocompleteInput
              label={t({ uk: "Марка авто", en: "Vehicle make" })}
              placeholder="Toyota"
              value={form.mark ?? ""}
              onChange={(v) => setForm((f) => ({ ...f, mark: v }))}
              options={searchMarks(form.mark ?? "")}
              required
            />
            <AutocompleteInput
              label={t({ uk: "Модель", en: "Model" })}
              placeholder="Camry"
              value={form.model ?? ""}
              onChange={(v) => setForm((f) => ({ ...f, model: v }))}
              options={searchModels(form.mark ?? "", form.model ?? "")}
              required
            />
          </div>
          <div className="mt-4">
            <Input
              label={t({ uk: "VIN-код (якщо є)", en: "VIN code (if any)" })}
              placeholder="KNEDE221266086429"
              value={form.vin ?? ""}
              onChange={set("vin")}
            />
          </div>
        </div>

        {/* Дата народження водія */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            {t({ uk: "Водій", en: "Driver" })}
          </p>
          <DateInput
            label={t({ uk: "Дата народження наймолодшого водія", en: "Date of birth of the youngest driver" })}
            value={form.birthdayAt}
            onChange={(v) => setForm((f) => ({ ...f, birthdayAt: v }))}
            defaultYear={1990}
            required
          />
        </div>


        {/* Технічні характеристики */}
        <div className="border-t border-zinc-100 pt-5 dark:border-zinc-800">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            {t({ uk: "Технічні характеристики", en: "Technical specifications" })}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {isElectric ? (
              <Input
                label={t({ uk: "Потужність (кВт)", en: "Power (kW)" })}
                placeholder="150"
                value={form.capacity}
                onChange={set("capacity")}
                required
              />
            ) : (
              <Input
                label={t({ uk: "Об'єм двигуна (см³)", en: "Engine capacity (cm³)" })}
                placeholder="1600"
                value={form.capacity}
                onChange={set("capacity")}
                required
              />
            )}
            <Input
              label={t({ uk: "Кількість місць", en: "Number of seats" })}
              placeholder="5"
              value={form.numberOfSeats}
              onChange={set("numberOfSeats")}
              required
            />
            <Input
              label={t({ uk: "Маса без навантаження (кг)", en: "Curb weight (kg)" })}
              placeholder="1200"
              value={form.ownWeight}
              onChange={set("ownWeight")}
              required
            />
            <Input
              label={t({ uk: "Повна маса (кг)", en: "Gross weight (kg)" })}
              placeholder="1600"
              value={form.totalWeight}
              onChange={set("totalWeight")}
              required
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-zinc-100 dark:border-zinc-800">
        <Button type="submit" variant="primary" size="lg" loading={loading} disabled={!form.mark?.trim() || !form.model?.trim()} className="w-full sm:w-auto px-8">
          {t({ uk: "Продовжити", en: "Continue" })}
        </Button>
      </div>
    </form>
  );
}

// Re-using same input component since it's missing from local scope
function Input({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{label}</label>
      <input
        {...props}
        className={`h-11 rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 ${props.className || ""}`}
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
