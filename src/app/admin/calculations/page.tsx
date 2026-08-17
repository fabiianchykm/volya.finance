import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/admin";
import { Navbar } from "@/components/layout/Navbar";
import { AdminCalculations } from "@/components/admin/AdminCalculations";

// Не індексувати адмінку.
export const metadata = { title: "Прорахунки", robots: { index: false, follow: false } };

export default async function AdminCalculationsPage() {
  const session = await auth().catch(() => null);
  // Невидима для не-адмінів (404), щоб не світити існування сторінки.
  if (!isAdmin(session?.user?.email)) notFound();

  return (
    <>
      <Navbar solid />
      <main className="flex-1 bg-[#FAFAFA] dark:bg-[#0f0f11] pt-24 pb-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h1 className="mb-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Прорахунки на калькуляторі</h1>
          <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">Хто рахував вартість (до оформлення) — по продуктах і параметрах. Повтори тими ж даними згруповані.</p>
          <AdminCalculations />
        </div>
      </main>
    </>
  );
}
