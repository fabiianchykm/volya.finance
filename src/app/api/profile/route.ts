import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getServerProfile, upsertServerProfile } from "@/lib/profile-store";

// Профіль страхувальника, привʼязаний до акаунта. Email беремо ЛИШЕ з сесії
// (auth()), а не з тіла запиту — щоб не можна було читати/писати чужий профіль.

async function sessionEmail(): Promise<string | null> {
  try {
    const session = await auth();
    return session?.user?.email ?? null;
  } catch {
    return null; // NextAuth не сконфігуровано — деградуємо тихо
  }
}

export async function GET() {
  const email = await sessionEmail();
  if (!email) return NextResponse.json({ profile: null });
  try {
    const profile = await getServerProfile(email);
    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json({ profile: null });
  }
}

export async function POST(req: NextRequest) {
  const email = await sessionEmail();
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
