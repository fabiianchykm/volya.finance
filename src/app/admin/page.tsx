import { redirect } from "next/navigation";

export const metadata = { title: "Адмінка", robots: { index: false, follow: false } };

// /admin → перший розділ адмінки. Доступ і навбар/сайдбар — у admin/layout.tsx.
export default function AdminIndexPage() {
  redirect("/admin/funnel");
}
