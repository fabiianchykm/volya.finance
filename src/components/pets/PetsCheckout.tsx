"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DateInput, parseUaDate } from "@/components/ui/DateInput";
import { OtpModal } from "@/components/insurance/OtpModal";
import { PaymentModal } from "@/components/insurance/PaymentModal";
import { SuccessModal } from "@/components/insurance/SuccessModal";
import { formatPrice } from "@/lib/utils";
import type { PetsOffer } from "@/types/api";
import { trackEvent } from "@/lib/analytics";
import { saveProfile, loadProfile, loadLastProfile, type CustomerProfile } from "@/lib/customer-profile";

// Анкета оформлення страхування тварин: дані улюбленця + власника → order/create
// (statusId:5) → OTP → оплата → confirm → поліс. Дати — Unix timestamp (сек).

export interface PetsCheckoutCtx {
  offer: PetsOffer;
  petType: string;          // cat | dog
  insurancePeriod: string;  // 6m | 9m | 12m
  startDate: string;        // ДД.ММ.РРРР
  earnings: number;         // комісія, з якою пораховано офер
}

const DOC_TYPES = [
  { t: 3 as const, label: "ID-карта" },
  { t: 1 as const, label: "Паспорт (книжечка)" },
];

interface CityOption { id: number; name_ua: string; name_full_name_ua: string; zone: number }

function formatUaPhone(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 9);
  return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(" ");
}
const toUnix = (ua: string): number | null => { const d = parseUaDate(ua); return d ? Math.floor(d.getTime() / 1000) : null; };

export function PetsCheckout({ ctx, onBack }: { ctx: PetsCheckoutCtx; onBack: () => void }) {
  const [step, setStep] = useState<"form" | "otp" | "payment" | "success">("form");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [contractId, setContractId] = useState<string | null>(null);
  const [savedOrder, setSavedOrder] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [f, setF] = useState({
    // Тварина
    petAlias: "", petBreed: "", petSex: "male" as "male" | "female", petBirthDate: "",
    vetPassportNumber: "", vetPassportIssuedBy: "", vetPassportDate: "", microchipCode: "",
    // Власник
    surnameUa: "", nameUa: "", patronymicUa: "", surnameLat: "", nameLat: "",
    dateBirth: "", identificationCode: "", phone: "", email: "",
    docType: 3 as 1 | 3, docSerial: "", docNumber: "", docIssuedBy: "", docDate: "",
    street: "", house: "", apartment: "",
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

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

  // Автопідстановка збереженого профілю власника (як в ОСЦПВ). Оновлюємо лише поля
  // власника — латинські ПІБ і дані тварини не чіпаємо. docType звужуємо до 1|3.
  const applyProfile = (p: CustomerProfile) => {
    setF((s) => ({
      ...s,
      surnameUa: p.surname, nameUa: p.name, patronymicUa: p.patronymic,
      phone: p.phone, email: p.email,
      identificationCode: p.identificationCode,
      dateBirth: p.dateBirth,
      docType: p.docType === 1 ? 1 : 3,
      docSerial: p.docSerial, docNumber: p.docNumber, docIssuedBy: p.docIssuedBy, docDate: p.docDate,
      street: p.street, house: p.house,
    }));
    if (p.city) {
      setSelectedCity(p.city);
      setCityQuery(p.cityQuery || p.city.name_full_name_ua || p.city.name_ua);
    }
  };

  const didAutofill = useRef(false);
  useEffect(() => {
    if (didAutofill.current) return;
    didAutofill.current = true;
    const last = loadLastProfile();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (last) applyProfile(last);
  }, []);

  const handleEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setF((s) => ({ ...s, email }));
    const saved = loadProfile(email);
    if (saved) applyProfile(saved);
  };

  const buildOrder = (): Record<string, unknown> => {
    return {
      offerId: ctx.offer.offerId,
      price: ctx.offer.price,
      startDate: toUnix(ctx.startDate),
      petType: ctx.petType,
      insurancePeriod: ctx.insurancePeriod,
      earnings: ctx.earnings,
      petAlias: f.petAlias.trim(),
      petBreed: f.petBreed.trim(),
      petSex: f.petSex,
      petBirthDate: toUnix(f.petBirthDate),
      vetPassportSerial: null,
      vetPassportNumber: f.vetPassportNumber.trim() || null,
      vetPassportDate: toUnix(f.vetPassportDate),
      vetPassportIssuedBy: f.vetPassportIssuedBy.trim() || null,
      microchipCode: f.microchipCode.trim(),   // обов'язкове
      microchipDate: null,
      personType: "natural",
      countryId: null,
      info: {
        name_ua: f.nameUa.trim(), surname_ua: f.surnameUa.trim(), patronymic_ua: f.patronymicUa.trim(),
        name_ua_lat: f.nameLat.trim(), surname_ua_lat: f.surnameLat.trim(),
        companyName: null, edrpou: null,
        dateBirth: toUnix(f.dateBirth),
        phone: `+380${f.phone.replace(/\D/g, "")}`,
        mail: f.email.trim(),
        city: { id: selectedCity?.id ?? null, name: selectedCity?.name_ua ?? "" },
        street: f.street.trim(), house: f.house.trim(), apartment: f.apartment.trim() || null,
        identificationCode: f.identificationCode || null,
        withoutIdentificationCode: f.identificationCode ? false : true,
        documentation: {
          type: f.docType, serial: f.docSerial.trim(), number: f.docNumber,
          dateOfIssue: toUnix(f.docDate), endDateOfIssue: null, unzr: null, issuedBy: f.docIssuedBy,
        },
      },
      offerInfo: { offerId: ctx.offer.offerId, price: String(ctx.offer.price), tariffExternalId: null },
      usedPaymentSystem: false,
      isSendPhoneMessage: false,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!f.petAlias.trim()) { setError("Вкажіть кличку тварини"); return; }
    if (!parseUaDate(f.petBirthDate)) { setError("Вкажіть дату народження тварини"); return; }
    if (!f.microchipCode.trim()) { setError("Вкажіть номер мікрочіпа"); return; }
    if (!f.docSerial.trim()) { setError("Вкажіть серію / запис документа"); return; }
    if (!parseUaDate(f.dateBirth)) { setError("Вкажіть дату народження власника"); return; }
    if (!selectedCity) { setError("Оберіть місто зі списку"); return; }
    if (!parseUaDate(f.docDate)) { setError("Вкажіть дату видачі документа"); return; }
    setLoading(true);
    setError(null);
    // Зберігаємо профіль власника на пристрої — для автозаповнення наступного разу.
    saveProfile({
      surname: f.surnameUa, name: f.nameUa, patronymic: f.patronymicUa,
      phone: f.phone, email: f.email,
      identificationCode: f.identificationCode,
      dateBirth: f.dateBirth,
      street: f.street, house: f.house,
      docType: f.docType,
      docSerial: f.docSerial, docNumber: f.docNumber, docIssuedBy: f.docIssuedBy, docDate: f.docDate,
      city: selectedCity, cityQuery,
    });
    try {
      const order = buildOrder();
      setSavedOrder(order);
      const idem = crypto.randomUUID();
      const res = await fetch("/api/pets/order", {
        method: "POST",
        headers: { "content-type": "application/json", "idempotency-key": idem },
        body: JSON.stringify({ action: "declare", order }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Помилка заявлення поліса");
      const id = json.data?.id;
      setOrderId(id);
      await fetch("/api/insurance/otp", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "send", orderId: id }),
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
      trackEvent("begin_checkout", { product: "pets", currency: "UAH", value: ctx.offer.price });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500";

  return (
    <div className="rounded-2xl bg-white p-5 text-left shadow-2xl sm:p-7">
      <div className="mb-5 flex items-center gap-3">
        <button type="button" onClick={onBack} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 hover:text-zinc-900">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-lg font-bold leading-tight text-zinc-900">Оформлення страхування тварини</h2>
          <p className="text-sm text-zinc-500"><span className="font-semibold text-zinc-900">{formatPrice(ctx.offer.price)}</span></p>
        </div>
      </div>

      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Тварина */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">Улюбленець</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Кличка" value={f.petAlias} onChange={set("petAlias")} placeholder="Барсик" required />
            <Input label="Порода" value={f.petBreed} onChange={set("petBreed")} placeholder="напр. Британська" />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-500">Стать</label>
              <div className="grid grid-cols-2 gap-2">
                {([{ v: "male", l: "Хлопчик" }, { v: "female", l: "Дівчинка" }] as const).map((o) => (
                  <button key={o.v} type="button" onClick={() => setF((s) => ({ ...s, petSex: o.v }))}
                    className={`h-11 rounded-xl border text-sm font-medium transition-colors ${f.petSex === o.v ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200" : "border-zinc-200 bg-white text-zinc-600 hover:border-indigo-200"}`}>{o.l}</button>
                ))}
              </div>
            </div>
            <DateInput label="Дата народження тварини" value={f.petBirthDate} onChange={(v) => setF((s) => ({ ...s, petBirthDate: v }))} defaultYear={2020} required />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Ветпаспорт — номер" value={f.vetPassportNumber} onChange={set("vetPassportNumber")} placeholder="UA-1234567" />
            <Input label="Ким виданий" value={f.vetPassportIssuedBy} onChange={set("vetPassportIssuedBy")} placeholder="Ветклініка" />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DateInput label="Дата видачі ветпаспорта" value={f.vetPassportDate} onChange={(v) => setF((s) => ({ ...s, vetPassportDate: v }))} defaultYear={2021} />
            <Input label="Номер мікрочіпа" value={f.microchipCode} onChange={set("microchipCode")} placeholder="15 цифр" required />
          </div>
        </div>

        {/* Власник */}
        <div className="border-t border-zinc-100 pt-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">Власник</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input label="Прізвище" value={f.surnameUa} onChange={set("surnameUa")} required />
            <Input label="Ім'я" value={f.nameUa} onChange={set("nameUa")} required />
            <Input label="По-батькові" value={f.patronymicUa} onChange={set("patronymicUa")} />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Прізвище (латиницею)" value={f.surnameLat} onChange={set("surnameLat")} placeholder="Ivanenko" required />
            <Input label="Ім'я (латиницею)" value={f.nameLat} onChange={set("nameLat")} placeholder="Ivan" required />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DateInput label="Дата народження" value={f.dateBirth} onChange={(v) => setF((s) => ({ ...s, dateBirth: v }))} defaultYear={1990} required />
            <Input label="ІПН" value={f.identificationCode} onChange={set("identificationCode")} placeholder="1234567890" />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-500">Телефон</label>
              <div className="flex items-center rounded-xl border border-zinc-200 bg-white focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
                <span className="pl-4 pr-1 text-sm text-zinc-500">+380</span>
                <input type="tel" inputMode="numeric" placeholder="67 123 45 67" value={formatUaPhone(f.phone)}
                  onChange={(e) => setF((s) => ({ ...s, phone: e.target.value.replace(/\D/g, "").slice(0, 9) }))}
                  required className="h-11 w-full rounded-r-xl bg-transparent px-2 text-sm text-zinc-900 outline-none" />
              </div>
            </div>
            <Input label="Email" type="email" value={f.email} onChange={handleEmail} placeholder="email@example.com" required />
          </div>
        </div>

        {/* Документ */}
        <div className="border-t border-zinc-100 pt-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">Документ власника</p>
          <div className="mb-4 grid grid-cols-2 gap-2 sm:max-w-sm">
            {DOC_TYPES.map(({ t, label }) => (
              <button key={t} type="button" onClick={() => setF((s) => ({ ...s, docType: t }))}
                className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${f.docType === t ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200" : "border-zinc-200 bg-white text-zinc-600 hover:border-indigo-200"}`}>{label}</button>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label={f.docType === 3 ? "Запис № (УНЗР)" : "Серія"} value={f.docSerial} onChange={set("docSerial")} required />
            <Input label="Номер документа" value={f.docNumber} onChange={set("docNumber")} required />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Ким видано" value={f.docIssuedBy} onChange={set("docIssuedBy")} required />
            <DateInput label="Дата видачі" value={f.docDate} onChange={(v) => setF((s) => ({ ...s, docDate: v }))} required />
          </div>
        </div>

        {/* Адреса */}
        <div className="border-t border-zinc-100 pt-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">Адреса</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="relative sm:col-span-2" ref={cityRef}>
              <label className="mb-1.5 block text-xs font-medium text-zinc-500">Місто</label>
              <input type="text" value={cityQuery} placeholder="Почніть вводити місто…" required spellCheck={false}
                onChange={(e) => { setCityQuery(e.target.value); setSelectedCity(null); }} className={inputCls} />
              {selectedCity && <p className="mt-1 text-xs font-medium text-emerald-600">{selectedCity.name_full_name_ua || selectedCity.name_ua}</p>}
              {cityResults.length > 0 && !selectedCity && cityQuery.length >= 2 && (
                <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
                  {cityResults.map((ci) => (
                    <button key={ci.id} type="button" onClick={() => { setSelectedCity(ci); setCityQuery(ci.name_full_name_ua || ci.name_ua); setCityResults([]); }}
                      className="w-full px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50">{ci.name_full_name_ua || ci.name_ua}</button>
                  ))}
                </div>
              )}
            </div>
            <Input label="Вулиця" value={f.street} onChange={set("street")} required />
            <Input label="Будинок / кв." value={f.house} onChange={set("house")} required />
          </div>
        </div>

        <div className="flex justify-end border-t border-zinc-100 pt-4">
          <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full sm:w-auto sm:px-8">
            Продовжити до оплати
          </Button>
        </div>
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

      {orderId && savedOrder && (
        <PaymentModal
          open={step === "payment"}
          onClose={() => setStep("form")}
          orderId={orderId}
          amount={ctx.offer.price}
          confirmEndpoint="/api/pets/order"
          onPaid={(cId) => {
            trackEvent("purchase", { product: "pets", currency: "UAH", value: ctx.offer.price, transaction_id: cId });
            setContractId(cId);
            setStep("success");
          }}
        />
      )}

      {contractId && (
        <SuccessModal open={step === "success"} onClose={onBack} contractId={contractId} downloadEndpoint="/api/pets/order" />
      )}
    </div>
  );
}
