import { NextRequest, NextResponse } from "next/server";
import { assertSameOrigin } from "@/lib/api-guard";
import { getReviewSummaries, type ReviewSummaryMap } from "@/lib/reviews";

// GET — середня оцінка й кількість відгуків по кожній страховій (для карток пропозицій).
// Публічно, кеш у памʼяті 5 хв.
let memo: { at: number; data: ReviewSummaryMap } | null = null;

export async function GET(req: NextRequest) {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;
  try {
    if (!memo || Date.now() - memo.at > 5 * 60 * 1000) memo = { at: Date.now(), data: await getReviewSummaries() };
    return NextResponse.json({ success: true, ratings: memo.data }, { headers: { "Cache-Control": "public, max-age=300" } });
  } catch {
    return NextResponse.json({ success: true, ratings: {} });
  }
}
