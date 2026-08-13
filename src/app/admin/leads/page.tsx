import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/admin";
import { Navbar } from "@/components/layout/Navbar";
import { AdminLeads } from "@/components/admin/AdminLeads";

// Не індексувати адмінку.
export const metadata = { title: "Ліди", robots: { index: false, follow: false } };

export default async function AdminLeadsPage() {
  const session = await auth().catch(() => null);
  // Невидима для не-адмінів (404), щоб не світити існування сторінки.
  if (!isAdmin(session?.user?.email)) notFound();

  return (
    <>
      <Navbar solid />
      <main className="flex-1 bg-[#FAFAFA] dark:bg-[#0f0f11] pt-24 pb-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h1 className="mb-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Ліди</h1>
          <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">Клієнти, які заповнили дані й перейшли до підтвердження (могли не завершити).</p>
          <AdminLeads />
        </div>
      </main>
    </>
  );
}
