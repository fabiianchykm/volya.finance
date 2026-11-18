import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { assertSameOrigin } from "@/lib/api-guard";
import { isAdmin } from "@/lib/admin";
import { listDonations, markDonationPaid } from "@/lib/bonus-donation";

async function requireAdmin(): Promise<boolean> {
  const session = await auth().catch(() => null);
  return isAdmin(session?.user?.email);
}

// GET — усі пожертви бонусів (лише адмін).
export async function GET(req: NextRequest) {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;
  if (!(await requireAdmin())) return NextResponse.json({ success: false, error: "Немає доступу" }, { status: 403 });
  return NextResponse.json({ success: true, donations: await listDonations() });
}

// PATCH — { id, paid: boolean } — менеджер переказав гроші фонду (або зняв позначку).
export async function PATCH(req: NextRequest) {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;
  if (!(await requireAdmin())) return NextResponse.json({ success: false, error: "Немає доступу" }, { status: 403 });
  const b = await req.json().catch(() => null);
  const id = String(b?.id ?? "").trim();
  if (!id || typeof b?.paid !== "boolean") return NextResponse.json({ success: false, error: "id та paid обовʼязкові" }, { status: 400 });
  const ok = await markDonationPaid(id, b.paid).catch(() => false);
  return ok ? NextResponse.json({ success: true }) : NextResponse.json({ success: false, error: "Пожертву не знайдено" }, { status: 404 });
}
