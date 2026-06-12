import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { InsuranceFlow } from "@/components/insurance/InsuranceFlow";
import { FeaturesSection } from "@/components/sections/FeaturesSection";
import { InsurersSection } from "@/components/sections/InsurersSection";
import { FAQSection } from "@/components/sections/FAQSection";
import { CTAWrapper } from "@/components/sections/CTAWrapper";

export default function HomePage() {
  return (
    <>
      <Navbar />
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
