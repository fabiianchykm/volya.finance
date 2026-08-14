"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DateInput, parseUaDate } from "@/components/ui/DateInput";
import { OtpModal } from "@/components/insurance/OtpModal";
import { PaymentModal } from "@/components/insurance/PaymentModal";
import { SuccessModal } from "@/components/insurance/SuccessModal";
import { formatPrice, cityShort, cityLong } from "@/lib/utils";
import type { PetsOffer } from "@/types/api";
import { trackEvent, trackCheckoutStarted } from "@/lib/analytics";
import { saveProfile, loadProfile, loadLastProfile, fetchServerProfile, docFieldsByKind, type CustomerProfile, type DocFields } from "@/lib/customer-profile";
import { useSession } from "next-auth/react";
import { useI18n } from "@/lib/i18n";

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
  { t: 3 as const, label: "ID-карта", en: "ID card" },
  { t: 1 as const, label: "Паспорт (книжечка)", en: "Passport (booklet)" },
];

interface CityOption { id: number; name_ua: string; name_full_name_ua: string; zone: number }

function formatUaPhone(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 9);
  return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(" ");
}
const toUnix = (ua: string): number | null => { const d = parseUaDate(ua); return d ? Math.floor(d.getTime() / 1000) : null; };

export function PetsCheckout({ ctx, onBack }: { ctx: PetsCheckoutCtx; onBack: () => void }) {
  const { t } = useI18n();
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

  // Поля документа памʼятаються окремо по типу (див. коментар в інших чекаутах).
  const docStash = useRef<Record<number, { serial: string; number: string; issuedBy: string; date: string }>>({});
  const changeDocType = (t: 1 | 3) => setF((s) => {
    if (s.docType === t) return s;
    docStash.current[s.docType] = { serial: s.docSerial, number: s.docNumber, issuedBy: s.docIssuedBy, date: s.docDate };
    const saved = docStash.current[t];
    return { ...s, docType: t, docSerial: saved?.serial ?? "", docNumber: saved?.number ?? "", docIssuedBy: saved?.issuedBy ?? "", docDate: saved?.date ?? "" };
  });

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
    // Документ — з канонічних сутностей (тварини підтримують лише паспорт/ID-картку).
    const stash: Record<number, DocFields> = {};
    const pf = docFieldsByKind(p, "passport"); if (pf) stash[1] = pf;
    const idf = docFieldsByKind(p, "idcard"); if (idf) stash[3] = idf;
    docStash.current = stash;
    const dt: 1 | 3 = p.lastDocKind === "passport" ? 1 : 3;
    const active = stash[dt];
    setF((s) => ({
      ...s,
      surnameUa: p.surname, nameUa: p.name, patronymicUa: p.patronymic,
      surnameLat: p.surnameLat || s.surnameLat, nameLat: p.nameLat || s.nameLat,
      phone: p.phone, email: p.email,
      identificationCode: p.identificationCode,
      dateBirth: p.dateBirth,
      docType: dt,
      docSerial: active?.serial ?? "", docNumber: active?.number ?? "", docIssuedBy: active?.issuedBy ?? "", docDate: active?.date ?? "",
      street: p.street, house: p.house,
    }));
    if (p.city) {
      setSelectedCity(p.city);
      setCityQuery(cityShort(p.cityQuery || p.city.name_full_name_ua || p.city.name_ua));
    }
  };

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

  const handleEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setF((s) => ({ ...s, email }));
    if (authStatus === "authenticated") {
      const saved = loadProfile(email);
      if (saved) applyProfile(saved);
    }
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
    if (!f.petAlias.trim()) { setError(t({ uk: "Вкажіть кличку тварини", en: "Enter the pet's name" })); return; }
    if (!parseUaDate(f.petBirthDate)) { setError(t({ uk: "Вкажіть дату народження тварини", en: "Enter the pet's date of birth" })); return; }
    if (!f.microchipCode.trim()) { setError(t({ uk: "Вкажіть номер мікрочіпа", en: "Enter the microchip number" })); return; }
    if (!f.docSerial.trim()) { setError(t({ uk: "Вкажіть серію / запис документа", en: "Enter the document series / record" })); return; }
    if (!parseUaDate(f.dateBirth)) { setError(t({ uk: "Вкажіть дату народження власника", en: "Enter the owner's date of birth" })); return; }
    if (!selectedCity) { setError(t({ uk: "Оберіть місто зі списку", en: "Select a city from the list" })); return; }
    if (!parseUaDate(f.docDate)) { setError(t({ uk: "Вкажіть дату видачі документа", en: "Enter the document issue date" })); return; }
    setLoading(true);
    setError(null);
    // Зберігаємо профіль власника на пристрої — для автозаповнення наступного разу.
    saveProfile({
      surname: f.surnameUa, name: f.nameUa, patronymic: f.patronymicUa,
      surnameLat: f.surnameLat, nameLat: f.nameLat,
      phone: f.phone, email: f.email,
      identificationCode: f.identificationCode,
      dateBirth: f.dateBirth,
      street: f.street, house: f.house,
      docType: f.docType, docKind: f.docType === 1 ? "passport" : "idcard",
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
      if (!json.success) throw new Error(json.error ?? t({ uk: "Помилка заявлення поліса", en: "Policy declaration error" }));
      const id = json.data?.id;
      setOrderId(id);
      await fetch("/api/insurance/otp", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "send", orderId: id }),
      });
      trackCheckoutStarted({
        product: "Тварини",
        name: [f.surnameUa, f.nameUa, f.patronymicUa].filter(Boolean).join(" "),
        company: ctx.offer.companyNamePublic || ctx.offer.companyName,
        price: ctx.offer.price,
        phone: `+380${f.phone.replace(/\D/g, "")}`,
        email: f.email,
      });
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : t({ uk: "Помилка", en: "Error" }));
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
      if (!json.valid) throw new Error(t({ uk: "Невірний код. Спробуйте ще раз.", en: "Invalid code. Please try again." }));
      setStep("payment");
      trackEvent("begin_checkout", { product: "pets", currency: "UAH", value: ctx.offer.price });
    } catch (err) {
      setError(err instanceof Error ? err.message : t({ uk: "Помилка", en: "Error" }));
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "h-11 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500";

  return (
    <div className="rounded-2xl bg-white dark:bg-zinc-900 p-5 text-left shadow-2xl sm:p-7">
      <div className="mb-5 flex items-center gap-3">
        <button type="button" aria-label={t({ uk: "Назад", en: "Back" })} onClick={onBack} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-lg font-bold leading-tight text-zinc-900 dark:text-zinc-100">{t({ uk: "Оформлення страхування тварини", en: "Pet insurance checkout" })}</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400"><span className="font-semibold text-zinc-900 dark:text-zinc-100">{formatPrice(ctx.offer.price)}</span></p>
        </div>
      </div>

      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Тварина */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{t({ uk: "Улюбленець", en: "Pet" })}</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label={t({ uk: "Кличка", en: "Name" })} value={f.petAlias} onChange={set("petAlias")} placeholder={t({ uk: "Барсик", en: "Rex" })} required />
            <Input label={t({ uk: "Порода", en: "Breed" })} value={f.petBreed} onChange={set("petBreed")} placeholder={t({ uk: "напр. Британська", en: "e.g. British Shorthair" })} />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">{t({ uk: "Стать", en: "Sex" })}</label>
              <div className="grid grid-cols-2 gap-2">
                {([{ v: "male", l: "Хлопчик", en: "Male" }, { v: "female", l: "Дівчинка", en: "Female" }] as const).map((o) => (
                  <button key={o.v} type="button" onClick={() => setF((s) => ({ ...s, petSex: o.v }))}
                    className={`h-11 rounded-xl border text-sm font-medium transition-colors ${f.petSex === o.v ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-200 dark:ring-indigo-900" : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-indigo-200"}`}>{t({ uk: o.l, en: o.en })}</button>
                ))}
              </div>
            </div>
            <DateInput label={t({ uk: "Дата народження тварини", en: "Pet's date of birth" })} value={f.petBirthDate} onChange={(v) => setF((s) => ({ ...s, petBirthDate: v }))} defaultYear={2020} required />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label={t({ uk: "Ветпаспорт — номер", en: "Vet passport — number" })} value={f.vetPassportNumber} onChange={set("vetPassportNumber")} placeholder="UA-1234567" />
            <Input label={t({ uk: "Ким виданий", en: "Issued by" })} value={f.vetPassportIssuedBy} onChange={set("vetPassportIssuedBy")} placeholder={t({ uk: "Ветклініка", en: "Vet clinic" })} />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DateInput label={t({ uk: "Дата видачі ветпаспорта", en: "Vet passport issue date" })} value={f.vetPassportDate} onChange={(v) => setF((s) => ({ ...s, vetPassportDate: v }))} defaultYear={2021} />
            <Input label={t({ uk: "Номер мікрочіпа", en: "Microchip number" })} value={f.microchipCode} onChange={set("microchipCode")} placeholder={t({ uk: "15 цифр", en: "15 digits" })} required />
          </div>
        </div>

        {/* Власник */}
        <div className="border-t border-zinc-100 dark:border-zinc-800 pt-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{t({ uk: "Власник", en: "Owner" })}</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input label={t({ uk: "Прізвище", en: "Surname" })} value={f.surnameUa} onChange={set("surnameUa")} required />
            <Input label={t({ uk: "Ім'я", en: "First name" })} value={f.nameUa} onChange={set("nameUa")} required />
            <Input label={t({ uk: "По-батькові", en: "Patronymic" })} value={f.patronymicUa} onChange={set("patronymicUa")} />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label={t({ uk: "Прізвище (латиницею)", en: "Surname (Latin)" })} value={f.surnameLat} onChange={set("surnameLat")} placeholder="Ivanenko" required />
            <Input label={t({ uk: "Ім'я (латиницею)", en: "First name (Latin)" })} value={f.nameLat} onChange={set("nameLat")} placeholder="Ivan" required />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DateInput label={t({ uk: "Дата народження", en: "Date of birth" })} value={f.dateBirth} onChange={(v) => setF((s) => ({ ...s, dateBirth: v }))} defaultYear={1990} required />
            <Input label={t({ uk: "ІПН", en: "Tax ID (INN)" })} value={f.identificationCode} onChange={set("identificationCode")} placeholder="1234567890" />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{t({ uk: "Телефон", en: "Phone" })}</label>
              <div className="flex items-center rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
                <span className="pl-4 pr-1 text-sm text-zinc-500 dark:text-zinc-400">+380</span>
                <input type="tel" inputMode="numeric" aria-label={t({ uk: "Номер телефону", en: "Phone number" })} placeholder="67 123 45 67" value={formatUaPhone(f.phone)}
                  onChange={(e) => setF((s) => ({ ...s, phone: e.target.value.replace(/\D/g, "").slice(0, 9) }))}
                  required className="h-11 w-full rounded-r-xl bg-transparent px-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none" />
              </div>
            </div>
            <Input label="Email" type="email" value={f.email} onChange={handleEmail} placeholder="email@example.com" required />
          </div>
        </div>

        {/* Документ */}
        <div className="border-t border-zinc-100 dark:border-zinc-800 pt-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{t({ uk: "Документ власника", en: "Owner document" })}</p>
          <div className="mb-4 grid grid-cols-2 gap-2 sm:max-w-sm">
            {DOC_TYPES.map(({ t: dt, label, en }) => (
              <button key={dt} type="button" onClick={() => changeDocType(dt)}
                className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${f.docType === dt ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-200 dark:ring-indigo-900" : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-indigo-200"}`}>{t({ uk: label, en })}</button>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label={f.docType === 3 ? t({ uk: "Запис № (УНЗР)", en: "Record No. (UNZR)" }) : t({ uk: "Серія", en: "Series" })} value={f.docSerial} onChange={set("docSerial")} required />
            <Input label={t({ uk: "Номер документа", en: "Document number" })} value={f.docNumber} onChange={set("docNumber")} required />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label={t({ uk: "Ким видано", en: "Issued by" })} value={f.docIssuedBy} onChange={set("docIssuedBy")} required />
            <DateInput label={t({ uk: "Дата видачі", en: "Issue date" })} value={f.docDate} onChange={(v) => setF((s) => ({ ...s, docDate: v }))} required />
          </div>
        </div>

        {/* Адреса */}
        <div className="border-t border-zinc-100 dark:border-zinc-800 pt-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{t({ uk: "Адреса", en: "Address" })}</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="relative sm:col-span-2" ref={cityRef}>
              <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">{t({ uk: "Місто", en: "City" })}</label>
              <input type="text" aria-label={t({ uk: "Пошук міста", en: "City search" })} value={cityQuery} placeholder={t({ uk: "Почніть вводити місто…", en: "Start typing a city…" })} required spellCheck={false}
                onChange={(e) => { setCityQuery(e.target.value); setSelectedCity(null); }}
                className={`${inputCls}${selectedCity ? " border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/40" : ""}`} />
              {cityResults.length > 0 && !selectedCity && cityQuery.length >= 2 && (
                <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg">
                  {cityResults.map((ci) => (
                    <button key={ci.id} type="button" onClick={() => { setSelectedCity(ci); setCityQuery(cityShort(ci.name_full_name_ua || ci.name_ua)); setCityResults([]); }}
                      className="w-full px-4 py-2 text-left text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/60">{cityLong(ci.name_full_name_ua || ci.name_ua)}</button>
                  ))}
                </div>
              )}
            </div>
            <Input label={t({ uk: "Вулиця", en: "Street" })} value={f.street} onChange={set("street")} required />
            <Input label={t({ uk: "Будинок / кв.", en: "House / apt." })} value={f.house} onChange={set("house")} required />
          </div>
        </div>

        <div className="flex justify-end border-t border-zinc-100 dark:border-zinc-800 pt-4">
          <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full sm:w-auto sm:px-8">
            {t({ uk: "Продовжити до оплати", en: "Continue to payment" })}
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
