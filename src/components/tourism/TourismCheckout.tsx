"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DateInput, parseUaDate } from "@/components/ui/DateInput";
import { OtpModal } from "@/components/insurance/OtpModal";
import { PaymentModal } from "@/components/insurance/PaymentModal";
import { SuccessModal } from "@/components/insurance/SuccessModal";
import { companyLogo } from "@/lib/logos";
import { formatPrice, formatCompanyName } from "@/lib/utils";
import type { TourismOffer } from "@/types/api";
import { trackEvent } from "@/lib/analytics";
import { saveProfile, loadProfile, loadLastProfile, type CustomerProfile } from "@/lib/customer-profile";

// Анкета оформлення туристичного (аналог ЗК): дані страхувальника + туристів →
// declare (order/create save) → OTP → оплата → confirm (nextFinal) → поліс.
// Повний payload передається у PaymentModal (confirmPayload) для кроку nextFinal.

export interface TourismCheckoutCtx {
  offer: TourismOffer;      // сира пропозиція з калькулятора (містить усі поля)
  countryId: number;
  countryName: string;
  startDate: string;        // ДД.ММ.РРРР
  endDate: string;          // ДД.ММ.РРРР
  days: number;
  multiVisa: boolean;
  birthDates: string[];     // ДД.ММ.РРРР по туристу (з калькулятора)
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
const toISO = (ua: string): string => { const d = parseUaDate(ua); if (!d) return ""; const p = (n: number) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };

interface TouristForm {
  surnameLat: string; nameLat: string; dateBirth: string; identificationCode: string;
  passportSerial: string; passportNumber: string; passportDate: string; passportEndDate: string; passportIssuedBy: string;
}
const emptyTourist = (dob = ""): TouristForm => ({
  surnameLat: "", nameLat: "", dateBirth: dob, identificationCode: "",
  passportSerial: "", passportNumber: "", passportDate: "", passportEndDate: "", passportIssuedBy: "",
});

export function TourismCheckout({ ctx, onBack }: { ctx: TourismCheckoutCtx; onBack: () => void }) {
  const [step, setStep] = useState<"form" | "otp" | "payment" | "success">("form");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [contractId, setContractId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Страхувальник (він же турист №1).
  const [c, setC] = useState({
    phone: "", email: "",
    docType: 3 as 1 | 3, docSerial: "", docNumber: "", docIssuedBy: "", docDate: "",
    street: "", house: "", apartment: "",
  });
  const setCf = (k: keyof typeof c) => (e: React.ChangeEvent<HTMLInputElement>) => setC((s) => ({ ...s, [k]: e.target.value }));

  // Туристи (перший — страхувальник). ДН попередньо заповнені з калькулятора.
  const [tourists, setTourists] = useState<TouristForm[]>(
    () => ctx.birthDates.map((b) => emptyTourist(b))
  );
  const setT = (i: number, k: keyof TouristForm, val: string) =>
    setTourists((arr) => arr.map((t, idx) => (idx === i ? { ...t, [k]: val } : t)));

  // Місто (автопідбір).
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

  // Автопідстановка збереженого профілю: контакт/документ/адреса/місто + латинські ПІБ
  // і закордонний паспорт туриста №1 (страхувальника). Зберігаємо частково (без укр. ПІБ),
  // тож спільний профіль не засмічується. docType звужуємо до 1|3.
  const applyProfile = (p: CustomerProfile) => {
    setC((s) => ({
      ...s,
      phone: p.phone, email: p.email,
      docType: p.docType === 1 ? 1 : 3,
      docSerial: p.docSerial, docNumber: p.docNumber, docIssuedBy: p.docIssuedBy, docDate: p.docDate,
      street: p.street, house: p.house,
    }));
    // Турист №1 (страхувальник) — латинські ПІБ і закордонний паспорт зі збереженого профілю.
    setTourists((arr) => arr.map((t, idx) => idx === 0 ? {
      ...t,
      surnameLat: p.surnameLat || t.surnameLat,
      nameLat: p.nameLat || t.nameLat,
      passportSerial: p.passportSerial || t.passportSerial,
      passportNumber: p.passportNumber || t.passportNumber,
      passportDate: p.passportDate || t.passportDate,
      passportEndDate: p.passportEndDate || t.passportEndDate,
      passportIssuedBy: p.passportIssuedBy || t.passportIssuedBy,
    } : t));
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
    setC((s) => ({ ...s, email }));
    const saved = loadProfile(email);
    if (saved) applyProfile(saved);
  };

  const o = ctx.offer;
  const publicName = o.company?.publicName || o.company?.name || "";
  const logo = companyLogo(publicName) || o.company?.logo || null;

  const buildOrder = (): Record<string, unknown> => {
    const cityName = selectedCity?.name_full_name_ua || selectedCity?.name_ua || "";
    const main = tourists[0];
    // Ukasko-модуль вимагає, щоб паспортні ключі БУЛИ ПРИСУТНІ (навіть порожні) —
    // інакше 500 "Undefined index: passportSerial". Тому завжди рядки, не undefined.
    const touristsListInfo = tourists.map((t) => ({
      name: t.nameLat.trim(), surname: t.surnameLat.trim(), dateBirth: t.dateBirth,
      identificationCode: t.identificationCode, withoutIdentificationCode: t.identificationCode ? false : true,
      documentType: 3,
      passportSerial: t.passportSerial || "", passportNumber: t.passportNumber || "",
      passportDate: t.passportDate ? toISO(t.passportDate) : "",
      passportEndDate: t.passportEndDate ? toISO(t.passportEndDate) : "",
      passportIssuedBy: t.passportIssuedBy || "", unzr: "",
    }));
    return {
      offerId: o.offerId,
      price: o.price,
      fullPrice: (o as { fullPrice?: number }).fullPrice ?? o.price,
      countryId: ctx.countryId,
      searchInfo: {
        multiVisa: ctx.multiVisa, birthDates: ctx.birthDates.map((b) => b), date: ctx.startDate,
        days: ctx.days, tourists: tourists.length, country: { id: ctx.countryId, name: ctx.countryName },
      },
      info: {
        name: main.nameLat.trim(), surname: main.surnameLat.trim(), dateBirth: main.dateBirth,
        identificationCode: main.identificationCode, withoutIdentificationCode: main.identificationCode ? false : true,
        phone: `+380${c.phone.replace(/\D/g, "")}`, mail: c.email,
        city: { id: selectedCity?.id ?? null, name: selectedCity?.name_ua ?? cityName, name_full_name_ua: cityName },
        street: c.street, house: c.house, apartment: c.apartment || "",
        documentation: {
          type: c.docType, serial: c.docSerial, number: c.docNumber, issuedBy: c.docIssuedBy,
          dateOfIssue: toUnix(c.docDate), endDateOfIssue: null,
        },
      },
      touristsListInfo,
      offerInfo: {
        ...o,
        offerId: o.offerId, purposeOfTrip: "tourism",
        startDate: ctx.startDate, endDate: ctx.endDate,
        price: o.price, fullPrice: (o as { fullPrice?: number }).fullPrice ?? o.price,
        company: { ...(o.company ?? {}), Id: o.company?.ex_id ?? o.company?.id },
      },
    };
  };

  const [savedOrder, setSavedOrder] = useState<Record<string, unknown> | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!selectedCity) { setError("Оберіть місто зі списку"); return; }
    if (tourists.some((t) => !parseUaDate(t.dateBirth))) { setError("Вкажіть коректні дати народження туристів"); return; }
    if (!parseUaDate(c.docDate)) { setError("Вкажіть дату видачі документа"); return; }
    setLoading(true);
    setError(null);
    // Зберігаємо профіль (контакт/документ/адреса/місто + латиниця й закордонний паспорт
    // страхувальника) для автозаповнення наступного разу. Укр. ПІБ тут немає — мердж їх збереже.
    const main = tourists[0];
    saveProfile({
      email: c.email, phone: c.phone,
      docType: c.docType, docSerial: c.docSerial, docNumber: c.docNumber, docIssuedBy: c.docIssuedBy, docDate: c.docDate,
      street: c.street, house: c.house,
      city: selectedCity, cityQuery,
      surnameLat: main.surnameLat, nameLat: main.nameLat,
      passportSerial: main.passportSerial, passportNumber: main.passportNumber,
      passportDate: main.passportDate, passportEndDate: main.passportEndDate, passportIssuedBy: main.passportIssuedBy,
    });
    try {
      const order = buildOrder();
      setSavedOrder(order);
      const idem = crypto.randomUUID();
      const res = await fetch("/api/tourism/order", {
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
      trackEvent("begin_checkout", { product: "tourism", currency: "UAH", value: ctx.offer.price });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500";

  return (
    <div className="rounded-2xl bg-white p-5 text-left shadow-2xl sm:p-7">
      <div className="mb-5 flex items-center gap-3">
        <button type="button" onClick={onBack} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 hover:text-zinc-900">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3">
          {logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt={publicName} className="h-9 w-9 shrink-0 object-contain" />
          )}
          <div>
            <h2 className="text-lg font-bold leading-tight text-zinc-900">Оформлення туристичного</h2>
            <p className="text-sm text-zinc-500">
              {formatCompanyName(publicName).toUpperCase()} · <span className="font-semibold text-zinc-900">{formatPrice(o.price)}</span>
            </p>
          </div>
        </div>
      </div>

      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Туристи */}
        {tourists.map((t, i) => (
          <div key={i} className={i > 0 ? "border-t border-zinc-100 pt-5" : ""}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              {i === 0 ? "Страхувальник (турист 1)" : `Турист ${i + 1}`}
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Прізвище (латиницею)" value={t.surnameLat} onChange={(e) => setT(i, "surnameLat", e.target.value)} placeholder="як у закордонному паспорті" required />
              <Input label="Ім'я (латиницею)" value={t.nameLat} onChange={(e) => setT(i, "nameLat", e.target.value)} placeholder="як у закордонному паспорті" required />
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DateInput label="Дата народження" value={t.dateBirth} onChange={(v) => setT(i, "dateBirth", v)} defaultYear={1990} required />
              <Input label="ІПН" value={t.identificationCode} onChange={(e) => setT(i, "identificationCode", e.target.value)} placeholder="1234567890" />
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Закордонний паспорт — серія / №" value={t.passportNumber} onChange={(e) => setT(i, "passportNumber", e.target.value)} placeholder="FA123456" />
              <Input label="Ким виданий" value={t.passportIssuedBy} onChange={(e) => setT(i, "passportIssuedBy", e.target.value)} placeholder="напр. 1234" />
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DateInput label="Дата видачі паспорта" value={t.passportDate} onChange={(v) => setT(i, "passportDate", v)} defaultYear={2015} />
              <DateInput label="Паспорт дійсний до" value={t.passportEndDate} onChange={(v) => setT(i, "passportEndDate", v)} minDate={new Date()} maxDate={new Date(new Date().getFullYear() + 15, 11, 31)} defaultYear={new Date().getFullYear() + 5} />
            </div>
          </div>
        ))}

        {/* Контакти */}
        <div className="border-t border-zinc-100 pt-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">Контакти страхувальника</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-500">Телефон</label>
              <div className="flex items-center rounded-xl border border-zinc-200 bg-white focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
                <span className="pl-4 pr-1 text-sm text-zinc-500">+380</span>
                <input type="tel" inputMode="numeric" placeholder="67 123 45 67" value={formatUaPhone(c.phone)}
                  onChange={(e) => setC((s) => ({ ...s, phone: e.target.value.replace(/\D/g, "").slice(0, 9) }))}
                  required className="h-11 w-full rounded-r-xl bg-transparent px-2 text-sm text-zinc-900 outline-none" />
              </div>
            </div>
            <Input label="Email" type="email" value={c.email} onChange={handleEmail} placeholder="email@example.com" required />
          </div>
        </div>

        {/* Документ страхувальника */}
        <div className="border-t border-zinc-100 pt-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">Документ страхувальника</p>
          <div className="mb-4 grid grid-cols-2 gap-2 sm:max-w-sm">
            {DOC_TYPES.map(({ t, label }) => (
              <button key={t} type="button" onClick={() => setC((s) => ({ ...s, docType: t }))}
                className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                  c.docType === t ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200" : "border-zinc-200 bg-white text-zinc-600 hover:border-indigo-200"
                }`}>{label}</button>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label={c.docType === 3 ? "Запис № (УНЗР)" : "Серія"} value={c.docSerial} onChange={setCf("docSerial")} required={c.docType === 1} />
            <Input label="Номер документа" value={c.docNumber} onChange={setCf("docNumber")} required />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Ким видано" value={c.docIssuedBy} onChange={setCf("docIssuedBy")} required />
            <DateInput label="Дата видачі" value={c.docDate} onChange={(v) => setC((s) => ({ ...s, docDate: v }))} required />
          </div>
        </div>

        {/* Адреса */}
        <div className="border-t border-zinc-100 pt-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">Адреса проживання</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="relative sm:col-span-2" ref={cityRef}>
              <label className="mb-1.5 block text-xs font-medium text-zinc-500">Місто</label>
              <input type="text" value={cityQuery} placeholder="Почніть вводити місто…" required spellCheck={false}
                onChange={(e) => { setCityQuery(e.target.value); setSelectedCity(null); }} className={inputCls} />
              {selectedCity && <p className="mt-1 text-xs font-medium text-emerald-600">✓ {selectedCity.name_full_name_ua || selectedCity.name_ua}</p>}
              {cityResults.length > 0 && !selectedCity && cityQuery.length >= 2 && (
                <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
                  {cityResults.map((ci) => (
                    <button key={ci.id} type="button" onClick={() => { setSelectedCity(ci); setCityQuery(ci.name_full_name_ua || ci.name_ua); setCityResults([]); }}
                      className="w-full px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50">{ci.name_full_name_ua || ci.name_ua}</button>
                  ))}
                </div>
              )}
            </div>
            <Input label="Вулиця" value={c.street} onChange={setCf("street")} required />
            <Input label="Будинок / кв." value={c.house} onChange={setCf("house")} required />
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
        email={c.email}
        loading={loading}
        error={error}
      />

      {orderId && savedOrder && (
        <PaymentModal
          open={step === "payment"}
          onClose={() => setStep("form")}
          orderId={orderId}
          amount={o.price}
          confirmEndpoint="/api/tourism/order"
          confirmPayload={{ order: savedOrder }}
          onPaid={(cId) => {
            trackEvent("purchase", { product: "tourism", currency: "UAH", value: ctx.offer.price, transaction_id: cId });
            setContractId(cId);
            setStep("success");
          }}
        />
      )}

      {contractId && (
        <SuccessModal open={step === "success"} onClose={onBack} contractId={contractId} downloadEndpoint="/api/tourism/order" />
      )}
    </div>
  );
}
