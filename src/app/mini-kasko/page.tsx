import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { KaskoFlow } from "@/components/kasko/KaskoFlow";
import { KaskoBenefits } from "@/components/kasko/KaskoBenefits";
import { KASKO_PRODUCTS } from "@/components/kasko/products";

export const metadata: Metadata = {
  title: "Міні-КАСКО — volya.finance",
  description: "Бюджетне КАСКО з покриттям ключових ризиків. Введіть номер авто — передзвонимо й розрахуємо вартість.",
};

export default function MiniKaskoPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <KaskoFlow product="mini-kasko" />
        <KaskoBenefits config={KASKO_PRODUCTS["mini-kasko"]} />
      </main>
      <Footer />
    </>
  );
}
