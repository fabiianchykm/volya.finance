import type { Metadata } from "next";
import { T } from "@/components/i18n/T";
import { auth } from "@/auth";
import { getPoliciesByIdentities, type PolicyRecord } from "@/lib/policies";
import { resolveIdentities, primaryEmail } from "@/lib/identity";
import { getReferralSummary, type ReferralSummary } from "@/lib/referral";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PoliciesView } from "@/components/policies/PoliciesView";
import { ReferralCard } from "@/components/referral/ReferralCard";

export const metadata: Metadata = {
  title: "Мої поліси — volya.finance",
  // Приватний кабінет — поза індексом пошукових систем.
  robots: { index: false, follow: false },
};

export default async function PoliciesPage() {
  // auth() кидає, якщо NextAuth не сконфігуровано — не валимо сторінку (як у layout.tsx).
  let email: string | null = null;
  let phone: string | null = null;
  try {
    const session = await auth();
    email = session?.user?.email ?? null;
    const uid = (session?.user as { id?: string } | undefined)?.id ?? "";
    if (uid.startsWith("phone:")) phone = uid.slice("phone:".length);
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    console.error("[policies/page] auth error:", e instanceof Error ? e.message : e);
  }

  const loggedIn = !!email || !!phone;
  let policies: PolicyRecord[] = [];
  let referral: ReferralSummary | null = null;
  if (email || phone) {
    // Рівноправна звʼязка: усі повʼязані email-и/номери → один кабінет.
    const ids = await resolveIdentities({ email, phone });
    try {
      policies = await getPoliciesByIdentities(ids.emails, ids.phones);
    } catch (e) {
      console.error("[policies/page] load error:", e instanceof Error ? e.message : e);
    }
    // Реферальна програма прив'язана до email — беремо повʼязаний email (вхід за
    // номером теж бачить реферальну картку, якщо його акаунт має email).
    const refEmail = primaryEmail(ids, email);
    if (refEmail) {
      try {
        referral = await getReferralSummary(refEmail);
      } catch (e) {
        console.error("[policies/page] referral error:", e instanceof Error ? e.message : e);
      }
    }
  }

  return (
    <>
      <Navbar solid />
      <main className="flex-1 pt-24 pb-16">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <h1 className="mb-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100"><T uk="Мої поліси" en="My policies" /></h1>
          <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400"><T uk="Усі оформлені поліси, привʼязані до вашого акаунта." en="All policies issued and linked to your account." /></p>
          {referral && <ReferralCard summary={referral} />}
          <PoliciesView loggedIn={loggedIn} email={email ?? phone} policies={policies} />
        </div>
      </main>
      <Footer />
    </>
  );
}
