import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { assertSameOrigin } from "@/lib/api-guard";
import { isAdmin } from "@/lib/admin";
import { getAllPolicies } from "@/lib/policies";

// GET — усі поліси (лише адмін).
export async function GET(req: NextRequest) {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;
  const session = await auth().catch(() => null);
  if (!isAdmin(session?.user?.email)) return NextResponse.json({ success: false, error: "Немає доступу" }, { status: 403 });
  try {
    return NextResponse.json({ success: true, policies: await getAllPolicies() });
  } catch {
    return NextResponse.json({ success: false, error: "Помилка" }, { status: 500 });
  }
}
