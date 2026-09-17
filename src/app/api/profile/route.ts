import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getServerProfile, listServerProfiles, upsertServerProfile, deleteServerProfile } from "@/lib/profile-store";
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
  if (!email) return NextResponse.json({ profile: null, profiles: [] });
  try {
    // profile — найсвіжіший (легасі-сумісність для старих читачів); profiles — усі
    // особи акаунта (для пікера «Заповнити збереженими» з кількома людьми).
    const [profile, profiles] = await Promise.all([
      getServerProfile(email),
      listServerProfiles(email),
    ]);
    return NextResponse.json({ profile, profiles });
  } catch {
    return NextResponse.json({ profile: null, profiles: [] });
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

// Видалити профіль конкретної особи з акаунта (за її email у тілі запиту).
export async function DELETE(req: NextRequest) {
  const account = await profileKey();
  if (!account) return NextResponse.json({ success: false }, { status: 401 });
  const body = await req.json().catch(() => null);
  const personEmail = typeof body?.email === "string" ? body.email : "";
  if (!personEmail) return NextResponse.json({ success: false }, { status: 400 });
  try {
    await deleteServerProfile(account, personEmail);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
