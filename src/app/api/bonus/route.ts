import { NextRequest, NextResponse } from "next/server";
import { assertSameOrigin } from "@/lib/api-guard";
import { getSessionIdentity } from "@/lib/session-identity";
import { getBonusAvailability } from "@/lib/bonus-redemption";

// Бонусний рахунок залогіненого клієнта для чекауту: скільки можна списати зараз
// (залишок мінус резерви за неоплаченими заявками). Гість → { loggedIn: false }.
// Вхід за номером телефону — так само повноцінний (ключ phone:+380… + звʼязки).
export async function GET(req: NextRequest) {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;
  const { email, phone } = await getSessionIdentity();
  if (!email && !phone) return NextResponse.json({ loggedIn: false, available: 0 });
  try {
    const a = await getBonusAvailability({ email, phone });
    return NextResponse.json({ loggedIn: true, available: a.available, total: a.total, held: a.held });
  } catch (e) {
    console.error("[bonus] availability error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ loggedIn: true, available: 0 });
  }
}
