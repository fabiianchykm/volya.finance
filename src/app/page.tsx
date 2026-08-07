import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HomeHero } from "@/components/home/HomeHero";
import { MarketingSections } from "@/components/sections/MarketingSections";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <HomeHero />
        <MarketingSections />
      </main>
      <Footer />
    </>
  );
}
