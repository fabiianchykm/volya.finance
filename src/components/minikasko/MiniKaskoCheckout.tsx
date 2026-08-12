"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DateInput, parseUaDate } from "@/components/ui/DateInput";
import { OtpModal } from "@/components/insurance/OtpModal";
import { PaymentModal } from "@/components/insurance/PaymentModal";
import { SuccessModal } from "@/components/insurance/SuccessModal";
import type { MiniKaskoOffer } from "@/types/api";
import { trackEvent, trackCheckoutStarted } from "@/lib/analytics";
import { saveProfile, loadProfile, loadLastProfile, fetchServerProfile, docFieldsByKind, type CustomerProfile } from "@/lib/customer-profile";
import { useSession } from "next-auth/react";
import { cityShort, cityLong, formatPlate } from "@/lib/utils";

// Оформлення міні-КАСКО: дані страхувальника (паспорт, ІПН, адреса) + авто за
// номером → declare → OTP підпису → оплата → confirm → готовий поліс (PDF).

interface CityOption { id: number; name_ua: string; name_full_name_ua: string; zone: number }

export interface MiniKaskoContext {
  offer: MiniKaskoOffer;
  startDate: string;         // "ДД.ММ.РРРР"
  city: CityOption | null;   // місто з екрана параметрів (дефолт)
}

function formatUaPhone(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 9);
  return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(" ");
}

// "ДД.ММ.РРРР" → "YYYY-MM-DD"
function toISODate(ua: string): string | null {
  const d = parseUaDate(ua);
  if (!d) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// startDate + 1 рік − 1 день → кінець дії (для збереження поліса).
function plusYearUa(ua: string): string {
  const d = parseUaDate(ua);
  if (!d) return "";
  const e = new Date(d.getFullYear() + 1, d.getMonth(), d.getDate() - 1);
  return `${String(e.getDate()).padStart(2, "0")}.${String(e.getMonth() + 1).padStart(2, "0")}.${e.getFullYear()}`;
}

export function MiniKaskoCheckout({ ctx, onBack }: { ctx: MiniKaskoContext; onBack: () => void }) {
  const [step, setStep] = useState<"form" | "otp" | "payment" | "success">("form");
  const [formStep, setFormStep] = useState<"customer" | "vehicle">("customer");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [contractId, setContractId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [f, setF] = useState({
    surnameUa: "", nameUa: "", patronymicUa: "",
    dateBirth: "", identificationCode: "",
    phone: "", email: "",
    docNumber: "", docIssuedBy: "", docDate: "",
    street: "", house: "", apartment: "",
    // Авто
    brand: "", model: "", number: "", vin: "", year: "", category: "B", isTaxi: false,
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

  // Місто (автопідбір) — дефолт із параметрів.
  const [cityQuery, setCityQuery] = useState(ctx.city ? cityShort(ctx.city.name_full_name_ua || ctx.city.name_ua) : "");
  const [cityResults, setCityResults] = useState<CityOption[]>([]);
  const [selectedCity, setSelectedCity] = useState<CityOption | null>(ctx.city);
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

  // Авто-підтягування даних за держ. номером (як в ЗК).
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
      if (car.number) lastPlate.current = String(car.number).replace(/\s/g, "");
      setF((s) => ({
        ...s,
        number: car.number ?? s.number,
        brand: car.mark ?? s.brand,
        model: car.model ?? s.model,
        year: car.year ? String(car.year) : s.year,
        vin: car.vin ?? s.vin,
        category: (car.autoCategory ? String(car.autoCategory).charAt(0) : s.category) || "B",
      }));
    } catch {
      setPlateError("Помилка звʼязку з реєстром — заповніть дані вручну");
    } finally {
      setPlateLoading(false);
    }
  };
  useEffect(() => {
    const raw = f.number.replace(/\s/g, "");
    if (raw.length < 8 || raw === lastPlate.current || plateLoading) return;
    const t = setTimeout(() => { void lookupPlate(); }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.number]);

  // Автопідстановка збереженого профілю (спільний із рештою продуктів).
  const applyProfile = (p: CustomerProfile) => {
    // Міні-КАСКО — лише паспорт: беремо саме паспортну сутність (не інший документ).
    const pass = docFieldsByKind(p, "passport");
    setF((s) => ({
      ...s,
      surnameUa: p.surname, nameUa: p.name, patronymicUa: p.patronymic,
      phone: p.phone, email: p.email,
      identificationCode: p.identificationCode,
      dateBirth: p.dateBirth,
      docNumber: pass?.number ?? "", docIssuedBy: pass?.issuedBy ?? "", docDate: pass?.date ?? "",
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

  const buildPayload = () => {
    const cityName = selectedCity?.name_full_name_ua || selectedCity?.name_ua || "";
    return {
      offerId: ctx.offer.offerId,
      car: {
        vin: f.vin || "",
        year: Number(f.year) || 0,
        is_taxi: f.isTaxi ? 1 : 0,
        reg_num: f.number.replace(/\s/g, ""),
        mark_name: f.brand,
        model_name: f.model,
        category: f.category || "B",
        registration_city_id: selectedCity?.id ?? 1,
        registration_city_name: cityName,
      },
      dates: { startDate: toISODate(ctx.startDate) },
      customer: {
        code: f.identificationCode,
        surname: f.surnameUa,
        name: f.nameUa,
        middle_name: f.patronymicUa,
        phone: `+380${f.phone.replace(/\D/g, "")}`,
        email: f.email,
        document_number: f.docNumber,
        document_issued_by: f.docIssuedBy,
        document_issued_date: toISODate(f.docDate),
        city_id: selectedCity?.id ?? 1,
        city_name: cityName,
        street: f.street,
        house: f.house,
        apartment: f.apartment,
        born_date: toISODate(f.dateBirth),
      },
    };
  };

  const goToVehicle = () => {
    if (!f.surnameUa || !f.nameUa || !f.patronymicUa) { setError("Заповніть ПІБ"); return; }
    if (!parseUaDate(f.dateBirth)) { setError("Вкажіть коректну дату народження"); return; }
    if (f.identificationCode.replace(/\D/g, "").length !== 10) { setError("Вкажіть коректний ІПН (10 цифр)"); return; }
    if (f.phone.replace(/\D/g, "").length < 9) { setError("Вкажіть номер телефону"); return; }
    if (!f.email) { setError("Вкажіть email"); return; }
    if (!f.docNumber || !f.docIssuedBy || !parseUaDate(f.docDate)) { setError("Заповніть дані паспорта"); return; }
    if (!selectedCity) { setError("Оберіть місто зі списку"); return; }
    if (!f.street || !f.house) { setError("Вкажіть адресу проживання"); return; }
    setError(null);
    saveProfile({
      surname: f.surnameUa, name: f.nameUa, patronymic: f.patronymicUa,
      phone: f.phone, email: f.email,
      identificationCode: f.identificationCode,
      dateBirth: f.dateBirth,
      street: f.street, house: f.house,
      docType: 1, docKind: "passport", docSerial: "", docNumber: f.docNumber, docIssuedBy: f.docIssuedBy, docDate: f.docDate,
      city: selectedCity, cityQuery,
    });
    setFormStep("vehicle");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!f.number || !f.brand || !f.model || !f.year) { setError("Заповніть дані авто"); return; }
    setLoading(true);
    setError(null);
    try {
      const idem = crypto.randomUUID();
      const res = await fetch("/api/mini-kasko/order", {
        method: "POST",
        headers: { "content-type": "application/json", "idempotency-key": idem },
        body: JSON.stringify({ action: "declare", ...buildPayload() }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Помилка заявлення поліса");
      const id = json.data?.id as string;
      setOrderId(id);
      await fetch("/api/mini-kasko/order", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "send-otp", orderId: id, channel: "email" }),
      });
      trackCheckoutStarted({
        product: "Міні-КАСКО",
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
      const res = await fetch("/api/mini-kasko/order", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "verify-otp", orderId, otp }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      if (!json.valid) throw new Error("Невірний код. Спробуйте ще раз.");
      setStep("payment");
      trackEvent("begin_checkout", { product: "mini-kasko", currency: "UAH", value: ctx.offer.price });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка");
    } finally {
      setLoading(false);
    }
  };

  // Після успішної оплати+підтвердження: зберігаємо поліс у БД + sales-сповіщення.
  const savePolicyRecord = async (cId: string) => {
    try {
      await fetch("/api/policies", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: cId || orderId,
          email: f.email,
          phone: `+380${f.phone.replace(/\D/g, "")}`,
          customerName: [f.surnameUa, f.nameUa, f.patronymicUa].filter(Boolean).join(" "),
          customer: buildPayload().customer,
          orderId,
          company: ctx.offer.companyNamePublic || ctx.offer.companyName,
          vehicle: { mark: f.brand, model: f.model, year: Number(f.year) || undefined, plate: f.number.replace(/\s/g, "") },
          price: ctx.offer.price,
          startDate: ctx.startDate,
          endDate: plusYearUa(ctx.startDate),
          product: "Міні-КАСКО",
        }),
      });
    } catch { /* не має ламати UX */ }
  };

  const inputCls =
    "h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500";

  return (
    <div className="rounded-2xl bg-white p-5 text-left shadow-2xl sm:p-7">
      <div className="mb-5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => (formStep === "vehicle" ? setFormStep("customer") : onBack())}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 hover:text-zinc-900"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-zinc-900">Оформлення Міні-КАСКО</h2>
          <p className="text-sm text-zinc-500">
            Крок {formStep === "customer" ? 1 : 2} з 2 · <span className="font-semibold text-zinc-900">{ctx.offer.price} грн</span>
            {" · "}покриття {(ctx.offer.coverage / 1000).toLocaleString("uk-UA")} тис. грн
          </p>
        </div>
      </div>

      {error && <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600 border border-red-200">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {formStep === "customer" && (
        <>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">Страхувальник</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input label="Прізвище" value={f.surnameUa} onChange={set("surnameUa")} required />
            <Input label="Ім'я" value={f.nameUa} onChange={set("nameUa")} required />
            <Input label="По-батькові" value={f.patronymicUa} onChange={set("patronymicUa")} required />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DateInput label="Дата народження" value={f.dateBirth} onChange={(v) => setF((s) => ({ ...s, dateBirth: v }))} defaultYear={1990} required />
            <Input label="ІПН" value={f.identificationCode} onChange={set("identificationCode")} placeholder="1234567890" required />
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

        <div className="border-t border-zinc-100 pt-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">Паспорт</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input label="Номер паспорта" value={f.docNumber} onChange={set("docNumber")} required />
            <Input label="Ким видано" value={f.docIssuedBy} onChange={set("docIssuedBy")} required />
            <DateInput label="Дата видачі" value={f.docDate} onChange={(v) => setF((s) => ({ ...s, docDate: v }))} required />
          </div>
        </div>

        <div className="border-t border-zinc-100 pt-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">Адреса проживання</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="relative sm:col-span-2" ref={cityRef}>
              <label className="mb-1.5 block text-xs font-medium text-zinc-500">Місто</label>
              <input type="text" value={cityQuery} placeholder="Почніть вводити місто…" required spellCheck={false}
                onChange={(e) => { setCityQuery(e.target.value); setSelectedCity(null); }}
                className={`${inputCls}${selectedCity ? " border-emerald-400 bg-emerald-50/40" : ""}`} />
              {cityResults.length > 0 && !selectedCity && cityQuery.length >= 2 && (
                <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
                  {cityResults.map((c) => (
                    <button key={c.id} type="button" onClick={() => { setSelectedCity(c); setCityQuery(cityShort(c.name_full_name_ua || c.name_ua)); setCityResults([]); }}
                      className="w-full px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50">{cityLong(c.name_full_name_ua || c.name_ua)}</button>
                  ))}
                </div>
              )}
            </div>
            <Input label="Вулиця" value={f.street} onChange={set("street")} required />
            <Input label="Будинок / кв." value={f.house} onChange={set("house")} required />
          </div>
        </div>

        <div className="flex justify-end border-t border-zinc-100 pt-4">
          <Button type="button" onClick={goToVehicle} variant="primary" size="lg" className="w-full sm:w-auto sm:px-8">
            <span className="flex items-center gap-2">Далі <ArrowRight className="h-5 w-5" /></span>
          </Button>
        </div>
        </>
        )}

        {formStep === "vehicle" && (
        <>
        <div className="border-t border-zinc-100 pt-5">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">Транспортний засіб</p>
          {/* Підказка — зверху, над полями */}
          <p className="mb-3 text-xs text-zinc-400">Введіть держ. номер — марка, модель і рік підтягнуться автоматично.</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input label="Держ. номер" value={f.number}
              onChange={(e) => setF((s) => ({ ...s, number: e.target.value.toUpperCase() }))}
              onBlur={lookupPlate} placeholder="AA 1234 BB" required />
            <Input label="Марка" value={f.brand} onChange={set("brand")} placeholder="SKODA" required />
            <Input label="Модель" value={f.model} onChange={set("model")} placeholder="OCTAVIA" required />
            <Input label="Рік випуску" value={f.year} onChange={set("year")} placeholder="2018" required />
            <Input label="VIN" value={f.vin} onChange={set("vin")} placeholder="необовʼязково" />
          </div>
          {plateLoading ? (
            <p className="mt-2 text-xs font-medium text-indigo-500">Підтягуємо дані авто за номером…</p>
          ) : plateError ? (
            <p className="mt-2 text-xs font-medium text-amber-600">{plateError}</p>
          ) : null}
          {/* Таксі — окремим рядком знизу, не збоку */}
          <label className="mt-4 flex w-fit cursor-pointer items-center gap-2 text-sm text-zinc-700">
            <input type="checkbox" checked={f.isTaxi} onChange={(e) => setF((s) => ({ ...s, isTaxi: e.target.checked }))}
              className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500" />
            Використовується як таксі
          </label>
        </div>

        <div className="flex justify-end border-t border-zinc-100 pt-4">
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
        onResend={async () => { if (orderId) await fetch("/api/mini-kasko/order", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "send-otp", orderId, channel: "email" }) }); }}
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
          confirmEndpoint="/api/mini-kasko/order"
          onPaid={(cId) => {
            trackEvent("purchase", { product: "mini-kasko", currency: "UAH", value: ctx.offer.price, transaction_id: cId });
            setContractId(cId);
            void savePolicyRecord(cId);
            setStep("success");
          }}
        />
      )}

      {contractId && (
        <SuccessModal open={step === "success"} onClose={onBack} contractId={contractId} downloadEndpoint="/api/mini-kasko/order" />
      )}
    </div>
  );
}
