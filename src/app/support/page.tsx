import type { Metadata } from "next";
import { T } from "@/components/i18n/T";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SupportPageClient } from "@/components/support/SupportPageClient";

export const metadata: Metadata = {
  title: "Підтримка — volya.finance",
  description: "Звʼяжіться з підтримкою volya.finance: напишіть у Telegram чи Viber або замовте дзвінок — допоможемо оформити страховий поліс чи вирішити питання.",
  alternates: { canonical: "/support" },
};

export default function SupportPage() {
  return (
    <>
      <Navbar solid />
      <main className="flex-1 pt-24 pb-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h1 className="mb-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-3xl"><T uk="Підтримка" en="Support" /></h1>
          <p className="mb-7 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400 sm:text-base">
            <T uk="Оберіть зручний спосіб звʼязку — допоможемо з оформленням чи будь-яким питанням щодо поліса." en="Pick a convenient way to reach us — we'll help with checkout or any question about your policy." />
          </p>
          <SupportPageClient />
        </div>
      </main>
      <Footer />
    </>
  );
}
