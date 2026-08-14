"use client";

import { useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n";
import { getFirebaseAuth } from "@/lib/firebase-client";
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from "firebase/auth";

// Вхід за номером телефону. Код доставляється:
//   • Telegram (Gateway) — якщо номер є в Telegram (наш код, перевірка на сервері);
//   • SMS (Firebase Phone Auth) — якщо номера немає в Telegram (код Firebase).
// Для клієнта екран однаковий; канал визначає /api/phone (checkSendAbility).

function formatUaPhone(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 9);
  return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(" ");
}

export function PhoneLogin() {
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [channel, setChannel] = useState<"telegram" | "sms">("telegram");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);
  const { t } = useI18n();

  const phoneDigits = phone.replace(/\D/g, "");

  // Надсилає SMS через Firebase (reCAPTCHA invisible + signInWithPhoneNumber).
  const sendFirebaseSms = async () => {
    const auth = getFirebaseAuth();
    if (!recaptchaRef.current) {
      recaptchaRef.current = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
    }
    confirmationRef.current = await signInWithPhoneNumber(auth, `+380${phoneDigits}`, recaptchaRef.current);
  };

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneDigits.length !== 9 || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/phone", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone: `380${phoneDigits}` }),
      });
      const json = await res.json().catch(() => ({}));
      if (!json.success) {
        setError(json.error ?? t({ uk: "Не вдалося надіслати код. Спробуйте ще раз.", en: "Could not send the code. Please try again." }));
        return;
      }
      if (json.channel === "sms") {
        await sendFirebaseSms();
        setChannel("sms");
      } else {
        setChannel("telegram");
      }
      setStep("code");
    } catch (err) {
      const code = (err as { code?: string })?.code ?? "";
      console.error("[phone-login] send failed:", code, err instanceof Error ? err.message : err);
      setError(`${t({ uk: "Не вдалося надіслати код", en: "Could not send the code" })}${code ? ` (${code})` : ""}${t({ uk: ". Спробуйте ще раз.", en: ". Please try again." })}`);
    } finally {
      setLoading(false);
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6 || loading) return;
    setLoading(true);
    setError(null);
    try {
      let res;
      if (channel === "sms") {
        if (!confirmationRef.current) throw new Error("no-confirmation");
        const cred = await confirmationRef.current.confirm(code);
        const idToken = await cred.user.getIdToken();
        res = await signIn("firebase-phone", { idToken, redirect: false });
      } else {
        res = await signIn("phone", { phone: `380${phoneDigits}`, code, redirect: false });
      }
      if (res?.ok && !res.error) {
        window.location.reload();
      } else {
        setError(t({ uk: "Невірний або протермінований код.", en: "Invalid or expired code." }));
      }
    } catch {
      setError(t({ uk: "Невірний код. Спробуйте ще раз.", en: "Invalid code. Please try again." }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {step === "phone" ? (
        <form onSubmit={sendCode} className="space-y-3">
          <div className="flex items-center rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 shadow-sm transition-all focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-900">
            <span className="select-none pr-3 text-xl font-semibold text-zinc-500 dark:text-zinc-400">+380</span>
            <span className="mr-3 h-7 w-px bg-zinc-200 dark:bg-zinc-700" />
            <input
              type="tel"
              inputMode="numeric"
              autoFocus
              aria-label={t({ uk: "Номер телефону", en: "Phone number" })}
              placeholder="67 123 45 67"
              value={formatUaPhone(phone)}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 9))}
              className="w-full bg-transparent py-3.5 text-xl font-semibold tracking-wider text-zinc-900 dark:text-zinc-100 placeholder:font-normal placeholder:tracking-normal placeholder:text-zinc-300 dark:placeholder:text-zinc-600 outline-none"
            />
          </div>
          {error && <p className="text-sm font-medium text-red-500">{error}</p>}
          <Button type="submit" variant="primary" size="lg" loading={loading} disabled={phoneDigits.length !== 9 || loading} className="w-full rounded-2xl">
            {t({ uk: "Отримати код", en: "Get code" })}
          </Button>
        </form>
      ) : (
        <form onSubmit={verify} className="space-y-3">
          <p className="flex items-start gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            <Send className={`mt-0.5 h-4 w-4 shrink-0 ${channel === "sms" ? "text-emerald-500" : "text-sky-500"}`} />
            <span>
              {t({ uk: "Код надіслано", en: "Code sent" })} {channel === "sms" ? t({ uk: "по SMS", en: "via SMS" }) : t({ uk: "в Telegram", en: "on Telegram" })} {t({ uk: "на", en: "to" })}{" "}
              <span className="font-medium text-zinc-700 dark:text-zinc-200">+380 {formatUaPhone(phone)}</span>. {t({ uk: "Введіть його:", en: "Enter it:" })}
            </span>
          </p>
          <input
            type="text"
            inputMode="numeric"
            autoFocus
            maxLength={6}
            aria-label={t({ uk: "Код підтвердження", en: "Confirmation code" })}
            placeholder="••••••"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="h-14 w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-center text-2xl font-bold tracking-[0.5em] text-zinc-900 dark:text-zinc-100 shadow-sm outline-none transition-all placeholder:text-zinc-300 dark:placeholder:text-zinc-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900"
          />
          {error && <p className="text-sm font-medium text-red-500">{error}</p>}
          <Button type="submit" variant="primary" size="lg" loading={loading} disabled={code.length !== 6 || loading} className="w-full rounded-2xl">
            {t({ uk: "Підтвердити", en: "Confirm" })}
          </Button>
          <button type="button" onClick={() => { setStep("phone"); setCode(""); setError(null); }} className="w-full text-center text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
            {t({ uk: "Змінити номер", en: "Change number" })}
          </button>
        </form>
      )}
      {/* Контейнер для invisible reCAPTCHA (Firebase SMS). */}
      <div id="recaptcha-container" />
    </>
  );
}
