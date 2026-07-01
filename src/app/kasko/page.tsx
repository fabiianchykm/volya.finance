import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { KaskoFlow } from "@/components/kasko/KaskoFlow";
import { KaskoBenefits } from "@/components/kasko/KaskoBenefits";
import { KASKO_PRODUCTS } from "@/components/kasko/products";

export const metadata: Metadata = {
  title: "КАСКО — volya.finance",
  description: "Повний страховий захист вашого авто. Введіть номер — підберемо найкращі умови КАСКО та передзвонимо з розрахунком.",
};

export default function KaskoPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <KaskoFlow product="kasko" />
        <KaskoBenefits config={KASKO_PRODUCTS.kasko} />
      </main>
      <Footer />
    </>
  );
}
