import { Footer } from "@/components/layout/Footer";
import { WeaponFlow } from "@/components/weapon/WeaponFlow";
import { WeaponBenefits } from "@/components/weapon/WeaponBenefits";
import { MarketingSections } from "@/components/sections/MarketingSections";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildMetadata, serviceLd, faqLd, breadcrumbLd } from "@/lib/seo";
import { FAQ_BY_PRODUCT } from "@/lib/faq";

export const metadata = buildMetadata({
  title: "Страхування зброї онлайн — поліс відповідальності власника зброї",
  description:
    "Обовʼязкове страхування цивільної відповідальності власника зброї онлайн — для отримання і продовження дозволу. Мисливська, травматична, пневматична зброя. Поліс на 1 або 3 роки від 100 грн, на email за 15 хвилин.",
  path: "/weapon",
  keywords: [
    "страхування зброї", "страховка на зброю", "страхування відповідальності власника зброї",
    "поліс для дозволу на зброю", "страховка на мисливську зброю", "страхування травматичної зброї",
    "обов'язкове страхування власників зброї", "страховка зброя онлайн",
  ],
});

export default function WeaponPage() {
  return (
    <>
      <JsonLd
        data={[
          serviceLd({
            name: "Страхування відповідальності власника зброї",
            serviceType: "Обовʼязкове страхування цивільної відповідальності власників зброї",
            description:
              "Поліс цивільної відповідальності власника зброї для отримання чи продовження дозволу: мисливська, травматична, газова, пневматична, холодна зброя. Оформлення онлайн на 1 або 3 роки.",
            path: "/weapon",
          }),
          faqLd(FAQ_BY_PRODUCT["weapon"]),
          breadcrumbLd([
            { name: "Головна", path: "/" },
            { name: "Страхування зброї", path: "/weapon" },
          ]),
        ]}
      />
      <main className="flex-1">
        <WeaponFlow />
        <WeaponBenefits />
        <MarketingSections
          showFaq
          faqItems={FAQ_BY_PRODUCT["weapon"]}
          faqSubtitle="Усе, що потрібно знати про страхування зброї"
        />
      </main>
      <Footer />
    </>
  );
}
