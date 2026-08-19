// Хто має доступ до адмінки. За замовчуванням — власник; можна розширити через
// env ADMIN_EMAILS (через кому). Порівняння без регістру.
const DEFAULT_ADMINS = ["fabiianchykm@gmail.com", "volya.finance.team@gmail.com"];

export function adminEmails(): string[] {
  const fromEnv = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return (fromEnv.length ? fromEnv : DEFAULT_ADMINS).map((s) => s.toLowerCase());
}

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmails().includes(email.trim().toLowerCase());
}

// Клієнтська перевірка (для показу пункту «Адмінка» в навбарі). Список email —
// не секрет; на клієнті беремо з NEXT_PUBLIC_ADMIN_EMAILS або дефолт. Доступ до
// сторінок усе одно захищений на сервері (isAdmin) — це лише видимість пункту.
export function isAdminClient(email: string | null | undefined): boolean {
  if (!email) return false;
  const fromEnv = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const list = (fromEnv.length ? fromEnv : DEFAULT_ADMINS).map((s) => s.toLowerCase());
  return list.includes(email.trim().toLowerCase());
}
