import { AdminCalculations } from "@/components/admin/AdminCalculations";

export const metadata = { title: "Прорахунки", robots: { index: false, follow: false } };

export default function AdminCalculationsPage() {
  return (
    <>
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Прорахунки на калькуляторі</h1>
      <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">Хто рахував вартість (до оформлення) — по продуктах і параметрах. Повтори тими ж даними згруповані.</p>
      <AdminCalculations />
    </>
  );
}
