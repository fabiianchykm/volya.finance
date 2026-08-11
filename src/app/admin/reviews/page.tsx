import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/admin";
import { Navbar } from "@/components/layout/Navbar";
import { AdminReviews } from "@/components/admin/AdminReviews";

// Не індексувати адмінку.
export const metadata = { title: "Модерація відгуків", robots: { index: false, follow: false } };

export default async function AdminReviewsPage() {
  const session = await auth().catch(() => null);
  // Невидима для не-адмінів (404), щоб не світити існування сторінки.
  if (!isAdmin(session?.user?.email)) notFound();

  return (
    <>
      <Navbar solid />
      <main className="flex-1 bg-[#FAFAFA] pt-24 pb-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h1 className="mb-6 text-2xl font-bold tracking-tight text-zinc-900">Модерація відгуків</h1>
          <AdminReviews />
        </div>
      </main>
    </>
  );
}
