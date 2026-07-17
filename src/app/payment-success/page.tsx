import type { Metadata } from "next";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PaymentSuccessClient } from "@/components/insurance/PaymentSuccessClient";

export const metadata: Metadata = {
  title: "Оплата поліса — volya.finance",
  // Транзакційна сторінка — поза індексом.
  robots: { index: false, follow: false },
};

export default function PaymentSuccessPage() {
  return (
    <>
      <Navbar solid />
      <main className="flex-1 pt-28 pb-16">
        <Suspense
          fallback={
            <div className="flex justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
            </div>
          }
        >
          <PaymentSuccessClient />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
