"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

// "671234567" → "67 123 45 67" (зберігаємо лише цифри у стані).
function formatUaPhone(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 9);
  return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(" ");
}

interface PhoneModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (phone: string) => void;
  loading?: boolean;
  error?: string | null;
}

// Вводимо 9 цифр після +380 (напр. 671234567). Маска прибирає все зайве.
export function PhoneModal({ open, onClose, onSubmit, loading, error }: PhoneModalProps) {
  const [digits, setDigits] = useState("");

  const valid = digits.length === 9;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (valid) onSubmit(`+380${digits}`);
  };

  return (
    <Modal open={open} onClose={onClose} title="Залиште номер телефону" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-zinc-500">
          КАСКО розраховується індивідуально. Лишіть номер — менеджер передзвонить
          найближчим часом і підбере найкращі умови для вашого авто.
        </p>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-500">
            Номер телефону
          </label>
          <div className="flex items-center rounded-2xl border border-zinc-200 bg-white px-4 shadow-sm transition-all focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100">
            <span className="select-none pr-3 text-xl font-semibold text-zinc-500">+380</span>
            <span className="mr-3 h-7 w-px bg-zinc-200" />
            <input
              type="tel"
              inputMode="numeric"
              autoFocus
              value={formatUaPhone(digits)}
              onChange={(e) => setDigits(e.target.value.replace(/\D/g, "").slice(0, 9))}
              placeholder="67 123 45 67"
              className="w-full bg-transparent py-3.5 text-xl font-semibold tracking-wider text-zinc-900 placeholder:font-normal placeholder:tracking-normal placeholder:text-zinc-300 outline-none"
            />
          </div>
          {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={loading}
          disabled={!valid}
          className="w-full"
        >
          Надіслати заявку
        </Button>

        <p className="text-center text-xs text-zinc-400">
          Натискаючи кнопку, ви погоджуєтесь на обробку персональних даних.
        </p>
      </form>
    </Modal>
  );
}
