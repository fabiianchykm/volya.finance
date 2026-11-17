import type { Metadata } from "next";
import { getPoliciesByIdentities } from "@/lib/policies";
import { resolveIdentities, identityKeys } from "@/lib/identity";
import { getSessionIdentity } from "@/lib/session-identity";
import { getReviewsByKeys } from "@/lib/reviews";
import { INSURERS } from "@/lib/insurers";
import { logoSrc, companyLogo } from "@/lib/logos";
import { MyReviews, type MyReview, type PendingInsurer } from "@/components/reviews/MyReviews";

export const metadata: Metadata = {
  title: "Мої відгуки — volya.finance",
  robots: { index: false, follow: false },
};

// Вкладка «Відгуки»: страхові з куплених полісів, про які ще немає відгуку
// (можна лишити тут же), і власні відгуки з редагуванням/видаленням.
export default async function ReviewsPage() {
  const { email, phone } = await getSessionIdentity();
  const ids = await resolveIdentities({ email, phone });
  const keys = identityKeys(ids);

  let reviews: MyReview[] = [];
  const pending: PendingInsurer[] = [];
  try {
    const [policies, mine] = await Promise.all([
      getPoliciesByIdentities(ids.emails, ids.phones),
      getReviewsByKeys(keys),
    ]);
    const bySlug = new Map(INSURERS.map((i) => [i.slug, i]));
    reviews = mine.map((r) => ({
      ...r,
      insurerName: bySlug.get(r.insurer)?.name ?? r.insurer,
      logo: logoSrc(r.insurer),
    }));
    const reviewed = new Set(mine.map((r) => r.insurer));
    const seen = new Set<string>();
    for (const p of policies) {
      if (!p.company) continue;
      const ins = INSURERS.find((i) => i.match.test(p.company!));
      if (!ins || reviewed.has(ins.slug) || seen.has(ins.slug)) continue;
      seen.add(ins.slug);
      pending.push({ slug: ins.slug, name: ins.name, logo: logoSrc(ins.slug) ?? companyLogo(p.company), product: p.product ?? null });
    }
  } catch (e) {
    console.error("[reviews/page] load error:", e instanceof Error ? e.message : e);
  }

  return <MyReviews reviews={reviews} pending={pending} />;
}
