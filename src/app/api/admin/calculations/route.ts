import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { assertSameOrigin } from "@/lib/api-guard";
import { isAdmin } from "@/lib/admin";
import { getCalcLeads, getCalcStats } from "@/lib/calc-leads";

async function requireAdmin(): Promise<boolean> {
  const session = await auth().catch(() => null);
  return isAdmin(session?.user?.email);
}

// GET — прорахунки на калькуляторі + зведення по продуктах (лише адмін).
export async function GET(req: NextRequest) {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;
  if (!(await requireAdmin())) return NextResponse.json({ success: false, error: "Немає доступу" }, { status: 403 });
  try {
    const [leads, stats] = await Promise.all([getCalcLeads(), getCalcStats()]);
    return NextResponse.json({ success: true, leads, stats });
  } catch {
    return NextResponse.json({ success: false, error: "Помилка" }, { status: 500 });
  }
}
