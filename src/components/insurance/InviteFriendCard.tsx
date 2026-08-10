"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Gift, ChevronRight, Copy, Check, Loader2 } from "lucide-react";

// Блок «Запрошуй друзів» праворуч від пропозицій (спільний для автоцивілки та
// зеленої карти). За кліком тягне реферальне посилання залогіненого користувача;
// гостю пропонує вхід через Google (без нього нема кому нараховувати бонус).

// ЗАМОРОЖЕНО: тимчасово прибрали картку збоку. Код лишаємо — щоб повернути,
// постав ENABLED = true.
const ENABLED = false;

export function InviteFriendCard() {
  if (!ENABLED) return null;
  return <InviteFriendCardInner />;
}

function InviteFriendCardInner() {
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
      // тимчасовий збій — користувач може спробувати ще раз
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
    <div className="w-full lg:w-72 shrink-0 lg:sticky lg:top-8">
      <div className="rounded-2xl overflow-hidden border border-zinc-100 shadow-sm bg-white">
        {/* Шапка банера */}
        <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-6 text-white">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white/20 mb-4">
            <Gift className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-lg font-bold leading-tight mb-1">Запрошуй друзів — отримуй бонуси</h3>
          <p className="text-sm text-indigo-100 leading-relaxed">
            Діліться своїм посиланням і заробляйте за кожного нового клієнта
          </p>
        </div>

        {/* Кроки */}
        <div className="p-5 flex flex-col gap-4">
          {[
            "Запроси друга за своїм посиланням",
            "Друг оформлює поліс на Volya",
            "Ти отримуєш бонус на рахунок",
          ].map((text, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold">
                {i + 1}
              </div>
              <p className="text-sm text-zinc-600 leading-snug pt-0.5">{text}</p>
            </div>
          ))}

          {refLink ? (
            <div className="mt-2">
              <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white p-1.5">
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
                  {refCopied ? "Готово" : "Копі"}
                </button>
              </div>
              <p className="mt-2 text-center text-xs text-zinc-400">Діліться посиланням — отримуйте 5% з полісів друзів</p>
            </div>
          ) : (
            <button
              onClick={handleGetLink}
              disabled={refLoading}
              className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-indigo-200 disabled:opacity-70"
            >
              {refLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Отримуємо…</>
              ) : (
                <>Отримати посилання <ChevronRight className="h-4 w-4" /></>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
