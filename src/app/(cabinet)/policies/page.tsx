import type { Metadata } from "next";
import { getPoliciesByIdentities, type PolicyRecord } from "@/lib/policies";
import { resolveIdentities } from "@/lib/identity";
import { getSessionIdentity } from "@/lib/session-identity";
import { PoliciesView } from "@/components/policies/PoliciesView";

export const metadata: Metadata = {
  title: "Мої поліси — volya.finance",
  // Приватний кабінет — поза індексом пошукових систем.
  robots: { index: false, follow: false },
};

export default async function PoliciesPage() {
  const { email, phone } = await getSessionIdentity();
  const loggedIn = !!email || !!phone;
  let policies: PolicyRecord[] = [];
  if (loggedIn) {
    // Рівноправна звʼязка: усі повʼязані email-и/номери → один кабінет.
    const ids = await resolveIdentities({ email, phone });
    try {
      policies = await getPoliciesByIdentities(ids.emails, ids.phones);
    } catch (e) {
      console.error("[policies/page] load error:", e instanceof Error ? e.message : e);
    }
  }
  return <PoliciesView loggedIn={loggedIn} email={email ?? phone} policies={policies} />;
}
