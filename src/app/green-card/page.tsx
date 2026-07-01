import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { GreenCardFlow } from "@/components/greencard/GreenCardFlow";

export const metadata: Metadata = {
  title: "Зелена карта — volya.finance",
  description: "Міжнародна автострахова «Зелена карта» для виїзду за кордон. Оберіть територію, авто та строк — покажемо доступні пропозиції.",
};

export default function GreenCardPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <GreenCardFlow />
      </main>
      <Footer />
    </>
  );
}
