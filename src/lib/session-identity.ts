import { auth } from "@/auth";

export interface SessionIdentity {
  email: string | null;   // Google-вхід
  phone: string | null;   // вхід за номером ("phone:+380…" у session.user.id)
}

// Єдине місце, де з сесії NextAuth дістаємо «чим увійшли». Google → email;
// вхід за номером → phone (session.user.id = "phone:+380…"). Якщо NextAuth не
// сконфігуровано або сесії немає — обидва null (гість).
export async function getSessionIdentity(): Promise<SessionIdentity> {
  try {
    const session = await auth();
    const email = session?.user?.email?.trim().toLowerCase() || null;
    const uid = (session?.user as { id?: string } | undefined)?.id ?? "";
    const phone = uid.startsWith("phone:") ? uid.slice("phone:".length) : null;
    return { email, phone };
  } catch {
    return { email: null, phone: null };
  }
}
