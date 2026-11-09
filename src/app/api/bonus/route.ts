import { NextRequest, NextResponse } from "next/server";
import { assertSameOrigin } from "@/lib/api-guard";
import { auth } from "@/auth";
import { getBonusAvailability } from "@/lib/bonus-redemption";

// Бонусний рахунок залогіненого клієнта для чекауту: скільки можна списати зараз
// (залишок мінус резерви за неоплаченими заявками). Гість → { loggedIn: false }.
export async function GET(req: NextRequest) {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;
  let email: string | null = null;
  try {
    email = (await auth())?.user?.email ?? null;
  } catch {
    // NextAuth не сконфігуровано — гість
  }
  if (!email) return NextResponse.json({ loggedIn: false, available: 0 });
  try {
    const a = await getBonusAvailability(email);
    return NextResponse.json({ loggedIn: true, available: a.available, total: a.total, held: a.held });
  } catch (e) {
    console.error("[bonus] availability error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ loggedIn: true, available: 0 });
  }
}
