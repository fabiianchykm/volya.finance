import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Статистика",
  description: "Статистика volya.finance — незабаром.",
  path: "/statistics",
});

export default function StatisticsPage() {
  return (
    <>
      <Navbar solid />
      <main className="flex-1 pt-24 pb-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h1 className="mb-6 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">Статистика</h1>
          <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
              <BarChart3 className="h-7 w-7 text-indigo-600" />
            </div>
            <h2 className="text-lg font-bold text-zinc-900">Незабаром</h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-500">
              Готуємо статистику — оформлені поліси, страхові компанії та інші показники. Зазирніть пізніше.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
