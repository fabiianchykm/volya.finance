import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { assertSameOrigin } from "@/lib/api-guard";
import { isAdmin } from "@/lib/admin";
import { getFunnel } from "@/lib/funnel";

export async function GET(req: NextRequest) {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;
  const session = await auth().catch(() => null);
  if (!isAdmin(session?.user?.email)) return NextResponse.json({ success: false, error: "Немає доступу" }, { status: 403 });
  try {
    const data = await getFunnel();
    return NextResponse.json({ success: true, ...data });
  } catch {
    return NextResponse.json({ success: false, error: "Помилка" }, { status: 500 });
  }
}
