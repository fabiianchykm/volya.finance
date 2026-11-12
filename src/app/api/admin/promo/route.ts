import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { assertSameOrigin } from "@/lib/api-guard";
import { isAdmin } from "@/lib/admin";
import { listPromoCodes, upsertPromoCode, setPromoActive, type PromoKind, type PromoProduct } from "@/lib/promo";

async function requireAdmin(): Promise<boolean> {
  const session = await auth().catch(() => null);
  return isAdmin(session?.user?.email);
}

// GET — список промокодів (лише адмін).
export async function GET(req: NextRequest) {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;
  if (!(await requireAdmin())) return NextResponse.json({ success: false, error: "Немає доступу" }, { status: 403 });
  return NextResponse.json({ success: true, codes: await listPromoCodes() });
}

// POST — створити/оновити код: { code, kind: percent|amount, value, product?, maxDiscount?, validUntil?, maxUses?, note? }
export async function POST(req: NextRequest) {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;
  if (!(await requireAdmin())) return NextResponse.json({ success: false, error: "Немає доступу" }, { status: 403 });
  try {
    const b = await req.json();
    const kind: PromoKind = b?.kind === "amount" ? "amount" : "percent";
    const product: PromoProduct = ["all", "osago", "tourism", "greencard"].includes(b?.product) ? b.product : "all";
    const promo = await upsertPromoCode({
      code: String(b?.code ?? ""), kind, value: Number(b?.value) || 0, product,
      maxDiscount: b?.maxDiscount != null && Number(b.maxDiscount) > 0 ? Number(b.maxDiscount) : null,
      validFrom: b?.validFrom ? String(b.validFrom) : null,
      validUntil: b?.validUntil ? String(b.validUntil) : null,
      maxUses: b?.maxUses != null && Number(b.maxUses) > 0 ? Math.floor(Number(b.maxUses)) : null,
      active: b?.active !== false, note: b?.note ? String(b.note).slice(0, 200) : null,
    });
    return NextResponse.json({ success: true, promo });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Помилка" }, { status: 400 });
  }
}

// PATCH — увімкнути/вимкнути: { code, active }
export async function PATCH(req: NextRequest) {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;
  if (!(await requireAdmin())) return NextResponse.json({ success: false, error: "Немає доступу" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  if (!b?.code) return NextResponse.json({ success: false, error: "code обовʼязковий" }, { status: 400 });
  await setPromoActive(String(b.code), b.active !== false);
  return NextResponse.json({ success: true });
}
