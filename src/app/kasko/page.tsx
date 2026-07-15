import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { KaskoFlow } from "@/components/kasko/KaskoFlow";
import { KaskoBenefits } from "@/components/kasko/KaskoBenefits";
import { KASKO_PRODUCTS } from "@/components/kasko/products";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildMetadata, serviceLd, breadcrumbLd } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "КАСКО онлайн — купити страховку на авто",
  description:
    "Оформлення КАСКО онлайн — повний захист авто від угону, ДТП і пошкоджень. Введіть номер авто, отримайте розрахунок і найкращі умови від страховиків.",
  path: "/kasko",
  keywords: [
    "КАСКО", "КАСКО онлайн", "КАСКО купити", "страховка КАСКО", "повне КАСКО",
    "автострахування КАСКО", "захист авто від угону",
  ],
});

export default function KaskoPage() {
  return (
    <>
      <JsonLd
        data={[
          serviceLd({
            name: "КАСКО онлайн",
            serviceType: "Добровільне повне автострахування (КАСКО)",
            description:
              "Оформлення поліса КАСКО з повним захистом авто від угону, ДТП, пошкоджень і стихійних ризиків. Індивідуальний розрахунок від страхових компаній.",
            path: "/kasko",
          }),
          breadcrumbLd([
            { name: "Головна", path: "/" },
            { name: "КАСКО", path: "/kasko" },
          ]),
        ]}
      />
      <Navbar />
      <main className="flex-1">
        <KaskoFlow product="kasko" />
        <KaskoBenefits config={KASKO_PRODUCTS.kasko} />
      </main>
      <Footer />
    </>
  );
}
