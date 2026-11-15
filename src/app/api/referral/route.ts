import { NextRequest, NextResponse } from "next/server";
import { assertSameOrigin } from "@/lib/api-guard";
import { getSessionIdentity } from "@/lib/session-identity";
import { getReferralSummary } from "@/lib/referral";

// Реферальні дані залогіненого користувача — для кнопки «Отримати посилання».
// Гість → { loggedIn: false } (клієнт запропонує вхід).
export async function GET(req: NextRequest) {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;

  const { email, phone } = await getSessionIdentity();
  if (!email && !phone) return NextResponse.json({ loggedIn: false });

  try {
    const s = await getReferralSummary({ email, phone });
    if (!s) return NextResponse.json({ loggedIn: true, available: false });
    return NextResponse.json({
      loggedIn: true,
      available: true,
      code: s.code,
      link: s.link,
      bonusTotal: s.bonusTotal,
      invitedCount: s.invitedCount,
    });
  } catch (e) {
    console.error("[referral] summary error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ loggedIn: true, available: false });
  }
}
