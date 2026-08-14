"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { CheckCircle, ExternalLink, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  orderId: string;
  amount: number;
  onPaid: (contractId: string) => void;
  /** Ендпоінт підтвердження договору. ОСЦПВ — дефолт; Зелена карта передає свій. */
  confirmEndpoint?: string;
  /** action для підтвердження на ендпоінті (за замовч. "confirm"). */
  confirmAction?: string;
  /** Додаткові поля в тіло запиту підтвердження (напр. туристичне — повний payload для nextFinal). */
  confirmPayload?: Record<string, unknown>;
}

export function PaymentModal({ open, onClose, orderId, amount, onPaid, confirmEndpoint = "/api/insurance/contract", confirmAction = "confirm", confirmPayload }: PaymentModalProps) {
  const { t } = useI18n();
  const [invoice, setInvoice] = useState<{ invoiceLink?: string; qrCode?: string; mtsbuLink?: string } | null>(null);
  // testMode приходить із сервера (UKASKO_ENV). Лише в dev дозволено підтверджувати
  // поліс БЕЗ оплати. На проді такого шляху немає — інакше видаємо поліси безкоштовно.
  const [testMode, setTestMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/insurance/payment", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: "invoice", orderId }),
        });
        const json = await res.json();
        setTestMode(json.testMode === true);
        if (json.success && json.data?.invoiceLink) {
          setInvoice(json.data);
        } else {
          // invoiceLink недоступний — показуємо МТСБУ підтвердження
          const mtsbuLink = json.data?.mtsbuCodeLink ?? json.data?.mtsbuLink ?? null;
          setInvoice({ mtsbuLink });
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : t({ uk: "Помилка генерації рахунку", en: "Error generating invoice" }));
      } finally {
        setLoading(false);
      }
    };

    if (!open) { 
      const timer = setTimeout(() => { setInvoice(null); setError(null); setPaid(false); }, 0); 
      return () => clearTimeout(timer);
    }
    
    const initTimer = setTimeout(() => {
      setInvoice(null);
      fetchInvoice();
    }, 0);
    return () => clearTimeout(initTimer);
  }, [open, orderId]);

  const checkPayment = async () => {
    setChecking(true);
    setError(null);
    try {
      for (let i = 0; i < 3; i++) {
        const res = await fetch("/api/insurance/payment", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: "check", orderId }),
        });
        const json = await res.json();
        if (json.success && json.data?.status_id === 2) {
          await confirmPolicy();
          return;
        }
        if (i < 2) await new Promise((r) => setTimeout(r, 2000));
      }
      setError(t({ uk: "Оплата ще не підтверджена. Спробуйте ще раз.", en: "Payment is not confirmed yet. Please try again." }));
    } catch (e) {
      setError(e instanceof Error ? e.message : t({ uk: "Помилка перевірки оплати", en: "Error checking payment" }));
    } finally {
      setChecking(false);
    }
  };

  const confirmPolicy = async () => {
    setConfirming(true);
    try {
      const res = await fetch(confirmEndpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: confirmAction, orderId, ...(confirmPayload ?? {}) }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setPaid(true);
      onPaid(json.data.contractId);
    } catch (e) {
      setError(e instanceof Error ? e.message : t({ uk: "Помилка підтвердження", en: "Confirmation error" }));
    } finally {
      setConfirming(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={t({ uk: "Оплата поліса", en: "Policy payment" })} size="sm" preventOutsideClose>
      <div className="space-y-5">

        {loading && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{t({ uk: "Генеруємо рахунок...", en: "Generating invoice..." })}</p>
          </div>
        )}

        {!loading && paid && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle className="h-12 w-12 text-emerald-500" />
            <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{t({ uk: "Поліс підтверджено!", en: "Policy confirmed!" })}</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{t({ uk: "Договір надіслано на email.", en: "The contract has been sent by email." })}</p>
          </div>
        )}

        {/* LiqPay invoice — якщо є */}
        {!loading && !paid && invoice?.invoiceLink && (
          <>
            <div className="rounded-xl bg-zinc-50 border border-zinc-100 p-4 text-center dark:bg-zinc-800/50 dark:border-zinc-800">
              <p className="text-xs text-zinc-500 mb-1 dark:text-zinc-400">{t({ uk: "Сума до оплати", en: "Amount due" })}</p>
              <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{formatPrice(amount)}</p>
            </div>
            {invoice.qrCode && (
              <div className="flex flex-col items-center gap-2">
                <p className="text-xs text-zinc-400 dark:text-zinc-500">{t({ uk: "Скануйте QR або перейдіть за посиланням", en: "Scan the QR code or follow the link" })}</p>
                <img src={invoice.qrCode} alt={t({ uk: "QR код оплати", en: "Payment QR code" })} className="h-40 w-40 rounded-xl border border-zinc-100 dark:border-zinc-800" />
              </div>
            )}
            <Button variant="primary" size="lg" className="w-full"
              onClick={() => window.open(invoice.invoiceLink, "_blank")}>
              {t({ uk: "Перейти до оплати", en: "Proceed to payment" })}
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="md" className="w-full" loading={checking} onClick={checkPayment}>
              <RefreshCw className="h-4 w-4" />
              {t({ uk: "Я вже оплатив — перевірити", en: "I've already paid — check" })}
            </Button>
          </>
        )}

        {/* DEV-only: invoiceLink недоступний у тесті → дозволяємо підтвердити поліс
            без реальної оплати. На проді цей блок НЕ показується (testMode=false). */}
        {!loading && !paid && testMode && invoice && !invoice.invoiceLink && (
          <>
            <div className="flex flex-col items-center gap-3 text-center py-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/40">
                <ShieldCheck className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{t({ uk: "Поліс зареєстровано в МТСБУ", en: "Policy registered with MTIBU" })}</p>
                <p className="text-sm text-zinc-500 mt-1 dark:text-zinc-400">
                  {t({ uk: "Сума:", en: "Amount:" })} <span className="font-semibold text-zinc-900 dark:text-zinc-100">{formatPrice(amount)}</span>
                </p>
              </div>
            </div>

            {invoice.mtsbuLink && (
              <Button variant="outline" size="md" className="w-full"
                onClick={() => window.open(invoice.mtsbuLink, "_blank")}>
                <ExternalLink className="h-4 w-4" />
                {t({ uk: "Перевірити в реєстрі МТСБУ", en: "Check in the MTIBU registry" })}
              </Button>
            )}

            <Button variant="primary" size="lg" className="w-full"
              loading={confirming} onClick={confirmPolicy}>
              {t({ uk: "Підтвердити поліс", en: "Confirm policy" })}
            </Button>

            <p className="text-center text-xs text-zinc-400 dark:text-zinc-500">
              {t({ uk: "Тест-режим: оплата через LiqPay недоступна в dev-середовищі", en: "Test mode: LiqPay payment is unavailable in the dev environment" })}
            </p>
          </>
        )}

        {/* PROD: рахунок LiqPay не згенерувався → НЕ оформлюємо поліс без оплати.
            Показуємо помилку й контакт підтримки. Поліс лишається несплаченим. */}
        {!loading && !paid && !testMode && invoice && !invoice.invoiceLink && (
          <div className="flex flex-col items-center gap-3 text-center py-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/40">
              <ShieldCheck className="h-7 w-7 text-amber-600" />
            </div>
            <div>
              <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{t({ uk: "Не вдалося сформувати рахунок", en: "Failed to generate invoice" })}</p>
              <p className="text-sm text-zinc-500 mt-1 dark:text-zinc-400">
                {t({ uk: "Сплатити онлайн зараз неможливо. Ваш поліс зарезервовано — звʼяжіться з підтримкою, щоб завершити оплату та оформлення.", en: "Online payment is not possible right now. Your policy is reserved — contact support to complete payment and issuance." })}
              </p>
            </div>
            <a href="tel:+380965092400" className="w-full">
              <Button variant="primary" size="lg" className="w-full">
                {t({ uk: "Звʼязатися з підтримкою", en: "Contact support" })}
              </Button>
            </a>
          </div>
        )}

        {!loading && error && (
          <p className="text-center text-sm text-red-500">{error}</p>
        )}
      </div>
    </Modal>
  );
}
