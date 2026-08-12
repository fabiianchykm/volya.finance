import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { assertSameOrigin } from "@/lib/api-guard";
import { isAdmin } from "@/lib/admin";
import { getLeads, updateLeadStatus, deleteLead, type LeadStatus } from "@/lib/leads";

async function requireAdmin(): Promise<boolean> {
  const session = await auth().catch(() => null);
  return isAdmin(session?.user?.email);
}

const VALID_STATUS = ["new", "called", "converted", "lost"];

// GET — усі ліди (лише адмін).
export async function GET(req: NextRequest) {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;
  if (!(await requireAdmin())) return NextResponse.json({ success: false, error: "Немає доступу" }, { status: 403 });
  try {
    return NextResponse.json({ success: true, leads: await getLeads() });
  } catch {
    return NextResponse.json({ success: false, error: "Помилка" }, { status: 500 });
  }
}

// PATCH — оновити статус ліда.
export async function PATCH(req: NextRequest) {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;
  if (!(await requireAdmin())) return NextResponse.json({ success: false, error: "Немає доступу" }, { status: 403 });
  const body = await req.json().catch(() => null);
  const id = Number(body?.id);
  const status = String(body?.status ?? "");
  if (!id || !VALID_STATUS.includes(status)) {
    return NextResponse.json({ success: false, error: "Некоректні дані" }, { status: 400 });
  }
  try {
    await updateLeadStatus(id, status as LeadStatus);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Помилка" }, { status: 500 });
  }
}

// DELETE ?id= — видалити лід.
export async function DELETE(req: NextRequest) {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;
  if (!(await requireAdmin())) return NextResponse.json({ success: false, error: "Немає доступу" }, { status: 403 });
  const id = Number(req.nextUrl.searchParams.get("id"));
  if (!id) return NextResponse.json({ success: false, error: "Немає id" }, { status: 400 });
  try {
    await deleteLead(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Помилка" }, { status: 500 });
  }
}
