import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { InsuranceFlow } from "@/components/insurance/InsuranceFlow";
import { FeaturesSection } from "@/components/sections/FeaturesSection";
import { InsurersSection } from "@/components/sections/InsurersSection";
import { FAQSection } from "@/components/sections/FAQSection";
import { CTAWrapper } from "@/components/sections/CTAWrapper";

export const metadata: Metadata = {
  title: "Автоцивілка (ОСАГО) онлайн — volya.finance",
  description: "Оформлення автоцивілки онлайн за 3 хвилини. Введіть номер авто — порівняйте пропозиції страхових і купіть поліс.",
};

export default function OsagoPage() {
  return (
    <>
      <main className="flex-1">
        <InsuranceFlow />
        <FeaturesSection />
        <InsurersSection />
        <FAQSection />
        <CTAWrapper />
      </main>
      <Footer />
    </>
  );
}
