"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Gift, ChevronRight, Copy, Check, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

// Широкий банер реферальної програми для маркетингового блоку (головна + продукти).
// За кліком тягне реферальне посилання залогіненого користувача; гостю пропонує
// вхід через Google (без нього нема кому нараховувати бонус). Логіка — як у
// InviteFriendCard (сайдбар пропозицій), лише в горизонтальному банер-форматі.
export function ReferralBanner() {
  const { t } = useI18n();
  const [refLink, setRefLink] = useState<string | null>(null);
  const [refLoading, setRefLoading] = useState(false);
  const [refCopied, setRefCopied] = useState(false);

  const handleGetLink = async () => {
    if (refLink || refLoading) return;
    setRefLoading(true);
    try {
      const res = await fetch("/api/referral");
      const data = await res.json();
      if (data.loggedIn && data.available) setRefLink(data.link);
      else if (!data.loggedIn) signIn("google");
    } catch {
      // тимчасовий збій — можна спробувати ще раз
    } finally {
      setRefLoading(false);
    }
  };

  const copyRefLink = async () => {
    if (!refLink) return;
    try {
      await navigator.clipboard.writeText(refLink);
      setRefCopied(true);
      setTimeout(() => setRefCopied(false), 2000);
    } catch {
      // clipboard недоступний
    }
  };

  return (
    <section className="bg-[#FAFAFA] dark:bg-[#0f0f11] py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-600 p-8 shadow-xl shadow-indigo-500/10 sm:p-10">
          <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 h-52 w-52 rounded-full bg-white/5 blur-2xl" />

          <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20">
                <Gift className="h-7 w-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold leading-tight text-white sm:text-3xl">
                  {t({ uk: "Запрошуй друзів — отримуй 5% бонус", en: "Invite friends — get a 5% bonus" })}
                </h2>
                <p className="mt-1.5 max-w-xl text-[15px] leading-relaxed text-indigo-100">
                  {t({ uk: "Ділися своїм посиланням: друг оформлює поліс — ти отримуєш 5% від його вартості на рахунок.", en: "Share your link: a friend buys a policy — you receive 5% of its value to your account." })}
                </p>
              </div>
            </div>

            <div className="w-full shrink-0 sm:w-auto">
              {refLink ? (
                <div className="flex items-center gap-2 rounded-xl bg-white p-1.5 sm:w-80">
                  <input
                    readOnly
                    value={refLink}
                    onFocus={(e) => e.currentTarget.select()}
                    className="w-full bg-transparent px-2 text-xs text-zinc-600 outline-none"
                  />
                  <button
                    type="button"
                    onClick={copyRefLink}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                  >
                    {refCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {refCopied ? t({ uk: "Готово", en: "Done" }) : t({ uk: "Копіювати", en: "Copy" })}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleGetLink}
                  disabled={refLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-indigo-700 shadow-sm transition-all hover:bg-indigo-50 active:scale-[0.98] disabled:opacity-70 sm:w-auto"
                >
                  {refLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> {t({ uk: "Отримуємо…", en: "Getting it…" })}</>
                  ) : (
                    <>{t({ uk: "Отримати посилання", en: "Get link" })} <ChevronRight className="h-4 w-4" /></>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
