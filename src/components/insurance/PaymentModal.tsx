"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { CheckCircle, ExternalLink, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { formatPrice } from "@/lib/utils";

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
}

export function PaymentModal({ open, onClose, orderId, amount, onPaid, confirmEndpoint = "/api/insurance/contract", confirmAction = "confirm" }: PaymentModalProps) {
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
        setError(e instanceof Error ? e.message : "Помилка генерації рахунку");
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
      setError("Оплата ще не підтверджена. Спробуйте ще раз.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Помилка перевірки оплати");
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
        body: JSON.stringify({ action: confirmAction, orderId }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setPaid(true);
      onPaid(json.data.contractId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Помилка підтвердження");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Оплата поліса" size="sm" preventOutsideClose>
      <div className="space-y-5">

        {loading && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            <p className="text-sm text-zinc-500">Генеруємо рахунок...</p>
          </div>
        )}

        {!loading && paid && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle className="h-12 w-12 text-emerald-500" />
            <p className="text-base font-semibold text-zinc-900">Поліс підтверджено!</p>
            <p className="text-sm text-zinc-500">Договір надіслано на email.</p>
          </div>
        )}

        {/* LiqPay invoice — якщо є */}
        {!loading && !paid && invoice?.invoiceLink && (
          <>
            <div className="rounded-xl bg-zinc-50 border border-zinc-100 p-4 text-center">
              <p className="text-xs text-zinc-500 mb-1">Сума до оплати</p>
              <p className="text-3xl font-bold text-zinc-900">{formatPrice(amount)}</p>
            </div>
            {invoice.qrCode && (
              <div className="flex flex-col items-center gap-2">
                <p className="text-xs text-zinc-400">Скануйте QR або перейдіть за посиланням</p>
                <img src={invoice.qrCode} alt="QR код оплати" className="h-40 w-40 rounded-xl border border-zinc-100" />
              </div>
            )}
            <Button variant="primary" size="lg" className="w-full"
              onClick={() => window.open(invoice.invoiceLink, "_blank")}>
              Перейти до оплати
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="md" className="w-full" loading={checking} onClick={checkPayment}>
              <RefreshCw className="h-4 w-4" />
              Я вже оплатив — перевірити
            </Button>
          </>
        )}

        {/* DEV-only: invoiceLink недоступний у тесті → дозволяємо підтвердити поліс
            без реальної оплати. На проді цей блок НЕ показується (testMode=false). */}
        {!loading && !paid && testMode && invoice && !invoice.invoiceLink && (
          <>
            <div className="flex flex-col items-center gap-3 text-center py-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
                <ShieldCheck className="h-7 w-7 text-indigo-600" />
              </div>
              <div>
                <p className="text-base font-semibold text-zinc-900">Поліс зареєстровано в МТСБУ</p>
                <p className="text-sm text-zinc-500 mt-1">
                  Сума: <span className="font-semibold text-zinc-900">{formatPrice(amount)}</span>
                </p>
              </div>
            </div>

            {invoice.mtsbuLink && (
              <Button variant="outline" size="md" className="w-full"
                onClick={() => window.open(invoice.mtsbuLink, "_blank")}>
                <ExternalLink className="h-4 w-4" />
                Перевірити в реєстрі МТСБУ
              </Button>
            )}

            <Button variant="primary" size="lg" className="w-full"
              loading={confirming} onClick={confirmPolicy}>
              Підтвердити поліс
            </Button>

            <p className="text-center text-xs text-zinc-400">
              Тест-режим: оплата через LiqPay недоступна в dev-середовищі
            </p>
          </>
        )}

        {/* PROD: рахунок LiqPay не згенерувався → НЕ оформлюємо поліс без оплати.
            Показуємо помилку й контакт підтримки. Поліс лишається несплаченим. */}
        {!loading && !paid && !testMode && invoice && !invoice.invoiceLink && (
          <div className="flex flex-col items-center gap-3 text-center py-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
              <ShieldCheck className="h-7 w-7 text-amber-600" />
            </div>
            <div>
              <p className="text-base font-semibold text-zinc-900">Не вдалося сформувати рахунок</p>
              <p className="text-sm text-zinc-500 mt-1">
                Сплатити онлайн зараз неможливо. Ваш поліс зарезервовано — звʼяжіться з підтримкою,
                щоб завершити оплату та оформлення.
              </p>
            </div>
            <a href="tel:+380965092400" className="w-full">
              <Button variant="primary" size="lg" className="w-full">
                Звʼязатися з підтримкою
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
