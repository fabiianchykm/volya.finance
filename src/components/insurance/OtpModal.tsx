"use client";

import { useState, useRef, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Mail } from "lucide-react";
import { useI18n } from "@/lib/i18n";

// Код приходить латиницею, але клієнт із кириличною розкладкою може ввести
// візуально ІДЕНТИЧНІ кириличні літери (с, а, о, р, х, е…). Конвертуємо такі
// гомогліфи в латиницю, тоді лишаємо лише [A-Z0-9]. Так «С» (кир.) стане «C» (лат.).
const CYR_TO_LAT: Record<string, string> = {
  А: "A", а: "A", В: "B", в: "B", Е: "E", е: "E", Ѕ: "S", ѕ: "S",
  К: "K", к: "K", М: "M", м: "M", Н: "H", н: "H", О: "O", о: "O",
  Р: "P", р: "P", С: "C", с: "C", Т: "T", т: "T", У: "Y", у: "Y",
  Х: "X", х: "X", І: "I", і: "I", Ї: "I", ї: "I", Ј: "J", ј: "J",
};

function normalizeOtp(raw: string): string {
  return raw
    .split("")
    .map((ch) => CYR_TO_LAT[ch] ?? ch)
    .join("")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

interface OtpModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (otp: string) => void;
  onResend: () => void;
  email: string;
  loading?: boolean;
  error?: string | null;
  /** Довжина коду. Зелена карта шле 6 АБО 8 символів → передає minLength=6, maxLength=8.
   *  Коли min≠max — показуємо одне текстове поле (комірки не годяться для змінної довжини). */
  minLength?: number;
  maxLength?: number;
}

export function OtpModal({ open, onClose, onConfirm, onResend, email, loading, error, minLength = 6, maxLength = 6 }: OtpModalProps) {
  const { t } = useI18n();
  const variable = maxLength !== minLength;
  const boxes = minLength; // к-сть комірок у фіксованому режимі
  const [digits, setDigits] = useState<string[]>(() => Array(boxes).fill(""));
  const [code, setCode] = useState(""); // режим змінної довжини (одне поле)
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (open) {
      // Reset only when opening to ensure clean state
      const timer = setTimeout(() => { setDigits(Array(boxes).fill("")); setCode(""); }, 0);
      return () => clearTimeout(timer);
    }
  }, [open, boxes]);

  const handleChange = (i: number, val: string) => {
    const digit = normalizeOtp(val).slice(-1);
    const next = [...digits];
    next[i] = digit;
    setDigits(next);
    if (digit && i < boxes - 1) refs.current[i + 1]?.focus();
    // Авто-підтвердження лише в момент заповнення останньої порожньої комірки,
    // а не на кожне натискання при вже повному коді — інакше кожна правка
    // миттєво ре-сабмітить і з'їдає ліміт спроб (5/10хв).
    const justCompleted =
      next.every((d) => d !== "") &&
      digits.filter((d) => d === "").length === 1 &&
      digits[i] === "";
    if (justCompleted && !loading) {
      onConfirm(next.join(""));
    }
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = normalizeOtp(e.clipboardData.getData("text")).slice(0, boxes);
    if (text.length === boxes) {
      const next = text.split("");
      setDigits(next);
      if (!loading) onConfirm(text);
    }
  };

  const canSubmit = variable ? code.length >= minLength && code.length <= maxLength : digits.every((d) => d !== "");

  return (
    <Modal open={open} onClose={onClose} title={t({ uk: "Підтвердіть email", en: "Confirm email" })} size="sm" preventOutsideClose>
      <div className="space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/40">
            <Mail className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {t({ uk: "Ми надіслали код підтвердження на", en: "We have sent a confirmation code to" })}{" "}
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{email}</span>
          </p>
        </div>

        {variable ? (
          // Змінна довжина (Зелена карта: 6 або 8) — одне поле, без авто-сабміту.
          <div className="space-y-2">
            <input
              type="text"
              inputMode="text"
              autoFocus
              aria-label={t({ uk: "Код підтвердження", en: "Confirmation code" })}
              value={code}
              onChange={(e) => setCode(normalizeOtp(e.target.value).slice(0, maxLength))}
              onKeyDown={(e) => { if (e.key === "Enter" && canSubmit && !loading) onConfirm(code); }}
              placeholder={t({ uk: "Введіть код із листа", en: "Enter the code from the email" })}
              className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 text-center text-xl font-bold tracking-[0.3em] text-zinc-900 outline-none transition-colors focus:border-indigo-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
            <p className="text-center text-xs text-zinc-400 dark:text-zinc-500">
              {t({ uk: `Код складається з ${minLength} або ${maxLength} символів`, en: `The code has ${minLength} or ${maxLength} characters` })}
            </p>
          </div>
        ) : (
          <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { refs.current[i] = el; }}
                type="text"
                inputMode="text"
                aria-label={t({ uk: `Цифра коду ${i + 1}`, en: `Code digit ${i + 1}` })}
                maxLength={1}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={`h-12 w-10 rounded-xl border text-center text-xl font-bold outline-none transition-colors ${
                  d
                    ? "border-indigo-400 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                    : "border-zinc-200 bg-white text-zinc-900 focus:border-indigo-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                }`}
              />
            ))}
          </div>
        )}

        {error && (
          <p className="text-center text-sm font-medium text-red-500">{error}</p>
        )}

        <Button
          variant="primary"
          size="md"
          loading={loading}
          onClick={() => onConfirm(variable ? code : digits.join(""))}
          disabled={!canSubmit || loading}
          className="w-full"
        >
          {t({ uk: "Підтвердити", en: "Confirm" })}
        </Button>

        <p className="text-center text-xs text-zinc-400 dark:text-zinc-500">
          {t({ uk: "Не отримали?", en: "Didn't receive it?" })}{" "}
          <button onClick={onResend} className="text-indigo-600 hover:underline font-medium dark:text-indigo-400">
            {t({ uk: "Надіслати повторно", en: "Resend" })}
          </button>
        </p>
      </div>
    </Modal>
  );
}
