import { AdminReviews } from "@/components/admin/AdminReviews";

export const metadata = { title: "Модерація відгуків", robots: { index: false, follow: false } };

export default function AdminReviewsPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Модерація відгуків</h1>
      <AdminReviews />
    </>
  );
}
