import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { assertSameOrigin } from "@/lib/api-guard";
import { isAdmin } from "@/lib/admin";
import { getAllPolicies, setPolicyTest } from "@/lib/policies";

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

// PATCH { id, isTest } — позначити/зняти «тестовий» (лише адмін).
export async function PATCH(req: NextRequest) {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;
  const session = await auth().catch(() => null);
  if (!isAdmin(session?.user?.email)) return NextResponse.json({ success: false, error: "Немає доступу" }, { status: 403 });
  const body = await req.json().catch(() => null);
  const id = String(body?.id ?? "").trim();
  if (!id || typeof body?.isTest !== "boolean") return NextResponse.json({ success: false, error: "id та isTest обовʼязкові" }, { status: 400 });
  try {
    const ok = await setPolicyTest(id, body.isTest);
    return ok ? NextResponse.json({ success: true }) : NextResponse.json({ success: false, error: "Поліс не знайдено" }, { status: 404 });
  } catch {
    return NextResponse.json({ success: false, error: "Помилка" }, { status: 500 });
  }
}
