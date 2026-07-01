import type { Metadata } from "next";
import { CheckoutClient } from "@/components/insurance/CheckoutClient";

export const metadata: Metadata = {
  title: "Оформлення поліса — volya.finance",
  // Транзакційна сторінка — поза індексом.
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-zinc-50 py-8">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <CheckoutClient />
      </div>
    </div>
  );
}
