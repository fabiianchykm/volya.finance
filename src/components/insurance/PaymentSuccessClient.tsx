"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Loader2, Download, ExternalLink, AlertCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n";

// Сторінка, куди LiqPay повертає клієнта після оплати (result_url). Перевіряє
// статус оплати, підтверджує поліс і показує результат. Без неї редирект LiqPay
// вів на 404 — клієнт думав, що оплата не пройшла.

type Phase = "checking" | "confirming" | "done" | "pending" | "error";

export function PaymentSuccessClient() {
  const { t } = useI18n();
  const params = useSearchParams();
  const orderId = params.get("orderId");

  const [phase, setPhase] = useState<Phase>("checking");
  const [contractId, setContractId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return; // StrictMode / повторний рендер — не дублюємо
    ranRef.current = true;
    let cancelled = false;

    (async () => {
      if (!orderId) { setError(t({ uk: "Не вказано замовлення.", en: "No order specified." })); setPhase("error"); return; }

      // LiqPay зараховує оплату не миттєво — опитуємо статус ДОВГО (до ~3 хв) і не
      // зупиняємось на «обробляється»: після ~30 c показуємо його, але продовжуємо
      // тихо перевіряти, тож поліс підтвердиться сам, щойно оплата пройде на боці СК.
      const MAX_ATTEMPTS = 60;   // ~3 хв при 3 c
      const PENDING_AFTER = 10;  // ~30 c → показати «обробляється», але не спинятись
      for (let i = 0; i < MAX_ATTEMPTS && !cancelled; i++) {
        // Продукт-незалежна фіналізація: /api/finalize сам перевіряє оплату,
        // укладає договір правильним для продукту способом і зберігає поліс.
        try {
          const res = await fetch("/api/finalize", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ orderId }),
          });
          const json = await res.json();
          if (json.success && json.paid && json.contractId) {
            if (!cancelled) { setContractId(json.contractId); setPhase("done"); }
            return;
          }
          if (!json.success) throw new Error(json.error ?? t({ uk: "Не вдалося підтвердити поліс", en: "Failed to confirm the policy" }));
        } catch (e) {
          // Помилка укладання (а не «ще не оплачено») — показуємо й зупиняємось.
          if (!cancelled) { setError(e instanceof Error ? e.message : t({ uk: "Сталася помилка", en: "An error occurred" })); setPhase("error"); }
          return;
        }

        // Ще не оплачено: після порогу показуємо «обробляється», але цикл триває.
        if (i + 1 >= PENDING_AFTER && !cancelled) setPhase("pending");
        await new Promise((r) => setTimeout(r, 3000));
      }
      if (!cancelled) setPhase("pending");
    })();

    return () => { cancelled = true; };
  }, [orderId]);

  const downloadPdf = async () => {
    if (!contractId) return;
    setDownloading(true);
    try {
      const res = await fetch("/api/insurance/contract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "download", contractId }),
      });
      const json = await res.json();
      if (json.data?.contract) window.open(json.data.contract, "_blank");
    } catch {
      // тихо — договір також доступний у кабінеті
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 sm:px-6">
      <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-10 text-center shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        {(phase === "checking" || phase === "confirming") && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-500" />
            <div>
              <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {phase === "checking" ? t({ uk: "Перевіряємо оплату…", en: "Verifying payment…" }) : t({ uk: "Оформлюємо поліс…", en: "Issuing the policy…" })}
              </p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t({ uk: "Це займе кілька секунд, не закривайте сторінку.", en: "This will take a few seconds, please do not close the page." })}</p>
            </div>
          </div>
        )}

        {phase === "done" && (
          <div className="flex flex-col items-center gap-4">
            <CheckCircle className="h-14 w-14 text-emerald-500" />
            <div>
              <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{t({ uk: "Оплату отримано, поліс оформлено!", en: "Payment received, policy issued!" })}</p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t({ uk: "Договір надіслано на вашу email-адресу та збережено в кабінеті.", en: "The contract has been sent to your email address and saved in your account." })}</p>
            </div>
            <div className="mt-2 flex w-full flex-col gap-2">
              {contractId && (
                <Button variant="primary" size="lg" loading={downloading} onClick={downloadPdf} className="flex items-center justify-center gap-2">
                  <Download className="h-4 w-4" />
                  {t({ uk: "Завантажити поліс (PDF)", en: "Download policy (PDF)" })}
                </Button>
              )}
              <Link href="/policies">
                <Button variant="outline" size="lg" className="flex w-full items-center justify-center gap-2">
                  <FileText className="h-4 w-4" />
                  {t({ uk: "Мої поліси", en: "My policies" })}
                </Button>
              </Link>
            </div>
          </div>
        )}

        {phase === "pending" && (
          <div className="flex flex-col items-center gap-4">
            <AlertCircle className="h-12 w-12 text-amber-500" />
            <div>
              <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{t({ uk: "Оплата ще обробляється", en: "Payment is still processing" })}</p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {t({ uk: "Якщо ви щойно оплатили, статус може оновитись за хвилину. Оформлений поліс зʼявиться в кабінеті.", en: "If you have just paid, the status may update within a minute. The issued policy will appear in your account." })}
              </p>
            </div>
            <div className="mt-2 flex w-full flex-col gap-2">
              <Button variant="primary" size="lg" onClick={() => window.location.reload()}>
                {t({ uk: "Перевірити ще раз", en: "Check again" })}
              </Button>
              <Link href="/policies">
                <Button variant="outline" size="lg" className="w-full">{t({ uk: "Мої поліси", en: "My policies" })}</Button>
              </Link>
            </div>
          </div>
        )}

        {phase === "error" && (
          <div className="flex flex-col items-center gap-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <div>
              <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{t({ uk: "Не вдалося підтвердити оплату", en: "Failed to confirm payment" })}</p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{error}</p>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                {t({ uk: "Якщо кошти списано — поліс буде оформлено, зверніться до підтримки або перевірте кабінет.", en: "If funds were charged, the policy will be issued — contact support or check your account." })}
              </p>
            </div>
            <div className="mt-2 flex w-full flex-col gap-2">
              <Link href="/policies">
                <Button variant="primary" size="lg" className="w-full">{t({ uk: "Мої поліси", en: "My policies" })}</Button>
              </Link>
              <a href="tel:+380965092400">
                <Button variant="outline" size="lg" className="w-full flex items-center justify-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  {t({ uk: "Звʼязатися з підтримкою", en: "Contact support" })}
                </Button>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
