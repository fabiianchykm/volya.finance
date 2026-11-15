import type { Metadata } from "next";
import { getReferralSummary, type ReferralSummary } from "@/lib/referral";
import { getSessionIdentity } from "@/lib/session-identity";
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
  if (who.email || who.phone) {
    try {
      referral = await getReferralSummary(who);
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
  return <ReferralCard summary={referral} />;
}
