import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { assertSameOrigin } from "@/lib/api-guard";
import { isAdmin } from "@/lib/admin";
import { getAllReviews, deleteReview } from "@/lib/reviews";

async function requireAdmin(): Promise<string | null> {
  const session = await auth().catch(() => null);
  const email = session?.user?.email ?? null;
  return isAdmin(email) ? email : null;
}

// GET — усі відгуки (лише адмін).
export async function GET(req: NextRequest) {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;
  if (!(await requireAdmin())) return NextResponse.json({ success: false, error: "Немає доступу" }, { status: 403 });
  try {
    const reviews = await getAllReviews();
    return NextResponse.json({ success: true, reviews });
  } catch {
    return NextResponse.json({ success: false, error: "Помилка" }, { status: 500 });
  }
}

// DELETE ?id= — видалити відгук (лише адмін).
export async function DELETE(req: NextRequest) {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;
  if (!(await requireAdmin())) return NextResponse.json({ success: false, error: "Немає доступу" }, { status: 403 });
  const id = Number(req.nextUrl.searchParams.get("id"));
  if (!id) return NextResponse.json({ success: false, error: "Немає id" }, { status: 400 });
  try {
    const ok = await deleteReview(id);
    return NextResponse.json({ success: ok });
  } catch {
    return NextResponse.json({ success: false, error: "Помилка" }, { status: 500 });
  }
}
