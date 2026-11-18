"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HeartHandshake, Check } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

// «Пожертвувати на благодійність» біля балансу бонусів: модалка з вибором фонду
// і суми (усі / своя), підтвердження → POST /api/bonus/donate → рахунок
// зменшується, менеджер отримує заявку й переказує гроші фонду.

interface Fund { id: string; name: string; url: string }

export function DonateBonusButton({ available }: { available: number }) {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [min, setMin] = useState(10);
  const [fundId, setFundId] = useState<string>("");
  const [amount, setAmount] = useState<number>(available);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ amount: number; fund: string } | null>(null);

  useEffect(() => {
    if (!open || funds.length) return;
    fetch("/api/bonus/donate").then((r) => r.json()).then((j) => {
      if (j?.success) { setFunds(j.funds); setMin(j.min); if (!fundId && j.funds[0]) setFundId(j.funds[0].id); }
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const canDonate = available >= min;
  const valid = fundId && amount >= min && amount <= available;

  const submit = async () => {
    if (!valid || busy) return;
    setBusy(true); setError(null);
    try {
      const r = await fetch("/api/bonus/donate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ amount, fundId }) });
      const j = await r.json().catch(() => ({}));
      if (!j?.success) throw new Error(j?.error ?? t({ uk: "Не вдалося оформити пожертву", en: "Could not make the donation" }));
      setDone({ amount: j.donation.amount, fund: j.donation.fund });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t({ uk: "Помилка", en: "Error" }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => { setAmount(available); setDone(null); setError(null); setOpen(true); }}
        disabled={!canDonate}
        title={canDonate ? undefined : t({ uk: `Пожертвувати можна від ${min} ₴ бонусів`, en: `Donations start from ${min} ₴ of bonuses` })}
        className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/15 px-3.5 text-xs font-semibold text-white ring-1 ring-white/25 transition-colors hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <HeartHandshake className="h-4 w-4" />
        {t({ uk: "Пожертвувати", en: "Donate" })}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={t({ uk: "Пожертвувати бонуси", en: "Donate bonuses" })} size="md">
        {done ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/40"><Check className="h-7 w-7 text-emerald-600 dark:text-emerald-400" /></span>
            <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{t({ uk: "Дякуємо!", en: "Thank you!" })}</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {t({ uk: `${formatPrice(done.amount)} з вашого бонусного рахунку підуть у фонд «${done.fund}». Ми переказуємо кошти й надсилаємо підтвердження у ваш месенджер.`, en: `${formatPrice(done.amount)} from your bonus account will go to “${done.fund}”. We transfer the funds and send a confirmation to your messenger.` })}
            </p>
            <Button variant="primary" size="md" onClick={() => setOpen(false)}>{t({ uk: "Готово", en: "Done" })}</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              {t({ uk: `Бонуси списуються з вашого рахунку й переказуються обраному фонду — 1 бонус = 1 ₴. Доступно: ${formatPrice(available)}.`, en: `Bonuses are debited from your account and transferred to the fund — 1 bonus = 1 ₴. Available: ${formatPrice(available)}.` })}
            </p>

            <div>
              <p className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">{t({ uk: "Фонд", en: "Fund" })}</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {funds.map((f) => (
                  <button key={f.id} type="button" onClick={() => setFundId(f.id)} aria-pressed={fundId === f.id}
                    className={`flex min-h-11 items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-sm font-medium transition-colors ${
                      fundId === f.id ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:ring-indigo-900" : "border-zinc-200 bg-white text-zinc-700 hover:border-indigo-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                    }`}>
                    {f.name}
                    {fundId === f.id && <Check className="h-4 w-4 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">{t({ uk: "Сума", en: "Amount" })}</p>
              <div className="flex flex-wrap items-center gap-2">
                {[Math.min(available, 50), Math.min(available, 100), Math.min(available, 200)].filter((v, i, a) => v >= min && a.indexOf(v) === i && v !== available).map((v) => (
                  <button key={v} type="button" onClick={() => setAmount(v)} className={`h-10 rounded-xl px-3.5 text-sm font-semibold ring-1 transition-colors ${amount === v ? "bg-indigo-600 text-white ring-indigo-600" : "bg-white text-zinc-700 ring-zinc-200 hover:ring-indigo-300 dark:bg-zinc-900 dark:text-zinc-200 dark:ring-zinc-700"}`}>{v} ₴</button>
                ))}
                <button type="button" onClick={() => setAmount(available)} className={`h-10 rounded-xl px-3.5 text-sm font-semibold ring-1 transition-colors ${amount === available ? "bg-indigo-600 text-white ring-indigo-600" : "bg-white text-zinc-700 ring-zinc-200 hover:ring-indigo-300 dark:bg-zinc-900 dark:text-zinc-200 dark:ring-zinc-700"}`}>{t({ uk: "Усі", en: "All" })} · {available} ₴</button>
                <div className="flex h-10 items-center rounded-xl border border-zinc-200 bg-white pr-3 focus-within:border-indigo-400 dark:border-zinc-700 dark:bg-zinc-900">
                  <input
                    type="text" inputMode="numeric" pattern="[0-9]*" aria-label={t({ uk: "Своя сума", en: "Custom amount" })}
                    value={amount || ""} onFocus={(e) => e.currentTarget.select()}
                    onChange={(e) => setAmount(Math.min(available, Math.max(0, Math.floor(Number(e.target.value.replace(/\D/g, "")) || 0))))}
                    className="h-full w-24 bg-transparent px-3 text-sm font-semibold text-zinc-900 outline-none dark:text-zinc-100"
                  />
                  <span className="text-sm text-zinc-400">₴</span>
                </div>
              </div>
              <p className="mt-1.5 text-xs text-zinc-400 dark:text-zinc-500">{t({ uk: `Від ${min} ₴ до ${available} ₴.`, en: `From ${min} ₴ to ${available} ₴.` })}</p>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button variant="primary" size="lg" className="w-full" loading={busy} disabled={!valid || busy} onClick={submit}>
              <HeartHandshake className="h-4 w-4" />
              {t({ uk: `Пожертвувати ${amount >= min ? formatPrice(amount) : ""}`, en: `Donate ${amount >= min ? formatPrice(amount) : ""}` })}
            </Button>
            <p className="text-center text-xs text-zinc-400 dark:text-zinc-500">{t({ uk: "Пожертву не можна скасувати. Переказ фонду робить наш менеджер протягом 1–2 робочих днів.", en: "A donation cannot be reversed. Our manager transfers the money to the fund within 1–2 business days." })}</p>
          </div>
        )}
      </Modal>
    </>
  );
}
