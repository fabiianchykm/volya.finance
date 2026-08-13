"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DateInput, parseUaDate } from "@/components/ui/DateInput";
import { OtpModal } from "@/components/insurance/OtpModal";
import { PaymentModal } from "@/components/insurance/PaymentModal";
import { SuccessModal } from "@/components/insurance/SuccessModal";
import type { GreenCardOffer } from "@/types/api";
import type { VehicleData } from "@/types/insurance";
import { trackEvent, trackCheckoutStarted } from "@/lib/analytics";
import { saveProfile, loadProfile, loadLastProfile, fetchServerProfile, docFieldsByKind, type CustomerProfile, type DocFields, type DocKind } from "@/lib/customer-profile";
import { useSession } from "next-auth/react";
import { cityShort, cityLong, formatPlate } from "@/lib/utils";

// Анкета оформлення «Зелена карта» (аналог CheckoutClient для ОСЦПВ):
// дані страхувальника (ПІБ укр + латиниця, документ, адреса) → заявлення
// (order/create) → OTP → оплата → contract/confirm → готовий поліс.
// Дані авто підтягуються за номером на попередньому кроці.

export interface GreenCardContext {
  offer: GreenCardOffer;
  country: number;        // 60 Європа / 117 Молдова
  periodOption: number;   // 15/21 дні, 1..12 міс
  carType: string;        // B/C/D/A/E
  startDate: string;      // "ДД.ММ.РРРР"
  vehicle: VehicleData;   // з пошуку за номером
}

// Каталог документів страхувальника: константа Ukasko → код (для API) + підписи.
// Кожен страховик приймає СВІЙ набір (offer.available_documents), тож у checkout
// показуємо лише перетин із цим каталогом. Порядок = пріоритет за замовчуванням.
type DocCode = 1 | 2 | 3;
const DOC_CATALOG: { key: string; t: DocCode; kind: DocKind; label: string; serialLabel: string }[] = [
  { key: "DOCUMENT_ID_CARD",          t: 3, kind: "idcard",  label: "ID-картка",           serialLabel: "Запис № (УНЗР)" },
  { key: "DOCUMENT_EXTERNAL_PASSPORT", t: 2, kind: "foreign", label: "Закордонний паспорт", serialLabel: "Серія" },
  { key: "DOCUMENT_PASSPORT",         t: 1, kind: "passport", label: "Паспорт (книжечка)",  serialLabel: "Серія" },
];
const kindOfDoc = (t: DocCode): DocKind => DOC_CATALOG.find((d) => d.t === t)?.kind ?? "idcard";
const DOC_FALLBACK = DOC_CATALOG.filter((d) => d.t === 3 || d.t === 1);
// Дозволені типи для конкретного офера (перетин каталогу з available_documents).
function allowedDocsFor(available?: string[]) {
  if (!available || available.length === 0) return DOC_FALLBACK;
  const hit = DOC_CATALOG.filter((d) => available.includes(d.key));
  return hit.length ? hit : DOC_FALLBACK;
}

interface CityOption { id: number; name_ua: string; name_full_name_ua: string; zone: number }

function formatUaPhone(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 9);
  return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(" ");
}

// "ДД.ММ.РРРР" → "Д-М-РРРР" (формат startDate для order/create).
// startDate для order/create — формат d-m-Y із нулями ("10-07-2026"), як у схемі.
function toDMY(ua: string): string {
  const d = parseUaDate(ua);
  if (!d) return "";
  return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
}

// dateBirth / dateOfIssue — дати-рядки "YYYY-MM-DD" (за OpenAPI-схемою, НЕ unix).
function toISODate(d: Date | null): string | null {
  if (!d) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function GreenCardCheckout({ ctx, onBack }: { ctx: GreenCardContext; onBack: () => void }) {
  const [step, setStep] = useState<"form" | "otp" | "payment" | "success">("form");
  // Анкета у 2 кроки (як в ОСЦПВ): 1 — страхувальник, 2 — авто.
  const [formStep, setFormStep] = useState<"customer" | "vehicle">("customer");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [contractId, setContractId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const v = ctx.vehicle;
  // Типи документів, дозволені обраним страховиком (напр. ARX/INGO — лише закордонний).
  const allowedDocs = allowedDocsFor(ctx.offer.available_documents);
  const isAllowedDoc = (t: number): t is DocCode => allowedDocs.some((d) => d.t === t);
  const [f, setF] = useState({
    surnameUa: "", nameUa: "", patronymicUa: "",
    surnameLat: "", nameLat: "",
    dateBirth: "", identificationCode: "",
    phone: "", email: "",
    docType: allowedDocs[0].t as DocCode, docSerial: "", docNumber: "", docIssuedBy: "", docDate: "",
    street: "", house: "", apartment: "",
    // Авто — попередньо заповнене з пошуку за номером.
    brand: v.mark ?? "", model: v.model ?? "", number: v.number ?? "", vin: v.vin ?? "",
    year: v.year ? String(v.year) : "",
    ownWeight: v.ownWeight ? String(v.ownWeight) : "",
    totalWeight: v.totalWeight ? String(v.totalWeight) : "",
    nSeating: v.numberOfSeats ? String(v.numberOfSeats) : "",
    engineSize: v.capacity ? String(v.capacity) : "",
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

  // Авто-підтягування даних авто за держ. номером — БЕЗ кнопки: щойно введено
  // повний номер (дебаунс) або при виході з поля. lastPlate захищає від повторних
  // запитів того самого номера (у т.ч. після setF нормалізованого номера).
  const [plateLoading, setPlateLoading] = useState(false);
  const [plateError, setPlateError] = useState<string | null>(null);
  const lastPlate = useRef("");
  const lookupPlate = async () => {
    const raw = f.number.replace(/\s/g, "");
    if (raw.length < 6 || plateLoading || raw === lastPlate.current) return;
    lastPlate.current = raw;
    setPlateLoading(true);
    setPlateError(null);
    try {
      const res = await fetch(`/api/vehicle/${encodeURIComponent(formatPlate(f.number))}`);
      const json = await res.json();
      if (!json.success) { setPlateError(json.error ?? "Авто не знайдено — заповніть дані вручну"); return; }
      const car = json.data;
      const ap = car.additionalParameters ?? {};
      if (car.number) lastPlate.current = String(car.number).replace(/\s/g, "");
      setF((s) => ({
        ...s,
        number: car.number ?? s.number,
        brand: car.mark ?? s.brand,
        model: car.model ?? s.model,
        year: car.year ? String(car.year) : s.year,
        vin: car.vin ?? s.vin,
        engineSize: ap.capacity ? String(ap.capacity) : s.engineSize,
        nSeating: ap.numberOfSeats ? String(ap.numberOfSeats) : s.nSeating,
        ownWeight: ap.ownWeight ? String(ap.ownWeight) : s.ownWeight,
        totalWeight: ap.totalWeight ? String(ap.totalWeight) : s.totalWeight,
      }));
    } catch {
      setPlateError("Помилка звʼязку з реєстром — заповніть дані вручну");
    } finally {
      setPlateLoading(false);
    }
  };

  // Автозапуск, щойно введено повний номер (≥8 символів) — дебаунс 600мс.
  useEffect(() => {
    const raw = f.number.replace(/\s/g, "");
    if (raw.length < 8 || raw === lastPlate.current || plateLoading) return;
    const t = setTimeout(() => { void lookupPlate(); }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.number]);

  // Поля документа памʼятаються ОКРЕМО по кожному типу: при зміні типу сташимо поточні
  // й відновлюємо збережені для нового типу (або порожні, якщо для нього ще нема даних).
  const docStash = useRef<Record<number, { serial: string; number: string; issuedBy: string; date: string }>>({});
  const changeDocType = (t: DocCode) => setF((s) => {
    if (s.docType === t) return s;
    docStash.current[s.docType] = { serial: s.docSerial, number: s.docNumber, issuedBy: s.docIssuedBy, date: s.docDate };
    const saved = docStash.current[t];
    return { ...s, docType: t, docSerial: saved?.serial ?? "", docNumber: saved?.number ?? "", docIssuedBy: saved?.issuedBy ?? "", docDate: saved?.date ?? "" };
  });

  // Місто (автопідбір) — як в ОСЦПВ.
  const [cityQuery, setCityQuery] = useState("");
  const [cityResults, setCityResults] = useState<CityOption[]>([]);
  const [selectedCity, setSelectedCity] = useState<CityOption | null>(null);
  const cityRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!cityQuery || cityQuery.length < 2 || selectedCity) return;
    const t = setTimeout(async () => {
      const res = await fetch(`/api/vehicle/cities?q=${encodeURIComponent(cityQuery)}`);
      const json = await res.json();
      if (json.success) setCityResults(json.data);
    }, 300);
    return () => clearTimeout(t);
  }, [cityQuery, selectedCity]);

  // Автопідстановка збереженого профілю страхувальника (як в ОСЦПВ). Оновлюємо лише
  // поля страхувальника — латинські ПІБ і дані авто (підтягнуті з реєстру) не чіпаємо.
  const applyProfile = (p: CustomerProfile) => {
    // Засіваємо памʼять по локальних типах із КАНОНІЧНИХ сутностей (щоб дані одного
    // документа не «протікали» під інший — навіть між продуктами з різними кодами).
    const stash: Record<number, DocFields> = {};
    for (const d of DOC_CATALOG) { const fx = docFieldsByKind(p, d.kind); if (fx) stash[d.t] = fx; }
    docStash.current = stash;
    // Беремо збережений тип-сутність, лише якщо цей страховик його приймає; інакше —
    // перший дозволений (напр. закордонний паспорт для ARX/INGO), з чистими полями.
    const wantT = DOC_CATALOG.find((d) => d.kind === p.lastDocKind)?.t;
    const dt: DocCode = wantT && isAllowedDoc(wantT) ? wantT : allowedDocs[0].t;
    const active = stash[dt];
    setF((s) => ({
      ...s,
      surnameUa: p.surname, nameUa: p.name, patronymicUa: p.patronymic,
      surnameLat: p.surnameLat || s.surnameLat, nameLat: p.nameLat || s.nameLat,
      phone: p.phone, email: p.email,
      identificationCode: p.identificationCode,
      dateBirth: p.dateBirth,
      docType: dt,
      docSerial: active?.serial ?? "",
      docNumber: active?.number ?? "",
      docIssuedBy: active?.issuedBy ?? "",
      docDate: active?.date ?? "",
      street: p.street, house: p.house,
    }));
    if (p.city) {
      setSelectedCity(p.city);
      setCityQuery(cityShort(p.cityQuery || p.city.name_full_name_ua || p.city.name_ua));
    }
  };

  // При відкритті форми підставляємо останній збережений профіль (з пристрою).
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus]);

  // Якщо введений email збігається зі збереженим профілем — автозаповнюємо решту.
  const handleEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setF((s) => ({ ...s, email }));
    if (authStatus === "authenticated") {
      const saved = loadProfile(email);
      if (saved) applyProfile(saved);
    }
  };

  const buildPayload = () => {
    const dob = parseUaDate(f.dateBirth);
    const docDate = parseUaDate(f.docDate);
    const cityName = selectedCity?.name_full_name_ua || selectedCity?.name_ua || "";
    // Місто реєстрації — за схемою carInfo.city це ОБ'ЄКТ {id,name,name_full_name_ua},
    // а не рядок (інакше Laravel обнуляє поле і падає "array offset on value of type null").
    const cityObj = {
      id: selectedCity?.id ?? 1,
      name: selectedCity?.name_ua ?? cityName,
      name_full_name_ua: cityName || (selectedCity?.name_ua ?? ""),
    };
    return {
      action: "declare",
      // За схемою достатньо offerId — решту (тариф/компанія/модуль) бекенд бере з бази.
      offerInfo: { offerId: ctx.offer.offerId },
      price: ctx.offer.price,
      startDate: toDMY(ctx.startDate),          // d-m-Y
      periodOptionId: ctx.periodOption,
      userTypeId: 1,
      carTypeExternalId: ctx.carType,
      countryId: ctx.country,
      info: {
        surname: f.surnameLat, name: f.nameLat,
        surname_ua: f.surnameUa, name_ua: f.nameUa, patronymic_ua: f.patronymicUa,
        dateBirth: toISODate(dob),              // YYYY-MM-DD
        phone: `+380${f.phone.replace(/\D/g, "")}`,
        mail: f.email,
        identificationCode: f.identificationCode,
        withoutIdentificationCode: !f.identificationCode,   // boolean
        // Тип особи (фізособа): держ.(комунальне) підприємство? / ФОП? — булеві.
        // ARX без них падає "Undefined offset: 4" у OrderGreenCardRequest.
        isDP: false,
        isFop: false,
        region: cityName, city: cityName, cityId: selectedCity?.id ?? 1,
        street: f.street, house: f.house, apartment: f.apartment,
        documentation: {
          type: f.docType, serial: f.docSerial, number: f.docNumber,
          issuedBy: f.docIssuedBy,
          dateOfIssue: toISODate(docDate),      // YYYY-MM-DD
          endDateOfIssue: null,
        },
      },
      carInfo: {
        brand: f.brand, model: f.model, number: f.number.replace(/\s/g, ""),
        vin: f.vin || "0", withoutVin: !f.vin, year: f.year || null,   // year — рядок
        autoCategory: ctx.carType,
        ownWeight: Number(f.ownWeight) || null, totalWeight: Number(f.totalWeight) || null,
        nSeating: Number(f.nSeating) || null, engineSize: Number(f.engineSize) || null,
        city: cityObj,                          // об'єкт, НЕ рядок
      },
    };
  };

  // Крок 1 → 2: валідуємо дані страхувальника перед переходом до авто.
  const goToVehicle = () => {
    if (!f.surnameUa || !f.nameUa || !f.surnameLat || !f.nameLat) { setError("Заповніть ПІБ"); return; }
    if (!parseUaDate(f.dateBirth)) { setError("Вкажіть коректну дату народження"); return; }
    if (f.phone.replace(/\D/g, "").length < 9) { setError("Вкажіть номер телефону"); return; }
    if (!f.email) { setError("Вкажіть email"); return; }
    if (!f.docSerial || !f.docNumber || !f.docIssuedBy || !parseUaDate(f.docDate)) { setError("Заповніть дані документа"); return; }
    if (!selectedCity) { setError("Оберіть місто зі списку"); return; }
    if (!f.street || !f.house) { setError("Вкажіть адресу проживання"); return; }
    setError(null);
    // Зберігаємо профіль страхувальника вже на переході до кроку авто (як в ОСЦПВ) —
    // дані вціліють, навіть якщо клієнт не завершить оформлення.
    saveProfile({
      surname: f.surnameUa, name: f.nameUa, patronymic: f.patronymicUa,
      surnameLat: f.surnameLat, nameLat: f.nameLat,
      phone: f.phone, email: f.email,
      identificationCode: f.identificationCode,
      dateBirth: f.dateBirth,
      street: f.street, house: f.house,
      docType: f.docType, docKind: kindOfDoc(f.docType),
      docSerial: f.docSerial, docNumber: f.docNumber, docIssuedBy: f.docIssuedBy, docDate: f.docDate,
      city: selectedCity, cityQuery,
    });
    setFormStep("vehicle");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!parseUaDate(f.dateBirth)) { setError("Вкажіть коректну дату народження"); return; }
    if (!selectedCity) { setError("Оберіть місто зі списку"); return; }
    setLoading(true);
    setError(null);
    try {
      const idem = crypto.randomUUID();
      const res = await fetch("/api/greencard/order", {
        method: "POST",
        headers: { "content-type": "application/json", "idempotency-key": idem },
        body: JSON.stringify(buildPayload()),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Помилка заявлення поліса");
      const id = json.data?.id;
      setOrderId(id);
      // Надсилаємо OTP на email (спільний ендпоінт з ОСЦПВ).
      await fetch("/api/insurance/otp", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "send", orderId: id }),
      });
      trackCheckoutStarted({
        product: "Зелена карта",
        name: [f.surnameUa, f.nameUa, f.patronymicUa].filter(Boolean).join(" "),
        company: ctx.offer.companyNamePublic || ctx.offer.companyName,
        price: ctx.offer.price,
        phone: `+380${f.phone.replace(/\D/g, "")}`,
        email: f.email,
      });
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpConfirm = async (otp: string) => {
    if (!orderId) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/insurance/otp", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "check", orderId, otp }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      if (!json.valid) throw new Error("Невірний код. Спробуйте ще раз.");
      setStep("payment");
      trackEvent("begin_checkout", { product: "greencard", currency: "UAH", value: ctx.offer.price });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "h-11 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500";

  return (
    <div className="rounded-2xl bg-white dark:bg-zinc-900 p-5 text-left shadow-2xl sm:p-7">
      <div className="mb-5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => (formStep === "vehicle" ? setFormStep("customer") : onBack())}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Оформлення Зеленої карти</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Крок {formStep === "customer" ? 1 : 2} з 2 · <span className="font-semibold text-zinc-900 dark:text-zinc-100">{ctx.offer.price} грн</span>
          </p>
        </div>
      </div>

      {error && <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600 border border-red-200">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {formStep === "customer" && (
        <>
        {/* Страхувальник */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Страхувальник</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input label="Прізвище" value={f.surnameUa} onChange={set("surnameUa")} required />
            <Input label="Ім'я" value={f.nameUa} onChange={set("nameUa")} required />
            <Input label="По-батькові" value={f.patronymicUa} onChange={set("patronymicUa")} />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Прізвище (латиницею)" value={f.surnameLat} onChange={set("surnameLat")} placeholder="як у закордонному паспорті" required />
            <Input label="Ім'я (латиницею)" value={f.nameLat} onChange={set("nameLat")} placeholder="як у закордонному паспорті" required />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DateInput label="Дата народження" value={f.dateBirth} onChange={(v) => setF((s) => ({ ...s, dateBirth: v }))} defaultYear={1990} required />
            <Input label="ІПН" value={f.identificationCode} onChange={set("identificationCode")} placeholder="1234567890" />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Телефон</label>
              <div className="flex items-center rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
                <span className="pl-4 pr-1 text-sm text-zinc-500 dark:text-zinc-400">+380</span>
                <input type="tel" inputMode="numeric" placeholder="67 123 45 67" value={formatUaPhone(f.phone)}
                  onChange={(e) => setF((s) => ({ ...s, phone: e.target.value.replace(/\D/g, "").slice(0, 9) }))}
                  required className="h-11 w-full rounded-r-xl bg-transparent px-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none" />
              </div>
            </div>
            <Input label="Email" type="email" value={f.email} onChange={handleEmail} placeholder="email@example.com" required />
          </div>
        </div>

        {/* Документ */}
        <div className="border-t border-zinc-100 dark:border-zinc-800 pt-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Документ, що посвідчує особу</p>
          <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {allowedDocs.map(({ t, label }) => (
              <button key={t} type="button" onClick={() => changeDocType(t)}
                className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                  f.docType === t ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-200 dark:ring-indigo-900" : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-indigo-200"
                }`}>{label}</button>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label={DOC_CATALOG.find((d) => d.t === f.docType)?.serialLabel ?? "Серія"} value={f.docSerial} onChange={set("docSerial")} required />
            <Input label="Номер документа" value={f.docNumber} onChange={set("docNumber")} required />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Ким видано" value={f.docIssuedBy} onChange={set("docIssuedBy")} required />
            <DateInput label="Дата видачі" value={f.docDate} onChange={(v) => setF((s) => ({ ...s, docDate: v }))} required />
          </div>
        </div>

        {/* Адреса */}
        <div className="border-t border-zinc-100 dark:border-zinc-800 pt-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Адреса проживання</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="relative sm:col-span-2" ref={cityRef}>
              <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Місто</label>
              <input type="text" value={cityQuery} placeholder="Почніть вводити місто…" required spellCheck={false}
                onChange={(e) => { setCityQuery(e.target.value); setSelectedCity(null); }}
                className={`${inputCls}${selectedCity ? " border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/40" : ""}`} />
              {cityResults.length > 0 && !selectedCity && cityQuery.length >= 2 && (
                <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg">
                  {cityResults.map((c) => (
                    <button key={c.id} type="button" onClick={() => { setSelectedCity(c); setCityQuery(cityShort(c.name_full_name_ua || c.name_ua)); setCityResults([]); }}
                      className="w-full px-4 py-2 text-left text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/60">{cityLong(c.name_full_name_ua || c.name_ua)}</button>
                  ))}
                </div>
              )}
            </div>
            <Input label="Вулиця" value={f.street} onChange={set("street")} required />
            <Input label="Будинок / кв." value={f.house} onChange={set("house")} required />
          </div>
        </div>

        <div className="flex justify-end border-t border-zinc-100 dark:border-zinc-800 pt-4">
          <Button type="button" onClick={goToVehicle} variant="primary" size="lg" className="w-full sm:w-auto sm:px-8">
            <span className="flex items-center gap-2">Далі <ArrowRight className="h-5 w-5" /></span>
          </Button>
        </div>
        </>
        )}

        {formStep === "vehicle" && (
        <>
        {/* Авто */}
        <div className="border-t border-zinc-100 dark:border-zinc-800 pt-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Транспортний засіб</p>

          {/* Держ. номер — така сама комірка в сітці, як решта; підтягує дані авто. */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input
              label="Держ. номер"
              value={f.number}
              onChange={(e) => setF((s) => ({ ...s, number: e.target.value.toUpperCase() }))}
              onBlur={lookupPlate}
              placeholder="AA 1234 BB"
              required
            />
            <Input label="Марка" value={f.brand} onChange={set("brand")} placeholder="AUDI" required />
            <Input label="Модель" value={f.model} onChange={set("model")} placeholder="A4" required />
            <Input label="VIN" value={f.vin} onChange={set("vin")} placeholder="необовʼязково" />
            <Input label="Рік випуску" value={f.year} onChange={set("year")} placeholder="2015" required />
            <Input label="Обʼєм двигуна (см³)" value={f.engineSize} onChange={set("engineSize")} placeholder="1600" />
            <Input label="Кількість місць" value={f.nSeating} onChange={set("nSeating")} placeholder="5" />
            <Input label="Маса без навантаження (кг)" value={f.ownWeight} onChange={set("ownWeight")} placeholder="1200" />
            <Input label="Повна маса (кг)" value={f.totalWeight} onChange={set("totalWeight")} placeholder="1600" />
          </div>
          {plateLoading ? (
            <p className="mt-2 text-xs font-medium text-indigo-500">Підтягуємо дані авто за номером…</p>
          ) : plateError ? (
            <p className="mt-2 text-xs font-medium text-amber-600">{plateError}</p>
          ) : (
            <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">Введіть держ. номер — марка, модель і решта підтягнуться автоматично.</p>
          )}
        </div>

        <div className="flex justify-end border-t border-zinc-100 dark:border-zinc-800 pt-4">
          <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full sm:w-auto sm:px-8">
            Продовжити до оплати
          </Button>
        </div>
        </>
        )}
      </form>

      <OtpModal
        open={step === "otp"}
        onClose={() => setStep("form")}
        onConfirm={handleOtpConfirm}
        onResend={async () => { if (orderId) await fetch("/api/insurance/otp", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "send", orderId }) }); }}
        email={f.email}
        loading={loading}
        error={error}
      />

      {orderId && (
        <PaymentModal
          open={step === "payment"}
          onClose={() => setStep("form")}
          orderId={orderId}
          amount={ctx.offer.price}
          confirmEndpoint="/api/greencard/order"
          onPaid={(cId) => {
            trackEvent("purchase", { product: "greencard", currency: "UAH", value: ctx.offer.price, transaction_id: cId });
            setContractId(cId);
            setStep("success");
          }}
        />
      )}

      {contractId && (
        <SuccessModal open={step === "success"} onClose={onBack} contractId={contractId} />
      )}
    </div>
  );
}
