"use client";

import { useState, useRef, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Mail } from "lucide-react";

interface OtpModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (otp: string) => void;
  onResend: () => void;
  email: string;
  loading?: boolean;
  error?: string | null;
}

export function OtpModal({ open, onClose, onConfirm, onResend, email, loading, error }: OtpModalProps) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (open) {
      // Reset only when opening to ensure clean state
      const timer = setTimeout(() => setDigits(["", "", "", "", "", ""]), 0);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleChange = (i: number, val: string) => {
    const digit = val.replace(/[^a-zA-Z0-9а-яА-ЯіІєЄїЇ]/g, "").slice(-1).toUpperCase();
    const next = [...digits];
    next[i] = digit;
    setDigits(next);
    if (digit && i < 5) refs.current[i + 1]?.focus();
    if (next.every((d) => d !== "")) {
      onConfirm(next.join(""));
    }
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/[^a-zA-Z0-9а-яА-ЯіІєЄїЇ]/g, "").slice(0, 6).toUpperCase();
    if (text.length === 6) {
      const next = text.split("");
      setDigits(next);
      onConfirm(text);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Підтвердіть email" size="sm" preventOutsideClose>
      <div className="space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50">
            <Mail className="h-6 w-6 text-indigo-600" />
          </div>
          <p className="text-sm text-zinc-500">
            Ми надіслали код підтвердження на{" "}
            <span className="font-semibold text-zinc-900">{email}</span>
          </p>
        </div>

        <div className="flex justify-center gap-2" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { refs.current[i] = el; }}
              type="text"
              inputMode="text"
              maxLength={1}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className={`h-12 w-10 rounded-xl border text-center text-xl font-bold outline-none transition-colors ${
                d
                  ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                  : "border-zinc-200 bg-white text-zinc-900 focus:border-indigo-400"
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-center text-sm font-medium text-red-500">{error}</p>
        )}

        <Button
          variant="primary"
          size="md"
          loading={loading}
          onClick={() => onConfirm(digits.join(""))}
          disabled={digits.some((d) => !d)}
          className="w-full"
        >
          Підтвердити
        </Button>

        <p className="text-center text-xs text-zinc-400">
          Не отримали?{" "}
          <button onClick={onResend} className="text-indigo-600 hover:underline font-medium">
            Надіслати повторно
          </button>
        </p>
      </div>
    </Modal>
  );
}
