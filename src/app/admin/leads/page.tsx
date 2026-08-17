import { AdminLeads } from "@/components/admin/AdminLeads";

export const metadata = { title: "Ліди", robots: { index: false, follow: false } };

export default function AdminLeadsPage() {
  return (
    <>
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Ліди</h1>
      <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">Клієнти, які заповнили дані й перейшли до підтвердження (могли не завершити).</p>
      <AdminLeads />
    </>
  );
}
