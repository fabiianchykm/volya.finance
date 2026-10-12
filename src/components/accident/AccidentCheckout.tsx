"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { registerPendingOrder } from "@/lib/pending-order-client";
import { Input } from "@/components/ui/Input";
import { DateInput, parseUaDate } from "@/components/ui/DateInput";
import { OtpModal } from "@/components/insurance/OtpModal";
import { PaymentModal } from "@/components/insurance/PaymentModal";
import { SuccessModal } from "@/components/insurance/SuccessModal";
import { formatPrice, cityShort } from "@/lib/utils";
import type { AccidentOffer, AccidentParams } from "@/types/api";
import { trackEvent, trackCheckoutStarted } from "@/lib/analytics";
import { saveProfile, loadProfile, listProfiles, fetchServerProfiles, docFieldsByKind, type CustomerProfile, type DocFields } from "@/lib/customer-profile";
import { ProfilePicker } from "@/components/insurance/ProfilePicker";
import { useSession } from "next-auth/react";
import { readResume, clearResume, useResumeSnapshot } from "@/lib/checkout-resume";
import { useI18n } from "@/lib/i18n";
import { SupportCTA } from "@/components/ui/SupportCTA";
import type { AccidentForm } from "./AccidentFlow";
import { ACC_PERIODS } from "./AccidentFlow";

// Анкета оформлення НВ: платник (страхувальник) + за потреби інша застрахована
// особа (дитина/родич) → order/create (statusId:5) → OTP → оплата → confirm → поліс.
// Дати — d.m.Y (не unix, на відміну від тварин). Місто — простий рядок.

export interface AccidentCheckoutCtx {
  offer: AccidentOffer;
  form: AccidentForm;
  params: AccidentParams;   // searchInfo заявки — рівно те, що рахував калькулятор
}

const DOC_TYPES = [
  { t: 3 as const, label: "ID-карта", en: "ID card" },
  { t: 1 as const, label: "Паспорт (книжечка)", en: "Passport (booklet)" },
];
type DocType = 1 | 3;

interface Person {
  surname: string; name: string; patronymic: string;
  dateBirth: string; identificationCode: string; phone: string; email: string;
  docType: DocType; docSerial: string; docNumber: string; docIssuedBy: string; docDate: string;
  city: string; street: string; house: string; apartment: string;
}
const emptyPerson = (): Person => ({
  surname: "", name: "", patronymic: "", dateBirth: "", identificationCode: "", phone: "", email: "",
  docType: 3, docSerial: "", docNumber: "", docIssuedBy: "", docDate: "", city: "", street: "", house: "", apartment: "",
});

function formatUaPhone(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 9);
  return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(" ");
}
const fullName = (p: Person) => [p.surname, p.name, p.patronymic].filter(Boolean).join(" ");

// AccidentPerson за схемою Ukasko. ID-картка: серія порожня, «Запис №» → unzr.
function toApiPerson(p: Person): Record<string, unknown> {
  const isId = p.docType === 3;
  return {
    name: p.name.trim(), surname: p.surname.trim(), patronymic: p.patronymic.trim() || null,
    identificationCode: p.identificationCode.trim() || null,
    withoutIdentificationCode: !p.identificationCode.trim(),
    dateBirth: p.dateBirth,
    phone: `+380${p.phone.replace(/\D/g, "")}`,
    mail: p.email.trim() || null, email: p.email.trim() || null,
    city: p.city.trim(), street: p.street.trim() || null, house: p.house.trim() || null, apartment: p.apartment.trim() || null,
    documentation: {
      type: p.docType,
      serial: isId ? "" : p.docSerial.trim(),
      number: p.docNumber.trim(),
      dateOfIssue: p.docDate || null,
      issuedBy: p.docIssuedBy.trim() || null,
      unzr: isId ? (p.docSerial.trim() || null) : null,
    },
  };
}

export function AccidentCheckout({ ctx, onBack }: { ctx: AccidentCheckoutCtx; onBack: () => void }) {
  const { t } = useI18n();
  const [step, setStep] = useState<"form" | "otp" | "payment" | "success">("form");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [contractId, setContractId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Платник; дата народження з калькулятора — це дата ЗАСТРАХОВАНОГО.
  const [payer, setPayer] = useState<Person>(() => ({ ...emptyPerson(), dateBirth: ctx.form.birthDate }));
  const [other, setOther] = useState(false);   // страхується інша особа
  const [insured, setInsured] = useState<Person>(() => ({ ...emptyPerson(), dateBirth: ctx.form.birthDate }));

  const setP = (k: keyof Person) => (e: React.ChangeEvent<HTMLInputElement>) => setPayer((s) => ({ ...s, [k]: e.target.value }));
  const setI = (k: keyof Person) => (e: React.ChangeEvent<HTMLInputElement>) => setInsured((s) => ({ ...s, [k]: e.target.value }));

  // Поля документа памʼятаються окремо по типу (див. інші чекаути).
  const docStash = useRef<Record<number, { serial: string; number: string; issuedBy: string; date: string }>>({});
  const changeDocType = (dt: DocType) => setPayer((s) => {
    if (s.docType === dt) return s;
    docStash.current[s.docType] = { serial: s.docSerial, number: s.docNumber, issuedBy: s.docIssuedBy, date: s.docDate };
    const saved = docStash.current[dt];
    return { ...s, docType: dt, docSerial: saved?.serial ?? "", docNumber: saved?.number ?? "", docIssuedBy: saved?.issuedBy ?? "", docDate: saved?.date ?? "" };
  });

  const applyProfile = (p: CustomerProfile) => {
    const stash: Record<number, DocFields> = {};
    const pf = docFieldsByKind(p, "passport"); if (pf) stash[1] = pf;
    const idf = docFieldsByKind(p, "idcard"); if (idf) stash[3] = idf;
    docStash.current = stash;
    const dt: DocType = p.lastDocKind === "passport" ? 1 : 3;
    const active = stash[dt];
    setPayer((s) => ({
      ...s,
      surname: p.surname, name: p.name, patronymic: p.patronymic,
      phone: p.phone, email: p.email, identificationCode: p.identificationCode,
      // Якщо платник = застрахований, дата народження вже зафіксована калькулятором.
      dateBirth: other ? p.dateBirth : s.dateBirth,
      docType: dt,
      docSerial: active?.serial ?? "", docNumber: active?.number ?? "", docIssuedBy: active?.issuedBy ?? "", docDate: active?.date ?? "",
      street: p.street, house: p.house,
      city: p.city ? cityShort(p.cityQuery || p.city.name_full_name_ua || p.city.name_ua) : s.city,
    }));
  };

  const { status: authStatus } = useSession();
  const [savedProfiles, setSavedProfiles] = useState<CustomerProfile[]>([]);
  useEffect(() => {
    if (authStatus !== "authenticated") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSavedProfiles(listProfiles());
    void fetchServerProfiles().then((all) => setSavedProfiles(all));
  }, [authStatus]);

  const handleEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setPayer((s) => ({ ...s, email }));
    if (authStatus === "authenticated") {
      const saved = loadProfile(email);
      if (saved) applyProfile(saved);
    }
  };

  const buildOrder = (): Record<string, unknown> => ({
    offerId: ctx.offer.offerId,
    price: ctx.offer.price,
    discountPrice: null,
    bonusSystemValue: 0,
    searchInfo: ctx.params,
    payer: toApiPerson(payer),
    insured: other ? toApiPerson(insured) : null,
  });

  // Відновлення після перезавантаження вкладки (клієнт ходив у пошту за кодом).
  const resumedRef = useRef(false);
  useEffect(() => {
    if (resumedRef.current) return;
    resumedRef.current = true;
    const r = readResume<{ step: "otp" | "payment"; payer: Person; other: boolean; insured: Person; orderId: string }>("checkout_resume_accident");
    if (r && r.orderId && (r.step === "otp" || r.step === "payment")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPayer(r.payer); setOther(r.other); setInsured(r.insured);
      setOrderId(r.orderId); setStep(r.step);
    }
  }, []);
  useResumeSnapshot("checkout_resume_accident", (step === "otp" || step === "payment") && orderId ? { ctx, step, payer, other, insured, orderId } : null);

  const validatePerson = (p: Person, who: string): string | null => {
    if (!p.surname.trim() || !p.name.trim()) return t({ uk: `Вкажіть прізвище та імʼя (${who})`, en: `Enter surname and name (${who})` });
    if (!parseUaDate(p.dateBirth)) return t({ uk: `Вкажіть дату народження (${who})`, en: `Enter date of birth (${who})` });
    if (p.phone.replace(/\D/g, "").length !== 9) return t({ uk: `Вкажіть телефон (${who})`, en: `Enter phone (${who})` });
    if (!p.city.trim()) return t({ uk: `Вкажіть місто (${who})`, en: `Enter city (${who})` });
    if (!p.docNumber.trim()) return t({ uk: `Вкажіть номер документа (${who})`, en: `Enter document number (${who})` });
    if (p.docType === 1 && !p.docSerial.trim()) return t({ uk: `Вкажіть серію паспорта (${who})`, en: `Enter passport series (${who})` });
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const err = validatePerson(payer, t({ uk: "платник", en: "payer" })) ?? (other ? validatePerson(insured, t({ uk: "застрахований", en: "insured" })) : null);
    if (err) { setError(err); return; }
    if (!payer.email.trim()) { setError(t({ uk: "Вкажіть email — на нього прийде поліс", en: "Enter email — the policy will be sent there" })); return; }
    if (!payer.identificationCode.trim()) { setError(t({ uk: "Вкажіть ІПН платника", en: "Enter the payer's tax ID" })); return; }
    setLoading(true);
    setError(null);
    saveProfile({
      surname: payer.surname, name: payer.name, patronymic: payer.patronymic,
      phone: payer.phone, email: payer.email,
      identificationCode: payer.identificationCode,
      dateBirth: payer.dateBirth,
      street: payer.street, house: payer.house,
      docType: payer.docType, docKind: payer.docType === 1 ? "passport" : "idcard",
      docSerial: payer.docSerial, docNumber: payer.docNumber, docIssuedBy: payer.docIssuedBy, docDate: payer.docDate,
      cityQuery: payer.city,
    });
    try {
      const order = buildOrder();
      const idem = crypto.randomUUID();
      const res = await fetch("/api/accident/order", {
        method: "POST",
        headers: { "content-type": "application/json", "idempotency-key": idem },
        body: JSON.stringify({ action: "declare", order }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? t({ uk: "Помилка заявлення поліса", en: "Policy declaration error" }));
      const id = json.data?.id;
      setOrderId(id);
      const company = ctx.offer.companyNamePublic || ctx.offer.company?.publicName || ctx.offer.companyName || "";
      const per = ACC_PERIODS.find((p) => p.value === ctx.form.period);
      registerPendingOrder({
        orderId: id, product: "accident",
        meta: {
          email: payer.email, phone: `+380${payer.phone.replace(/\D/g, "")}`,
          customerName: fullName(payer),
          customer: { payer: toApiPerson(payer), insured: other ? toApiPerson(insured) : null, insuredName: other ? fullName(insured) : null },
          company, price: ctx.offer.price, productLabel: "Нещасний випадок",
          startDate: ctx.form.startDate,
          endDate: null,
          vehicle: { mark: t({ uk: "Нещасний випадок", en: "Accident" }), model: `${ctx.form.sum.toLocaleString("uk-UA")} грн · ${per ? per.label : ""}` },
        },
      });
      await fetch("/api/insurance/otp", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "send", orderId: id }),
      });
      trackCheckoutStarted({
        product: "Нещасний випадок",
        name: fullName(payer),
        company,
        price: ctx.offer.price,
        phone: `+380${payer.phone.replace(/\D/g, "")}`,
        email: payer.email,
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
      trackEvent("begin_checkout", { product: "accident", currency: "UAH", value: ctx.offer.price });
    } catch (err) {
      setError(err instanceof Error ? err.message : t({ uk: "Помилка", en: "Error" }));
    } finally {
      setLoading(false);
    }
  };

  const toggleCls = (on: boolean) => `h-11 rounded-xl border text-sm font-medium transition-colors ${on ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-200 dark:ring-indigo-900" : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-indigo-200"}`;

  // Блок полів особи (платник або застрахований). Дата народження застрахованого
  // зафіксована калькулятором (від неї рахувалась ціна) — її не редагуємо.
  const personFields = (p: Person, set: (k: keyof Person) => (e: React.ChangeEvent<HTMLInputElement>) => void, patch: (q: Partial<Person>) => void, isPayer: boolean) => {
    const lockBirth = isPayer ? !other : true;
    return (
      <>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input label={t({ uk: "Прізвище", en: "Surname" })} value={p.surname} onChange={set("surname")} required />
          <Input label={t({ uk: "Ім'я", en: "First name" })} value={p.name} onChange={set("name")} required />
          <Input label={t({ uk: "По-батькові", en: "Patronymic" })} value={p.patronymic} onChange={set("patronymic")} />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {lockBirth ? (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{t({ uk: "Дата народження", en: "Date of birth" })}</label>
              <div className="flex h-11 items-center rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 px-4 text-sm text-zinc-700 dark:text-zinc-200">{p.dateBirth}</div>
            </div>
          ) : (
            <DateInput label={t({ uk: "Дата народження", en: "Date of birth" })} value={p.dateBirth} onChange={(v) => patch({ dateBirth: v })} defaultYear={1990} required />
          )}
          <Input label={isPayer ? t({ uk: "ІПН", en: "Tax ID (INN)" }) : t({ uk: "ІПН (за наявності)", en: "Tax ID (if any)" })} value={p.identificationCode} onChange={set("identificationCode")} placeholder="1234567890" required={isPayer} />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{t({ uk: "Телефон", en: "Phone" })}</label>
            <div className="flex items-center rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
              <span className="pl-4 pr-1 text-sm text-zinc-500 dark:text-zinc-400">+380</span>
              <input type="tel" inputMode="numeric" aria-label={t({ uk: "Номер телефону", en: "Phone number" })} placeholder="67 123 45 67" value={formatUaPhone(p.phone)}
                onChange={(e) => patch({ phone: e.target.value.replace(/\D/g, "").slice(0, 9) })}
                required className="h-11 w-full rounded-r-xl bg-transparent px-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none" />
            </div>
          </div>
          {isPayer
            ? <Input label="Email" type="email" value={p.email} onChange={handleEmail} placeholder="email@example.com" required />
            : <Input label={t({ uk: "Email (необовʼязково)", en: "Email (optional)" })} type="email" value={p.email} onChange={set("email")} placeholder="email@example.com" />}
        </div>

        {/* Документ */}
        <p className="mb-3 mt-5 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{t({ uk: "Документ", en: "Document" })}</p>
        <div className="mb-4 grid grid-cols-2 gap-2 sm:max-w-sm">
          {DOC_TYPES.map(({ t: dt, label, en }) => (
            <button key={dt} type="button" onClick={() => (isPayer ? changeDocType(dt) : patch({ docType: dt }))} className={`min-h-11 px-3 py-2 ${toggleCls(p.docType === dt)}`}>{t({ uk: label, en })}</button>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label={p.docType === 3 ? t({ uk: "Запис № (УНЗР)", en: "Record No. (UNZR)" }) : t({ uk: "Серія", en: "Series" })} value={p.docSerial} onChange={set("docSerial")} required={p.docType === 1} />
          <Input label={t({ uk: "Номер документа", en: "Document number" })} value={p.docNumber} onChange={set("docNumber")} required />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label={t({ uk: "Ким видано", en: "Issued by" })} value={p.docIssuedBy} onChange={set("docIssuedBy")} />
          <DateInput label={t({ uk: "Дата видачі", en: "Issue date" })} value={p.docDate} onChange={(v) => patch({ docDate: v })} />
        </div>

        {/* Адреса */}
        <p className="mb-3 mt-5 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{t({ uk: "Адреса проживання", en: "Address" })}</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="sm:col-span-2"><Input label={t({ uk: "Місто / село", en: "City / village" })} value={p.city} onChange={set("city")} placeholder={t({ uk: "Київ", en: "Kyiv" })} required /></div>
          <Input label={t({ uk: "Вулиця", en: "Street" })} value={p.street} onChange={set("street")} />
          <Input label={t({ uk: "Будинок / кв.", en: "House / apt." })} value={p.house} onChange={set("house")} />
        </div>
      </>
    );
  };

  const company = ctx.offer.companyNamePublic || ctx.offer.company?.publicName || ctx.offer.companyName || "";

  return (
    <div className="rounded-2xl bg-white dark:bg-zinc-900 p-5 text-left shadow-2xl sm:p-7">
      <div className="mb-5 flex items-center gap-3">
        <button type="button" aria-label={t({ uk: "Назад", en: "Back" })} onClick={onBack} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-lg font-bold leading-tight text-zinc-900 dark:text-zinc-100">{t({ uk: "Оформлення страхування від нещасних випадків", en: "Accident insurance checkout" })}</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{company && <>{company} · </>}<span className="font-semibold text-zinc-900 dark:text-zinc-100">{formatPrice(ctx.offer.price)}</span></p>
        </div>
      </div>

      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}<SupportCTA /></div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <ProfilePicker profiles={savedProfiles} onPick={applyProfile} />

        {/* Кого страхуємо */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{t({ uk: "Кого страхуємо", en: "Who is insured" })}</p>
          <div className="grid grid-cols-2 gap-2 sm:max-w-md">
            <button type="button" onClick={() => setOther(false)} className={toggleCls(!other)}>{t({ uk: "Себе", en: "Myself" })}</button>
            <button type="button" onClick={() => setOther(true)} className={toggleCls(other)}>{t({ uk: "Іншу особу (дитину)", en: "Another person (child)" })}</button>
          </div>
        </div>

        <div className="border-t border-zinc-100 dark:border-zinc-800 pt-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{other ? t({ uk: "Платник (страхувальник)", en: "Payer (policyholder)" }) : t({ uk: "Застрахована особа", en: "Insured person" })}</p>
          {personFields(payer, setP, (q) => setPayer((s) => ({ ...s, ...q })), true)}
        </div>

        {other && (
          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{t({ uk: "Застрахована особа", en: "Insured person" })}</p>
            {personFields(insured, setI, (q) => setInsured((s) => ({ ...s, ...q })), false)}
          </div>
        )}

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
        email={payer.email}
        loading={loading}
        error={error}
      />

      {orderId && (
        <PaymentModal
          product="accident"
          open={step === "payment"}
          onClose={() => setStep("form")}
          orderId={orderId}
          amount={ctx.offer.price}
          confirmEndpoint="/api/accident/order"
          onPaid={(cId) => {
            trackEvent("purchase", { product: "accident", currency: "UAH", value: ctx.offer.price, transaction_id: cId });
            setContractId(cId);
            setStep("success"); clearResume("checkout_resume_accident");
          }}
        />
      )}

      {contractId && (
        <SuccessModal open={step === "success"} onClose={onBack} contractId={contractId} downloadEndpoint="/api/accident/order" />
      )}
    </div>
  );
}
