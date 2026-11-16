import { AdminGifts } from "@/components/admin/AdminGifts";

export const metadata = { title: "Подарункові сертифікати", robots: { index: false, follow: false } };

export default function AdminGiftsPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Подарункові сертифікати</h1>
      <AdminGifts />
    </>
  );
}
