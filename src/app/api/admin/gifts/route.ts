import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { assertSameOrigin } from "@/lib/api-guard";
import { isAdmin } from "@/lib/admin";
import { listGifts, setGiftStatus, type GiftStatus } from "@/lib/gift";

async function requireAdmin(): Promise<boolean> {
  const session = await auth().catch(() => null);
  return isAdmin(session?.user?.email);
}

// GET — усі заявки/сертифікати (лише адмін).
export async function GET(req: NextRequest) {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;
  if (!(await requireAdmin())) return NextResponse.json({ success: false, error: "Немає доступу" }, { status: 403 });
  return NextResponse.json({ success: true, gifts: await listGifts() });
}

// PATCH — { code, status: requested|paid|redeemed|cancelled, note? }
export async function PATCH(req: NextRequest) {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;
  if (!(await requireAdmin())) return NextResponse.json({ success: false, error: "Немає доступу" }, { status: 403 });
  try {
    const b = await req.json();
    const status = String(b?.status ?? "") as GiftStatus;
    if (!["requested", "paid", "redeemed", "cancelled"].includes(status)) throw new Error("Невірний статус");
    const gift = await setGiftStatus(String(b?.code ?? ""), status, b?.note != null ? String(b.note).slice(0, 300) : null);
    if (!gift) throw new Error("Сертифікат не знайдено");
    return NextResponse.json({ success: true, gift });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Помилка" }, { status: 400 });
  }
}
