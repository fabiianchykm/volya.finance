import { AdminPolicies } from "@/components/admin/AdminPolicies";

export const metadata = { title: "Поліси", robots: { index: false, follow: false } };

export default function AdminPoliciesPage() {
  return (
    <>
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Поліси</h1>
      <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">Оформлені на сайті поліси (і додані клієнтами вручну).</p>
      <AdminPolicies />
    </>
  );
}
