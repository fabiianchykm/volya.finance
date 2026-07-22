"use client";

import { useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
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
        setError(json.error ?? "Не вдалося надіслати код. Спробуйте ще раз.");
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
      setError(`Не вдалося надіслати код${code ? ` (${code})` : ""}. Спробуйте ще раз.`);
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
        setError("Невірний або протермінований код.");
      }
    } catch {
      setError("Невірний код. Спробуйте ще раз.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {step === "phone" ? (
        <form onSubmit={sendCode} className="space-y-3">
          <div className="flex items-center rounded-2xl border border-zinc-200 bg-white px-4 shadow-sm transition-all focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100">
            <span className="select-none pr-3 text-xl font-semibold text-zinc-500">+380</span>
            <span className="mr-3 h-7 w-px bg-zinc-200" />
            <input
              type="tel"
              inputMode="numeric"
              autoFocus
              placeholder="67 123 45 67"
              value={formatUaPhone(phone)}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 9))}
              className="w-full bg-transparent py-3.5 text-xl font-semibold tracking-wider text-zinc-900 placeholder:font-normal placeholder:tracking-normal placeholder:text-zinc-300 outline-none"
            />
          </div>
          {error && <p className="text-sm font-medium text-red-500">{error}</p>}
          <Button type="submit" variant="primary" size="lg" loading={loading} disabled={phoneDigits.length !== 9 || loading} className="w-full rounded-2xl">
            Отримати код
          </Button>
        </form>
      ) : (
        <form onSubmit={verify} className="space-y-3">
          <p className="flex items-start gap-2 text-sm text-zinc-500">
            <Send className={`mt-0.5 h-4 w-4 shrink-0 ${channel === "sms" ? "text-emerald-500" : "text-sky-500"}`} />
            <span>
              Код надіслано {channel === "sms" ? "по SMS" : "в Telegram"} на{" "}
              <span className="font-medium text-zinc-700">+380 {formatUaPhone(phone)}</span>. Введіть його:
            </span>
          </p>
          <input
            type="text"
            inputMode="numeric"
            autoFocus
            maxLength={6}
            placeholder="••••••"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="h-14 w-full rounded-2xl border border-zinc-200 bg-white text-center text-2xl font-bold tracking-[0.5em] text-zinc-900 shadow-sm outline-none transition-all placeholder:text-zinc-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
          {error && <p className="text-sm font-medium text-red-500">{error}</p>}
          <Button type="submit" variant="primary" size="lg" loading={loading} disabled={code.length !== 6 || loading} className="w-full rounded-2xl">
            Підтвердити
          </Button>
          <button type="button" onClick={() => { setStep("phone"); setCode(""); setError(null); }} className="w-full text-center text-xs text-indigo-600 hover:underline">
            Змінити номер
          </button>
        </form>
      )}
      {/* Контейнер для invisible reCAPTCHA (Firebase SMS). */}
      <div id="recaptcha-container" />
    </>
  );
}
