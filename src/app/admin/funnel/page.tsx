import { AdminFunnel } from "@/components/admin/AdminFunnel";

export const metadata = { title: "Воронка", robots: { index: false, follow: false } };

export default function AdminFunnelPage() {
  return (
    <>
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Воронка</h1>
      <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">Скільки потенційних клієнтів доходить від прорахунку до купівлі — і де відсіюються.</p>
      <AdminFunnel />
    </>
  );
}
