"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DateInput, parseUaDate } from "@/components/ui/DateInput";
import { OtpModal } from "@/components/insurance/OtpModal";
import { PaymentModal } from "@/components/insurance/PaymentModal";
import { SuccessModal } from "@/components/insurance/SuccessModal";
import type { HomeOffer } from "@/types/api";
import { trackEvent, trackCheckoutStarted } from "@/lib/analytics";
import { saveProfile, loadProfile, loadLastProfile, fetchServerProfile, docFieldsByKind, type CustomerProfile, type DocFields, type DocKind } from "@/lib/customer-profile";
import { useSession } from "next-auth/react";
import { cityShort, cityLong } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

// Оформлення страхування житла: страхувальник (паспорт/ID, ІПН) + адреса обʼєкта →
// order/create → OTP (спільний) → оплата → contract/confirm → contract/take (PDF).

// Довідник міст ЖИТЛА (окремий) повертає {id, name, name_full_name_ua}.
interface HomeCity { id: number; name: string; name_full_name_ua?: string }

export interface HousingContext {
  offer: HomeOffer;
  homeType: "flat" | "house";
  insuranceAmount: number;
  insurancePeriod: string;
  startDate: string;        // "ДД.ММ.РРРР"
}

// Типи документів для житла: 1 паспорт, 3 ID-картка, 4 закордонний паспорт.
type DocCode = 1 | 3 | 4;
const DOC_CATALOG: { key: string; t: DocCode; kind: DocKind; label: string; labelEn: string; serialLabel: string; serialLabelEn: string }[] = [
  { key: "DOCUMENT_ID_CARD",           t: 3, kind: "idcard",  label: "ID-картка",           labelEn: "ID card",                serialLabel: "Запис № (УНЗР)", serialLabelEn: "Record No. (UNZR)" },
  { key: "DOCUMENT_PASSPORT",          t: 1, kind: "passport", label: "Паспорт (книжечка)",  labelEn: "Passport (booklet)",     serialLabel: "Серія",          serialLabelEn: "Series" },
  { key: "DOCUMENT_EXTERNAL_PASSPORT", t: 4, kind: "foreign", label: "Закордонний паспорт", labelEn: "International passport", serialLabel: "Серія",          serialLabelEn: "Series" },
];
const kindOfDoc = (t: DocCode): DocKind => DOC_CATALOG.find((d) => d.t === t)?.kind ?? "idcard";
const DOC_FALLBACK = DOC_CATALOG.filter((d) => d.t === 3 || d.t === 1);
function allowedDocsFor(available?: string[]) {
  if (!available || available.length === 0) return DOC_FALLBACK;
  const hit = DOC_CATALOG.filter((d) => available.includes(d.key));
  return hit.length ? hit : DOC_FALLBACK;
}

// ІНГО приймає замовлення лише з датою старту не раніше ніж через 9 календарних днів.
function isIngo(name?: string): boolean {
  return /інго|ingo/i.test(name ?? "");
}
function daysUntil(ua: string): number | null {
  const d = parseUaDate(ua);
  if (!d) return null;
  const today = new Date();
  const a = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const b = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((a - b) / 86400000);
}

function formatUaPhone(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 9);
  return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(" ");
}

// "ДД.ММ.РРРР" → Unix seconds (UTC) для дат у payload житла.
function toUnix(ua: string): number | null {
  const d = parseUaDate(ua);
  if (!d) return null;
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 1000);
}
// "ДД.ММ.РРРР" → "ДД-ММ-РРРР"
function toDMY(ua: string): string {
  const d = parseUaDate(ua);
  if (!d) return "";
  return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
}
function plusPeriodUa(ua: string, period: string): string {
  const d = parseUaDate(ua);
  if (!d) return "";
  const months = parseInt(period, 10) || 12;
  const e = new Date(d.getFullYear(), d.getMonth() + months, d.getDate() - 1);
  return `${String(e.getDate()).padStart(2, "0")}.${String(e.getMonth() + 1).padStart(2, "0")}.${e.getFullYear()}`;
}

const inputCls =
  "h-11 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500";

export function HousingCheckout({ ctx, onBack }: { ctx: HousingContext; onBack: () => void }) {
  const { t } = useI18n();
  const [step, setStep] = useState<"form" | "otp" | "payment" | "success">("form");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [contractId, setContractId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allowedDocs = allowedDocsFor(ctx.offer.available_documents);
  const isAllowedDoc = (t: number): t is DocCode => allowedDocs.some((d) => d.t === t);

  const [f, setF] = useState({
    surnameUa: "", nameUa: "", patronymicUa: "",
    dateBirth: "", identificationCode: "",
    phone: "", email: "",
    docType: allowedDocs[0].t as DocCode, docSerial: "", docNumber: "", docIssuedBy: "", docDate: "",
    street: "", house: "", apartment: "",
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

  // Місто обʼєкта (довідник ЖИТЛА).
  const [cityQuery, setCityQuery] = useState("");
  const [cityResults, setCityResults] = useState<HomeCity[]>([]);
  const [cityLoading, setCityLoading] = useState(false);
  const [selectedCity, setSelectedCity] = useState<HomeCity | null>(null);
  const cityRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!cityQuery || cityQuery.length < 2 || selectedCity) return;
    let active = true;
    const t = setTimeout(async () => {
      setCityLoading(true);
      try {
        const res = await fetch(`/api/home/cities?q=${encodeURIComponent(cityQuery)}`);
        const json = await res.json();
        if (active && json.success) setCityResults(json.data);
      } finally {
        if (active) setCityLoading(false);
      }
    }, 200);
    return () => { active = false; clearTimeout(t); };
  }, [cityQuery, selectedCity]);

  // Документ памʼятається по типах (як у ЗК).
  const docStash = useRef<Record<number, { serial: string; number: string; issuedBy: string; date: string }>>({});
  const changeDocType = (t: DocCode) => setF((s) => {
    if (s.docType === t) return s;
    docStash.current[s.docType] = { serial: s.docSerial, number: s.docNumber, issuedBy: s.docIssuedBy, date: s.docDate };
    const saved = docStash.current[t];
    return { ...s, docType: t, docSerial: saved?.serial ?? "", docNumber: saved?.number ?? "", docIssuedBy: saved?.issuedBy ?? "", docDate: saved?.date ?? "" };
  });

  // Автопідстановка профілю (місто НЕ підставляємо як обʼєкт — інший довідник; лише текст).
  const applyProfile = (p: CustomerProfile) => {
    // Памʼять документів — з КАНОНІЧНИХ сутностей (код 4 у житлі = закордонний, а не
    // водійське як в ОСЦПВ; ключ-сутність унеможливлює плутанину між продуктами).
    const stash: Record<number, DocFields> = {};
    for (const d of DOC_CATALOG) { const fx = docFieldsByKind(p, d.kind); if (fx) stash[d.t] = fx; }
    docStash.current = stash;
    const wantT = DOC_CATALOG.find((d) => d.kind === p.lastDocKind)?.t;
    const dt: DocCode = wantT && isAllowedDoc(wantT) ? wantT : allowedDocs[0].t;
    const active = stash[dt];
    setF((s) => ({
      ...s,
      surnameUa: p.surname, nameUa: p.name, patronymicUa: p.patronymic,
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
    // Місто: підставляємо текст і одразу шукаємо збіг у довіднику ЖИТЛА, щоб проставити
    // selectedCity (інакше валідація «Оберіть місто зі списку» падає при заповненому полі).
    const cityText = p.cityQuery || p.city?.name_full_name_ua || p.city?.name_ua;
    if (cityText) {
      const short = cityShort(cityText);
      setCityQuery(short);
      void resolveHomeCity(short);
    }
  };

  // Знаходить місто в довіднику житла за назвою й авто-обирає збіг. Зіставлення стійке
  // до префікса населеного пункту («м.»/«с.»/«смт»), бо профіль може зберегти «Київ»,
  // а довідник повертає «м. Київ» — інакше точний збіг падав і місто не обиралось.
  const normCity = (s: string) => cityShort(s).toLowerCase().replace(/^(м\.?|с\.?|смт\.?|селище|місто)\s+/i, "").trim();
  const resolveHomeCity = async (name: string) => {
    const core = name.replace(/^(м\.?|с\.?|смт\.?|селище|місто)\s+/i, "").trim();
    try {
      const res = await fetch(`/api/home/cities?q=${encodeURIComponent(core || name)}`);
      const json = await res.json();
      if (!json.success) return;
      const list = (json.data ?? []) as HomeCity[];
      const key = normCity(name);
      // Серед збігів (за нормалізованою назвою) віддаємо перевагу МІСТУ («м.») над
      // селом/смт — коли однойменні населені пункти («Бережани» — і село, і місто).
      const hits = list.filter((c) => normCity(c.name_full_name_ua || c.name) === key || normCity(c.name) === key);
      const match =
        hits.find((c) => /^м[.\s]/i.test((c.name || c.name_full_name_ua || "").trim())) ??
        hits[0] ??
        (list.length === 1 ? list[0] : null);
      if (match) {
        setSelectedCity(match);
        setCityQuery(cityShort(match.name_full_name_ua || match.name));
        setCityResults([]);
      }
    } catch { /* ignore */ }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus]);

  const handleEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setF((s) => ({ ...s, email }));
    if (authStatus === "authenticated") {
      const saved = loadProfile(email);
      if (saved) applyProfile(saved);
    }
  };

  const buildPayload = () => {
    const cityName = selectedCity?.name || "";
    const cityObj = { id: selectedCity?.id ?? 0, name: cityName };
    const exId = ctx.offer.company?.ex_id ?? "";
    const tariffId = `${exId}-${ctx.homeType}-${ctx.insuranceAmount}`;
    // earnings у замовленні МАЄ збігатися з тим, що використав калькулятор (offer.earnings_param),
    // інакше страховик відхиляє заявку. Хардкод 15 ламав ІНГО (на dev доступний лише тариф 30).
    const earnings = ctx.offer.earnings_param ?? 15;
    return {
      params: { statusId: null, type: null },
      orderId: null,
      price: ctx.offer.price,                          // ОБОВʼЯЗКОВЕ топ-рівневе поле (getPrice) — має збігатися з offerInfo.price
      homeType: ctx.homeType,
      insuranceAmount: ctx.insuranceAmount,
      insurancePeriod: ctx.insurancePeriod,
      earnings,
      startDate: toDMY(ctx.startDate),                 // DD-MM-YYYY
      countryId: null,
      info: {
        name_ua: f.nameUa, surname_ua: f.surnameUa, patronymic_ua: f.patronymicUa,
        dateBirth: toUnix(f.dateBirth),                // unix
        phone: `+380${f.phone.replace(/\D/g, "")}`,
        mail: f.email,
        city: cityObj,
        street: f.street, house: f.house, apartment: f.apartment,
        identificationCode: f.identificationCode,
        withoutIdentificationCode: !f.identificationCode,
        documentation: {
          type: f.docType, serial: f.docSerial, number: f.docNumber,
          dateOfIssue: toUnix(f.docDate), endDateOfIssue: null, issuedBy: f.docIssuedBy,
        },
      },
      houseInfo: { city: cityObj, street: f.street, house: f.house, apartment: f.apartment },
      offerInfo: {
        offerId: ctx.offer.offerId, moduleId: ctx.offer.moduleId, companyId: ctx.offer.companyId,
        price: ctx.offer.price, ex_id: exId, ex_tariff_id: tariffId, externalIdTariff: tariffId,
      },
      usedPaymentSystem: false,
      isSendPhoneMessage: false,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!f.surnameUa || !f.nameUa || !f.patronymicUa) { setError(t({ uk: "Заповніть ПІБ", en: "Fill in your full name" })); return; }
    if (!parseUaDate(f.dateBirth)) { setError(t({ uk: "Вкажіть коректну дату народження", en: "Enter a valid date of birth" })); return; }
    if (f.phone.replace(/\D/g, "").length < 9) { setError(t({ uk: "Вкажіть номер телефону", en: "Enter your phone number" })); return; }
    if (!f.email) { setError(t({ uk: "Вкажіть email", en: "Enter your email" })); return; }
    if (!f.docSerial || !f.docNumber || !f.docIssuedBy || !parseUaDate(f.docDate)) { setError(t({ uk: "Заповніть дані документа", en: "Fill in the document details" })); return; }
    if (!selectedCity) { setError(t({ uk: "Оберіть місто зі списку", en: "Select a city from the list" })); return; }
    if (!f.street || !f.house) { setError(t({ uk: "Вкажіть адресу обʼєкта", en: "Enter the object's address" })); return; }
    // ІНГО: дата старту має бути з комфортним запасом (~2 тижні) — ранні дати страховик
    // відхиляє, а в зоні +9…+11 його модуль нестабільний. Backstop до мін. дати в календарі.
    if (isIngo(ctx.offer.companyNamePublic || ctx.offer.companyName)) {
      const d = daysUntil(ctx.startDate);
      if (d !== null && d < 14) {
        setError(t({ uk: "Ця страхова оформлює поліс житла з датою початку приблизно за 2 тижні. Поверніться назад і оберіть пізнішу дату.", en: "This insurer issues a property policy with a start date about 2 weeks out. Go back and choose a later date." }));
        return;
      }
    }
    setLoading(true);
    setError(null);
    // Зберігаємо профіль (без міста — інший довідник).
    saveProfile({
      surname: f.surnameUa, name: f.nameUa, patronymic: f.patronymicUa,
      phone: f.phone, email: f.email,
      identificationCode: f.identificationCode, dateBirth: f.dateBirth,
      street: f.street, house: f.house,
      docType: f.docType, docKind: kindOfDoc(f.docType), docSerial: f.docSerial, docNumber: f.docNumber, docIssuedBy: f.docIssuedBy, docDate: f.docDate,
    });
    try {
      const idem = crypto.randomUUID();
      const res = await fetch("/api/home/order", {
        method: "POST",
        headers: { "content-type": "application/json", "idempotency-key": idem },
        body: JSON.stringify({ action: "declare", ...buildPayload() }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? t({ uk: "Помилка заявлення поліса", en: "Error declaring the policy" }));
      const id = json.data?.id as string;
      setOrderId(id);
      // Спільний OTP (як в ОСЦПВ/ЗК).
      await fetch("/api/insurance/otp", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "send", orderId: id }),
      });
      // Лід: клієнт заповнив дані й перейшов до підтвердження (навіть якщо не завершить).
      trackCheckoutStarted({
        product: "Житло",
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
      trackEvent("begin_checkout", { product: "housing", currency: "UAH", value: ctx.offer.price });
    } catch (err) {
      setError(err instanceof Error ? err.message : t({ uk: "Помилка", en: "Error" }));
    } finally {
      setLoading(false);
    }
  };

  const savePolicyRecord = async (cId: string) => {
    try {
      await fetch("/api/policies", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: cId || orderId,
          email: f.email,
          phone: `+380${f.phone.replace(/\D/g, "")}`,
          customerName: [f.surnameUa, f.nameUa, f.patronymicUa].filter(Boolean).join(" "),
          customer: buildPayload().info,
          orderId,
          company: ctx.offer.companyNamePublic || ctx.offer.companyName,
          vehicle: {},
          price: ctx.offer.price,
          startDate: ctx.startDate,
          endDate: plusPeriodUa(ctx.startDate, ctx.insurancePeriod),
          product: "Житло",
        }),
      });
    } catch { /* не має ламати UX */ }
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-zinc-900 p-5 text-left shadow-2xl sm:p-7">
      <div className="mb-5 flex items-center gap-3">
        <button type="button" aria-label={t({ uk: "Назад", en: "Back" })} onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{t({ uk: "Оформлення страхування житла", en: "Property insurance checkout" })}</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{ctx.offer.price} {t({ uk: "грн", en: "UAH" })}</span>
          </p>
        </div>
      </div>

      {error && <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600 border border-red-200">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Страхувальник */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{t({ uk: "Страхувальник", en: "Policyholder" })}</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input label={t({ uk: "Прізвище", en: "Surname" })} value={f.surnameUa} onChange={set("surnameUa")} required />
            <Input label={t({ uk: "Ім'я", en: "First name" })} value={f.nameUa} onChange={set("nameUa")} required />
            <Input label={t({ uk: "По-батькові", en: "Patronymic" })} value={f.patronymicUa} onChange={set("patronymicUa")} required />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DateInput label={t({ uk: "Дата народження", en: "Date of birth" })} value={f.dateBirth} onChange={(v) => setF((s) => ({ ...s, dateBirth: v }))} defaultYear={1990} required />
            <Input label={t({ uk: "ІПН", en: "Tax ID" })} value={f.identificationCode} onChange={set("identificationCode")} placeholder="1234567890" />
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
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{t({ uk: "Документ, що посвідчує особу", en: "Identity document" })}</p>
          <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {allowedDocs.map((d) => (
              <button key={d.t} type="button" onClick={() => changeDocType(d.t)}
                className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                  f.docType === d.t ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-200 dark:ring-indigo-900" : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-indigo-200"
                }`}>{t({ uk: d.label, en: d.labelEn })}</button>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label={(() => { const d = DOC_CATALOG.find((d) => d.t === f.docType); return d ? t({ uk: d.serialLabel, en: d.serialLabelEn }) : t({ uk: "Серія", en: "Series" }); })()} value={f.docSerial} onChange={set("docSerial")} required />
            <Input label={t({ uk: "Номер документа", en: "Document number" })} value={f.docNumber} onChange={set("docNumber")} required />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label={t({ uk: "Ким видано", en: "Issued by" })} value={f.docIssuedBy} onChange={set("docIssuedBy")} required />
            <DateInput label={t({ uk: "Дата видачі", en: "Issue date" })} value={f.docDate} onChange={(v) => setF((s) => ({ ...s, docDate: v }))} required />
          </div>
        </div>

        {/* Адреса обʼєкта */}
        <div className="border-t border-zinc-100 dark:border-zinc-800 pt-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{t({ uk: "Адреса обʼєкта", en: "Object address" })}</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="relative sm:col-span-2" ref={cityRef}>
              <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">{t({ uk: "Місто", en: "City" })}</label>
              <input type="text" aria-label={t({ uk: "Пошук міста", en: "City search" })} value={cityQuery} placeholder={t({ uk: "Почніть вводити місто…", en: "Start typing a city…" })} required spellCheck={false}
                onChange={(e) => { setCityQuery(e.target.value); setSelectedCity(null); }}
                className={`${inputCls}${selectedCity ? " border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/40" : ""}`} />
              {cityLoading && !selectedCity && cityQuery.length >= 2 && (
                <p className="mt-1 text-xs text-indigo-500">{t({ uk: "Пошук…", en: "Searching…" })}</p>
              )}
              {cityResults.length > 0 && !selectedCity && cityQuery.length >= 2 && (
                <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg">
                  {cityResults.map((c) => (
                    <button key={c.id} type="button" onClick={() => { setSelectedCity(c); setCityQuery(cityShort(c.name_full_name_ua || c.name)); setCityResults([]); }}
                      className="w-full px-4 py-2 text-left text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/60">{cityLong(c.name_full_name_ua || c.name)}</button>
                  ))}
                </div>
              )}
            </div>
            <Input label={t({ uk: "Вулиця", en: "Street" })} value={f.street} onChange={set("street")} required />
            <Input label={t({ uk: "Будинок / кв.", en: "Building / apt." })} value={f.house} onChange={set("house")} required />
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

      {orderId && (
        <PaymentModal
          open={step === "payment"}
          onClose={() => setStep("form")}
          orderId={orderId}
          amount={ctx.offer.price}
          confirmEndpoint="/api/home/order"
          onPaid={(cId) => {
            trackEvent("purchase", { product: "housing", currency: "UAH", value: ctx.offer.price, transaction_id: cId });
            setContractId(cId);
            void savePolicyRecord(cId);
            setStep("success");
          }}
        />
      )}

      {contractId && (
        <SuccessModal open={step === "success"} onClose={onBack} contractId={contractId} downloadEndpoint="/api/home/order" />
      )}
    </div>
  );
}
