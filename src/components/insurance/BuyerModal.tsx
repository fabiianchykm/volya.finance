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
}

export function BuyerModal({ open, onClose, buyer, onConfirm, loading }: BuyerModalProps) {
  const { t } = useI18n();
  const [privilegeId, setPrivilegeId] = useState(buyer.privilegeId);
  // Дати з попереднього кроку (VehicleConfirmModal) — підтягуємо й даємо редагувати:
  // різні СК рахують ціну за віком різної особи (osago-age-basis).
  const [policyholderBirth, setPolicyholderBirth] = useState(buyer.policyholderBirthDate ?? "");
  const [youngestBirth, setYoungestBirth] = useState(buyer.youngestBirthDate ?? "");
  const [wasOpen, setWasOpen] = useState(false);

  // Засіваємо форму поточними даними в момент відкриття (як у VehicleConfirmModal).
  if (open && !wasOpen) {
    setWasOpen(true);
    setPrivilegeId(buyer.privilegeId);
    setPolicyholderBirth(buyer.policyholderBirthDate ?? "");
    setYoungestBirth(buyer.youngestBirthDate ?? "");
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  const handleConfirm = () => {
    onConfirm({
      ...buyer,
      privilegeId,
      customerType: privilegeId === 1 ? 1 : 3,
      policyholderBirthDate: parseUaDate(policyholderBirth) ? policyholderBirth : "",
      youngestBirthDate: parseUaDate(youngestBirth) ? youngestBirth : "",
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={t({ uk: "Індивідуальна пропозиція", en: "Personalised offer" })} size="md">
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
          <DateInput value={policyholderBirth} onChange={setPolicyholderBirth} defaultYear={1990} />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">{t({ uk: "Дата народження наймолодшого водія", en: "Youngest driver's date of birth" })}</label>
          <DateInput value={youngestBirth} onChange={setYoungestBirth} defaultYear={1990} />
        </div>

        <Button variant="primary" size="md" onClick={handleConfirm} loading={loading} className="w-full">
          {t({ uk: "Застосувати", en: "Apply" })}
        </Button>
      </div>
    </Modal>
  );
}
