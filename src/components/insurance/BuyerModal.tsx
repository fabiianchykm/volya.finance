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
        <div className="flex items-start gap-3 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 dark:border-indigo-900 dark:bg-indigo-950/40">
          <BadgePercent className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
          <p className="text-sm text-indigo-800 dark:text-indigo-200">
            {t({ uk: "Вкажіть пільгу та дати народження — і отримайте персональну ціну зі знижкою ", en: "Enter your benefit and birth dates to get a personalised price with a discount " })}
            <span className="font-bold">{t({ uk: "до 42%", en: "of up to 42%" })}</span>
            {t({ uk: ". Кожна страхова рахує ціну за віком різної особи.", en: ". Each insurer prices by a different person's age." })}
          </p>
        </div>

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
