import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HomeHero } from "@/components/home/HomeHero";
import { ProductsGrid } from "@/components/home/ProductsGrid";
import { FeaturesSection } from "@/components/sections/FeaturesSection";
import { InsurersSection } from "@/components/sections/InsurersSection";
import { CTAWrapper } from "@/components/sections/CTAWrapper";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <HomeHero />
        <ProductsGrid />
        <FeaturesSection />
        <InsurersSection />
        <CTAWrapper />
      </main>
      <Footer />
    </>
  );
}
