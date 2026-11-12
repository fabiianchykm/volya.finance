import { AdminPromo } from "@/components/admin/AdminPromo";

export const metadata = { title: "Промокоди", robots: { index: false, follow: false } };

export default function AdminPromoPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Промокоди</h1>
      <AdminPromo />
    </>
  );
}
