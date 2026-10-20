"use client";

import { useState, useRef, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Mail } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { SupportCTA } from "@/components/ui/SupportCTA";

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
  /** otpDgo — окремий код для підпису договору ДЦВ (ОСЦПВ v2, якщо СК його видала). */
  onConfirm: (otp: string, otpDgo?: string) => void;
  onResend: () => void;
  email: string;
  loading?: boolean;
  error?: string | null;
  /** Довжина коду. Зелена карта шле 6 АБО 8 символів → передає minLength=6, maxLength=8.
   *  Коли min≠max — показуємо одне текстове поле (комірки не годяться для змінної довжини). */
  minLength?: number;
  maxLength?: number;
  /** ОСЦПВ v2 з ДЦВ: СК видала другий код «для підпису ДЦВ» (у тому ж листі) — показуємо
   *  окреме поле. length — к-сть символів (null = невідома; код може містити кирилицю). */
  dgoCode?: { length: number | null } | null;
}

export function OtpModal({ open, onClose, onConfirm, onResend, email, loading, error, minLength = 6, maxLength = 6, dgoCode }: OtpModalProps) {
  const { t } = useI18n();
  const variable = maxLength !== minLength;
  const boxes = minLength; // к-сть комірок у фіксованому режимі
  const [digits, setDigits] = useState<string[]>(() => Array(boxes).fill(""));
  const [code, setCode] = useState(""); // режим змінної довжини (одне поле)
  const [dgo, setDgo] = useState("");   // код ДЦВ (без транслітерації — може бути «ДЦВ666851»)
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  // З кодом ДЦВ авто-сабміт по останній комірці вимкнено — потрібні обидва коди.
  const needDgo = !!dgoCode;
  const dgoOk = !needDgo || (dgoCode?.length ? dgo.length === dgoCode.length : dgo.length >= 4);

  useEffect(() => {
    if (open) {
      // Reset only when opening to ensure clean state
      const timer = setTimeout(() => { setDigits(Array(boxes).fill("")); setCode(""); setDgo(""); }, 0);
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
    if (justCompleted && !loading && !needDgo) {
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
      if (!loading && !needDgo) onConfirm(text);
    }
  };

  const canSubmit = (variable ? code.length >= minLength && code.length <= maxLength : digits.every((d) => d !== "")) && dgoOk;
  const submit = () => onConfirm(variable ? code : digits.join(""), needDgo ? dgo : undefined);

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
              onKeyDown={(e) => { if (e.key === "Enter" && canSubmit && !loading) submit(); }}
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

        {needDgo && (
          <div className="space-y-1.5 rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 dark:border-indigo-900 dark:bg-indigo-950/30">
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300">
              {t({ uk: "Код для підпису договору ДЦВ (з того самого листа)", en: "Code to sign the DGO contract (from the same email)" })}
            </label>
            <input
              type="text"
              inputMode="text"
              aria-label={t({ uk: "Код ДЦВ", en: "DGO code" })}
              value={dgo}
              onChange={(e) => setDgo(e.target.value.replace(/\s/g, "").toUpperCase().slice(0, dgoCode?.length ?? 16))}
              onKeyDown={(e) => { if (e.key === "Enter" && canSubmit && !loading) submit(); }}
              placeholder={t({ uk: "напр. ДЦВ666851", en: "e.g. ДЦВ666851" })}
              className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-center text-base font-bold tracking-[0.2em] text-zinc-900 outline-none transition-colors focus:border-indigo-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
            <p className="text-center text-[11px] text-zinc-400 dark:text-zinc-500">
              {dgoCode?.length
                ? t({ uk: `Код ДЦВ складається з ${dgoCode.length} символів`, en: `The DGO code has ${dgoCode.length} characters` })
                : t({ uk: "Другий рядок у листі: «Код для підпису ДЦВ: …»", en: "Second line in the email: “Code to sign DGO: …”" })}
            </p>
          </div>
        )}

        {error && (
          <div className="text-center">
            <p className="text-sm font-medium text-red-500">{error}</p>
            <SupportCTA className="justify-center" />
          </div>
        )}

        <Button
          variant="primary"
          size="md"
          loading={loading}
          onClick={submit}
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
