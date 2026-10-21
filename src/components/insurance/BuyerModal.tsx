"use client";

import { useState } from "react";
import { BadgePercent, Info, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Tooltip } from "@/components/ui/Tooltip";
import { Button } from "@/components/ui/Button";
import { DateInput, parseUaDate } from "@/components/ui/DateInput";
import { PRIVILEGES } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";
import { type BuyerData } from "@/types/insurance";

// Пільга «без пільг» (id 1) = дефолт; хрестик скидає вибір саме до неї.
const DEFAULT_PRIVILEGE = 1;

interface BuyerModalProps {
  open: boolean;
  onClose: () => void;
  buyer: BuyerData;
  onConfirm: (buyer: BuyerData) => void;
  loading?: boolean;
  /** Обовʼязковий діалог: дати ДН треба заповнити, вікно не закрити без них. */
  required?: boolean;
}

export function BuyerModal({ open, onClose, buyer, onConfirm, loading, required }: BuyerModalProps) {
  const { t } = useI18n();
  const [privilegeId, setPrivilegeId] = useState(buyer.privilegeId);
  // Список пропозицій рахуємо по наймолодшому водію → тут просимо ЛИШЕ його ДН.
  // ДН страхувальника вводиться на checkout (у формі покупця).
  const [youngestBirth, setYoungestBirth] = useState(buyer.youngestBirthDate ?? "");
  // ДН людини, на яку оформлюється страхування (страхувальника) — за нею рахують
  // Княжа, Інтер-Поліс, PZU, Арсенал; далі підставляється в анкету оформлення.
  const [policyholderBirth, setPolicyholderBirth] = useState(buyer.policyholderBirthDate ?? "");
  const [phError, setPhError] = useState(false);
  // ІПН страхувальника — потрібен для персонального тарифу окремих СК; без нього
  // ціна у видачі може відрізнятись від ціни при оформленні.
  const [ipn, setIpn] = useState(buyer.identificationCode ?? "");
  const [ipnError, setIpnError] = useState(false);
  const [ageError, setAgeError] = useState(false);
  const [wasOpen, setWasOpen] = useState(false);

  // Засіваємо форму поточними даними в момент відкриття (як у VehicleConfirmModal).
  if (open && !wasOpen) {
    setWasOpen(true);
    setPrivilegeId(buyer.privilegeId);
    setYoungestBirth(buyer.youngestBirthDate ?? "");
    setPolicyholderBirth(buyer.policyholderBirthDate ?? "");
    setPhError(false);
    setIpn(buyer.identificationCode ?? "");
    setIpnError(false);
    setAgeError(false);
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  // Валідна ДН = реальна дата з розумним віком (18–99).
  const dobOk = (v: string) => {
    const d = parseUaDate(v);
    if (!d) return false;
    const age = (Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000);
    return age >= 18 && age <= 99;
  };
  const ipnValid = /^\d{10}$/.test(ipn);
  const datesValid = dobOk(youngestBirth) && dobOk(policyholderBirth) && ipnValid;

  const handleConfirm = () => {
    if (!dobOk(policyholderBirth)) { setPhError(true); return; }
    if (!ipnValid) { setIpnError(true); return; }
    if (!dobOk(youngestBirth)) { setAgeError(true); return; }
    onConfirm({
      ...buyer,
      privilegeId,
      customerType: privilegeId === 1 ? 1 : 3,
      policyholderBirthDate: parseUaDate(policyholderBirth) ? policyholderBirth : "",
      youngestBirthDate: parseUaDate(youngestBirth) ? youngestBirth : "",
      identificationCode: ipn,
    });
  };

  // Обовʼязковий діалог не закрити (ні хрестиком, ні фоном), поки дати не валідні.
  const handleClose = () => { if (!required || datesValid) onClose(); };

  return (
    <Modal open={open} onClose={handleClose} title={t({ uk: "Індивідуальна пропозиція", en: "Personalised offer" })} size="md" preventOutsideClose={required && !datesValid} hideClose={required && !datesValid}>
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3.5 dark:border-indigo-900 dark:bg-indigo-950/40">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
            <BadgePercent className="h-4 w-4" />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">
              {t({ uk: "Персональна ціна — вигідніше до ", en: "A personalised price — save up to " })}
              <span className="font-extrabold">42%</span>
            </p>
            <p className="text-xs leading-relaxed text-indigo-700/90 dark:text-indigo-200/80">
              {required
                ? t({
                    uk: "Вкажіть дату народження та ідентифікаційний код людини, на яку оформлюється страхування, і дату народження наймолодшого водія, щоб отримати персональну ціну від страхових компаній.",
                    en: "Enter the date of birth and tax ID of the person the insurance is issued for, and the youngest driver's date of birth, to get a personalised price from the insurers.",
                  })
                : t({
                    uk: "Оберіть пільгу, вкажіть дату народження та ідентифікаційний код людини, на яку оформлюється страхування, і дату народження наймолодшого водія, щоб отримати персональну ціну від страхових компаній.",
                    en: "Choose your benefit, enter the date of birth and tax ID of the person the insurance is issued for, and the youngest driver's date of birth, to get a personalised price from the insurers.",
                  })}
            </p>
          </div>
        </div>

        {/* Пільга — лише при редагуванні (не в обовʼязковому діалозі після підтвердження
            авто, де просимо тільки дати народження). */}
        {!required && (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">{t({ uk: "Пільгова категорія", en: "Benefit category" })}</label>
            <div className="flex items-center gap-2">
              <select
                value={privilegeId}
                onChange={(e) => setPrivilegeId(Number(e.target.value))}
                className={`h-11 flex-1 rounded-xl border bg-white px-3 text-sm outline-none transition-colors focus:border-indigo-400 dark:bg-zinc-900 ${
                  privilegeId !== DEFAULT_PRIVILEGE
                    ? "border-indigo-300 font-medium text-zinc-900 dark:border-indigo-800 dark:text-zinc-100"
                    : "border-zinc-200 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
                }`}
              >
                {PRIVILEGES.map((p) => (
                  <option key={p.id} value={p.id}>{t({ uk: p.label, en: p.labelEn })}</option>
                ))}
              </select>
              {privilegeId !== DEFAULT_PRIVILEGE && (
                <button
                  type="button"
                  onClick={() => setPrivilegeId(DEFAULT_PRIVILEGE)}
                  aria-label={t({ uk: "Скасувати вибір пільги", en: "Clear benefit selection" })}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-200 text-zinc-400 transition-colors hover:border-rose-300 hover:text-rose-500 dark:border-zinc-700 dark:hover:border-rose-800"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">{t({ uk: "Дата народження людини, на яку оформлюється страхування", en: "Date of birth of the person the insurance is issued for" })}</label>
          <DateInput
            value={policyholderBirth}
            onChange={(v) => { setPolicyholderBirth(v); if (phError) setPhError(false); }}
            defaultYear={1990}
            required
            error={phError && !dobOk(policyholderBirth) ? t({ uk: "Вкажіть коректну дату (18–99 років)", en: "Enter a valid date (18–99 years)" }) : undefined}
          />
        </div>

        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {t({ uk: "Ідентифікаційний код людини, на яку оформлюється страхування", en: "Tax ID of the person the insurance is issued for" })}
            <Tooltip
              className="cursor-help text-zinc-400 transition-colors hover:text-indigo-500 dark:text-zinc-500 dark:hover:text-indigo-400"
              content={t({ uk: "Окремі страхові враховують історію страхування за ідентифікаційним кодом — ціна буде точною.", en: "Some insurers use your insurance history by tax ID — the price will be exact." })}
            >
              <Info className="h-3.5 w-3.5" />
            </Tooltip>
          </label>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="1234567890"
            value={ipn}
            onChange={(e) => { setIpn(e.target.value.replace(/\D/g, "").slice(0, 10)); if (ipnError) setIpnError(false); }}
            className={`h-11 w-full rounded-xl border bg-white px-3 text-sm tracking-wider text-zinc-900 outline-none transition-colors focus:border-indigo-400 dark:bg-zinc-900 dark:text-zinc-100 ${
              ipnError ? "border-red-400" : ipnValid ? "border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/40" : "border-zinc-200 dark:border-zinc-700"
            }`}
          />
          {ipnError && (
            <p className="mt-1 text-xs font-medium text-red-500">{t({ uk: "Вкажіть 10 цифр ідентифікаційного коду", en: "Enter the 10-digit tax ID" })}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">{t({ uk: "Дата народження наймолодшого водія", en: "Youngest driver's date of birth" })}</label>
          <DateInput
            value={youngestBirth}
            onChange={(v) => { setYoungestBirth(v); if (ageError) setAgeError(false); }}
            defaultYear={1990}
            required={required}
            error={ageError && !dobOk(youngestBirth) ? t({ uk: "Вкажіть коректну дату (18–99 років)", en: "Enter a valid date (18–99 years)" }) : undefined}
          />
        </div>

        <Button variant="primary" size="md" onClick={handleConfirm} loading={loading} disabled={required && !datesValid} className="w-full">
          {t({ uk: "Застосувати", en: "Apply" })}
        </Button>
      </div>
    </Modal>
  );
}
