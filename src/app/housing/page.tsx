import { Footer } from "@/components/layout/Footer";
import { HousingFlow } from "@/components/housing/HousingFlow";
import { MarketingSections } from "@/components/sections/MarketingSections";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildMetadata, serviceLd, breadcrumbLd } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Страхування житла онлайн — квартира та будинок",
  description:
    "Страхування квартири чи будинку онлайн: захист від пожежі, затоплення, стихії та інших ризиків. Порівняйте ціни страхових і оформіть поліс за кілька хвилин.",
  path: "/housing",
  keywords: [
    "страхування житла", "страхування квартири", "страхування будинку",
    "страхування нерухомості", "поліс на квартиру", "застрахувати житло онлайн",
  ],
});

export default function HousingPage() {
  return (
    <>
      <JsonLd
        data={[
          serviceLd({
            name: "Страхування житла онлайн",
            serviceType: "Страхування нерухомості (квартира / будинок)",
            description:
              "Онлайн-страхування квартири чи будинку від пожежі, затоплення, стихії та інших ризиків. Порівняння цін від страхових компаній.",
            path: "/housing",
          }),
          breadcrumbLd([
            { name: "Головна", path: "/" },
            { name: "Страхування житла", path: "/housing" },
          ]),
        ]}
      />
      {/* Navbar рендериться всередині HousingFlow (прозорий герой → solid екран пропозицій) */}
      <main className="flex-1">
        <HousingFlow />
        <MarketingSections />
      </main>
      <Footer />
    </>
  );
}
