"use client";

import { useState } from "react";
import { BadgePercent } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { PRIVILEGES } from "@/lib/constants";
import { DEFAULT_BUYER, type BuyerData } from "@/types/insurance";

interface BuyerModalProps {
  open: boolean;
  onClose: () => void;
  buyer: BuyerData;
  onConfirm: (buyer: BuyerData) => void;
  loading?: boolean;
}

// "01.01.1990" → "1990-01-01" (для <input type="date">) і навпаки.
function toInputDate(d: string): string {
  const m = d.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
}
function fromInputDate(d: string): string {
  const m = d.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : "";
}

const today = new Date().toISOString().slice(0, 10);

export function BuyerModal({ open, onClose, buyer, onConfirm, loading }: BuyerModalProps) {
  const [privilegeId, setPrivilegeId] = useState(buyer.privilegeId);
  const [birth, setBirth] = useState(toInputDate(buyer.birthDate));
  const [wasOpen, setWasOpen] = useState(false);

  // Засіваємо форму поточними даними в момент відкриття (як у VehicleConfirmModal).
  if (open && !wasOpen) {
    setWasOpen(true);
    setPrivilegeId(buyer.privilegeId);
    setBirth(toInputDate(buyer.birthDate));
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  const handleConfirm = () => {
    const birthDate = fromInputDate(birth) || DEFAULT_BUYER.birthDate;
    onConfirm({
      privilegeId,
      birthDate,
      customerType: privilegeId === 1 ? 1 : 3,
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Дані страхувальника" size="md">
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
          <BadgePercent className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
          <p className="text-sm text-indigo-800">
            Пільга та вік страхувальника впливають на ціну — вкажіть їх, щоб отримати знижку.
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-500">Пільгова категорія</label>
          <select
            value={privilegeId}
            onChange={(e) => setPrivilegeId(Number(e.target.value))}
            className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-indigo-400"
          >
            {PRIVILEGES.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-500">Дата народження</label>
          <input
            type="date"
            value={birth}
            max={today}
            onChange={(e) => setBirth(e.target.value)}
            className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-indigo-400"
          />
        </div>

        <Button variant="primary" size="md" onClick={handleConfirm} loading={loading} className="w-full">
          Застосувати
        </Button>
      </div>
    </Modal>
  );
}
