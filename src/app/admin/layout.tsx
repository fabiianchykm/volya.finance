import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/admin";
import { Navbar } from "@/components/layout/Navbar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

// Не індексувати адмінку.
export const metadata = { robots: { index: false, follow: false } };

// Спільний каркас адмінки: перевірка доступу + навбар + бічне меню з блоками.
// Невидима для не-адмінів (404), щоб не світити існування розділу.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth().catch(() => null);
  if (!isAdmin(session?.user?.email)) notFound();

  return (
    <>
      <Navbar solid />
      <main className="flex-1 bg-[#FAFAFA] dark:bg-[#0f0f11] pt-24 pb-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
            <AdminSidebar />
            <div className="min-w-0 flex-1">{children}</div>
          </div>
        </div>
      </main>
    </>
  );
}
