import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getServerProfile, upsertServerProfile } from "@/lib/profile-store";
import { resolveIdentities, primaryEmail } from "@/lib/identity";

// Профіль страхувальника, привʼязаний до акаунта. Ідентичність беремо ЛИШЕ з сесії
// (auth()), а не з тіла запиту — щоб не можна було читати/писати чужий профіль.
// Рівноправна звʼязка: ключ профілю — повʼязаний email (вхід за номером теж бачить
// профіль, збережений під Google-акаунтом); якщо email немає — ключ "phone:+380…".

async function profileKey(): Promise<string | null> {
  try {
    const session = await auth();
    const email = session?.user?.email ?? null;
    const uid = (session?.user as { id?: string } | undefined)?.id ?? "";
    const phone = uid.startsWith("phone:") ? uid.slice("phone:".length) : null;
    if (!email && !phone) return null;
    const ids = await resolveIdentities({ email, phone });
    return primaryEmail(ids, email) ?? (ids.phones[0] ? `phone:${ids.phones[0]}` : null);
  } catch {
    return null; // NextAuth не сконфігуровано — деградуємо тихо
  }
}

export async function GET() {
  const email = await profileKey();
  if (!email) return NextResponse.json({ profile: null });
  try {
    const profile = await getServerProfile(email);
    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json({ profile: null });
  }
}

export async function POST(req: NextRequest) {
  const email = await profileKey();
  if (!email) return NextResponse.json({ success: false }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ success: false }, { status: 400 });
  }
  try {
    await upsertServerProfile(email, body);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
