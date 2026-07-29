import { NextRequest, NextResponse } from "next/server";
import { guardRequest, assertSameOrigin } from "@/lib/api-guard";
import { auth } from "@/auth";
import { savePolicy, deletePolicy } from "@/lib/policies";

// Наявний поліс (куплений деінде), доданий клієнтом у кабінет вручну.
// POST — додати; DELETE — прибрати. Лише для залогіненого користувача.

// Власник запиту з сесії: email (Google) або телефон (вхід за номером,
// session.user.id = "phone:+380…").
async function sessionOwner(): Promise<{ email: string | null; phone: string | null }> {
  const session = await auth();
  const email = session?.user?.email ?? null;
  const uid = (session?.user as { id?: string } | undefined)?.id ?? "";
  const phone = uid.startsWith("phone:") ? uid.slice("phone:".length) : null;
  return { email, phone };
}

const PRODUCTS = new Set(["osago", "kasko", "greencard", "tourism", "other"]);

export async function POST(req: NextRequest) {
  const blocked = guardRequest(req, { name: "policies-manual", limit: 20, windowMs: 10 * 60 * 1000 });
  if (blocked) return blocked;

  const { email, phone } = await sessionOwner();
  if (!email && !phone) return NextResponse.json({ success: false, error: "Не авторизовано" }, { status: 401 });

  try {
    const b = await req.json();
    const product = PRODUCTS.has(String(b?.product)) ? String(b.product) : "other";
    const company = b?.company ? String(b.company).trim().slice(0, 120) : null;
    const policyNumber = b?.policyNumber ? String(b.policyNumber).trim().slice(0, 60) : null;
    const startDate = b?.startDate ? String(b.startDate).trim().slice(0, 20) : null;
    const endDate = b?.endDate ? String(b.endDate).trim().slice(0, 20) : null;
    const price = typeof b?.price === "number" && b.price >= 0 ? b.price : null;
    const vehicle = {
      mark: b?.vehicle?.mark ? String(b.vehicle.mark).trim().slice(0, 60) : undefined,
      model: b?.vehicle?.model ? String(b.vehicle.model).trim().slice(0, 60) : undefined,
      plate: b?.vehicle?.plate ? String(b.vehicle.plate).trim().toUpperCase().slice(0, 15) : undefined,
    };

    if (!policyNumber && !company) {
      return NextResponse.json({ success: false, error: "Вкажіть номер полісу або страхову компанію" }, { status: 400 });
    }

    // Власник: email (Google) або телефон. Для phone-логіну — email-заглушка,
    // щоб NOT NULL колонка була заповнена; пошук усе одно йде за phone.
    const ownerEmail = email ?? `${phone}@phone.local`;

    await savePolicy({
      id: `manual-${crypto.randomUUID()}`,
      email: ownerEmail,
      phone: phone ?? null,
      source: "manual",
      product,
      policyNumber,
      company,
      vehicle,
      price,
      startDate,
      endDate,
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[policies/manual] add error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ success: false, error: "Не вдалося додати поліс" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const originBlocked = assertSameOrigin(req);
  if (originBlocked) return originBlocked;

  const { email, phone } = await sessionOwner();
  if (!email && !phone) return NextResponse.json({ success: false, error: "Не авторизовано" }, { status: 401 });

  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ success: false, error: "Бракує id" }, { status: 400 });
    const ok = await deletePolicy(String(id), { email, phone });
    return NextResponse.json({ success: ok });
  } catch (e) {
    console.error("[policies/manual] delete error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ success: false, error: "Не вдалося видалити" }, { status: 500 });
  }
}
