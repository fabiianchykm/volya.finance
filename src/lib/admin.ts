// Хто має доступ до адмінки. За замовчуванням — власник; можна розширити через
// env ADMIN_EMAILS (через кому). Порівняння без регістру.
const DEFAULT_ADMINS = ["fabiianchykm@gmail.com"];

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
