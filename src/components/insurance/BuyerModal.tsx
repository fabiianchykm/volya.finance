"use client";

import { useState } from "react";
import { BadgePercent, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
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
  // Дати з попереднього кроку (VehicleConfirmModal) — підтягуємо й даємо редагувати:
  // різні СК рахують ціну за віком різної особи (osago-age-basis).
  const [policyholderBirth, setPolicyholderBirth] = useState(buyer.policyholderBirthDate ?? "");
  const [youngestBirth, setYoungestBirth] = useState(buyer.youngestBirthDate ?? "");
  const [ageError, setAgeError] = useState(false);
  const [wasOpen, setWasOpen] = useState(false);

  // Засіваємо форму поточними даними в момент відкриття (як у VehicleConfirmModal).
  if (open && !wasOpen) {
    setWasOpen(true);
    setPrivilegeId(buyer.privilegeId);
    setPolicyholderBirth(buyer.policyholderBirthDate ?? "");
    setYoungestBirth(buyer.youngestBirthDate ?? "");
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
  const datesValid = dobOk(policyholderBirth) && dobOk(youngestBirth);

  const handleConfirm = () => {
    if (required && !datesValid) { setAgeError(true); return; }
    onConfirm({
      ...buyer,
      privilegeId,
      customerType: privilegeId === 1 ? 1 : 3,
      policyholderBirthDate: parseUaDate(policyholderBirth) ? policyholderBirth : "",
      youngestBirthDate: parseUaDate(youngestBirth) ? youngestBirth : "",
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
                    uk: "Вкажіть дати народження страхувальника й наймолодшого водія. Кожна страхова рахує ціну за віком різної особи — тож саме ці дані відкривають найвигіднішу пропозицію для вас.",
                    en: "Enter the birth dates of the policyholder and youngest driver. Each insurer prices by a different person's age — so these details unlock the best offer for you.",
                  })
                : t({
                    uk: "Заповніть пільгу та дати народження страхувальника й наймолодшого водія. Кожна страхова рахує ціну за віком різної особи — тож саме ці дані відкривають найвигіднішу пропозицію для вас.",
                    en: "Fill in your benefit and the birth dates of the policyholder and youngest driver. Each insurer prices by a different person's age — so these details unlock the best offer for you.",
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
          <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">{t({ uk: "Дата народження страхувальника", en: "Policyholder's date of birth" })}</label>
          <DateInput
            value={policyholderBirth}
            onChange={(v) => { setPolicyholderBirth(v); if (ageError) setAgeError(false); }}
            defaultYear={1990}
            required={required}
            error={ageError && !dobOk(policyholderBirth) ? t({ uk: "Вкажіть коректну дату (18–99 років)", en: "Enter a valid date (18–99 years)" }) : undefined}
          />
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
