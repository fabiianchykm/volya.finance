import { AdminDonations } from "@/components/admin/AdminDonations";

export const metadata = { title: "Пожертви бонусів", robots: { index: false, follow: false } };

export default function AdminDonationsPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Пожертви бонусів</h1>
      <AdminDonations />
    </>
  );
}
