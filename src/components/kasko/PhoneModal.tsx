"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Send, MessageCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";

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
  /** Коротка назва авто (напр. «Toyota RAV4, 2021») — підставляємо у стартове повідомлення месенджера. */
  carLabel?: string;
}

// Прямі чати з менеджером — альтернатива дзвінку. Telegram-бот приймає текст із
// параметром start; Viber відкриває чат за номером підтримки (без бота).
const TELEGRAM_URL = "https://t.me/volya_finance_bot";
const VIBER_URL = "viber://chat?number=%2B380965092400";

// Вводимо 9 цифр після +380 (напр. 671234567). Маска прибирає все зайве.
export function PhoneModal({ open, onClose, onSubmit, loading, error, carLabel }: PhoneModalProps) {
  const { t } = useI18n();
  const [digits, setDigits] = useState("");

  const valid = digits.length === 9;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (valid) onSubmit(`+380${digits}`);
  };

  return (
    <Modal open={open} onClose={onClose} title={t({ uk: "Залиште номер телефону", en: "Leave your phone number" })} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {t({ uk: "КАСКО розраховується індивідуально. Лишіть номер — менеджер передзвонить найближчим часом і підбере найкращі умови для вашого авто.", en: "CASCO is calculated individually. Leave your number — a manager will call you back shortly and select the best terms for your car." })}
        </p>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {t({ uk: "Номер телефону", en: "Phone number" })}
          </label>
          <div className="flex items-center rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 shadow-sm transition-all focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-900">
            <span className="select-none pr-3 text-xl font-semibold text-zinc-500 dark:text-zinc-400">+380</span>
            <span className="mr-3 h-7 w-px bg-zinc-200 dark:bg-zinc-700" />
            <input
              type="tel"
              inputMode="numeric"
              aria-label={t({ uk: "Номер телефону", en: "Phone number" })}
              autoFocus
              value={formatUaPhone(digits)}
              onChange={(e) => setDigits(e.target.value.replace(/\D/g, "").slice(0, 9))}
              placeholder="67 123 45 67"
              className="w-full bg-transparent py-3.5 text-xl font-semibold tracking-wider text-zinc-900 dark:text-zinc-100 placeholder:font-normal placeholder:tracking-normal placeholder:text-zinc-300 dark:placeholder:text-zinc-600 outline-none"
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
          {t({ uk: "Надіслати заявку", en: "Submit request" })}
        </Button>

        <p className="text-center text-xs text-zinc-400 dark:text-zinc-500">
          {t({ uk: "Натискаючи кнопку, ви погоджуєтесь на обробку персональних даних.", en: "By clicking the button, you agree to the processing of personal data." })}
        </p>

        {/* Або написати в месенджер — для тих, кому незручно чекати дзвінка */}
        <div className="flex items-center gap-3 pt-1">
          <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
          <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">{t({ uk: "або напишіть нам", en: "or message us" })}</span>
          <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white text-sm font-semibold text-zinc-800 transition-colors hover:border-sky-300 hover:bg-sky-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-sky-950/40"
          >
            <Send className="h-4 w-4 text-sky-500" /> Telegram
          </a>
          <a
            href={VIBER_URL}
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white text-sm font-semibold text-zinc-800 transition-colors hover:border-violet-300 hover:bg-violet-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-violet-950/40"
          >
            <MessageCircle className="h-4 w-4 text-violet-500" /> Viber
          </a>
        </div>
        {carLabel && (
          <p className="text-center text-xs text-zinc-400 dark:text-zinc-500">
            {t({ uk: `Напишіть, що вас цікавить КАСКО для ${carLabel} — і менеджер відповість у чаті.`, en: `Tell us you want CASCO for ${carLabel} — a manager will reply in the chat.` })}
          </p>
        )}
      </form>
    </Modal>
  );
}
