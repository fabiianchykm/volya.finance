import type { Metadata } from "next";
import { getReferralSummary, type ReferralSummary } from "@/lib/referral";
import { getSessionIdentity } from "@/lib/session-identity";
import { resolveLoginIdentities } from "@/lib/identity";
import Link from "next/link";
import { ReferralCard } from "@/components/referral/ReferralCard";
import { T } from "@/components/i18n/T";

export const metadata: Metadata = {
  title: "Бонуси — volya.finance",
  // Приватний кабінет — поза індексом пошукових систем.
  robots: { index: false, follow: false },
};

// Вкладка «Бонуси»: єдиний бонусний рахунок (1% з покупок + 5% з рефералів),
// реферальне посилання, історія нарахувань. Один і той самий для входу за
// номером і через Google (звʼязка ідентичностей, див. lib/identity.ts).
export default async function BonusPage() {
  const who = await getSessionIdentity();
  let referral: ReferralSummary | null = null;
  // Чи є у людини обидва способи входу (Google і телефон). Якщо лише один —
  // підказуємо привʼязати другий: бонуси з іншого входу інакше «не видно».
  let singleLogin = false;
  if (who.email || who.phone) {
    try {
      const [summary, ids] = await Promise.all([getReferralSummary(who), resolveLoginIdentities(who)]);
      referral = summary;
      singleLogin = ids.emails.length === 0 || ids.phones.length === 0;
    } catch (e) {
      console.error("[bonus/page] referral error:", e instanceof Error ? e.message : e);
    }
  }
  if (!referral) {
    return (
      <p className="rounded-2xl border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        <T uk="Бонусний рахунок тимчасово недоступний. Спробуйте оновити сторінку." en="The bonus account is temporarily unavailable. Please refresh the page." />
      </p>
    );
  }
  return (
    <div className="space-y-4">
      <ReferralCard summary={referral} />
      {singleLogin && (
        <p className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
          {who.email ? (
            <T uk="Входили раніше за номером телефону? Привʼяжіть його, щоб бонуси та поліси з обох входів були разом: " en="Signed in by phone before? Link it so bonuses and policies from both logins are together: " />
          ) : (
            <T uk="Входили раніше через Google? Привʼяжіть Google-акаунт, щоб бонуси та поліси з обох входів були разом: " en="Signed in with Google before? Link your Google account so bonuses and policies from both logins are together: " />
          )}
          <Link href="/profile" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
            <T uk="Налаштування → Способи входу" en="Settings → Sign-in methods" />
          </Link>
        </p>
      )}
    </div>
  );
}
