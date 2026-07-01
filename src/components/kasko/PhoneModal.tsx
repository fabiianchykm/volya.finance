"use client";

import { useState } from "react";
import { Phone } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

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
          <div className="flex items-center rounded-xl border border-zinc-200 bg-white transition-colors focus-within:border-indigo-400">
            <span className="flex items-center gap-1.5 border-r border-zinc-200 pl-3.5 pr-3 text-sm font-medium text-zinc-500">
              <Phone className="h-4 w-4 text-zinc-400" />
              +380
            </span>
            <input
              type="tel"
              inputMode="numeric"
              autoFocus
              value={digits}
              onChange={(e) => setDigits(e.target.value.replace(/\D/g, "").slice(0, 9))}
              placeholder="67 123 45 67"
              className="w-full bg-transparent px-3.5 py-2.5 text-sm tracking-wide text-zinc-900 placeholder:text-zinc-400 outline-none"
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
