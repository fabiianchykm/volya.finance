import { Footer } from "@/components/layout/Footer";
import { VignetteFlow } from "@/components/vignette/VignetteFlow";
import { VignetteBenefits } from "@/components/vignette/VignetteBenefits";
import { MarketingSections } from "@/components/sections/MarketingSections";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildMetadata, serviceLd, faqLd, breadcrumbLd } from "@/lib/seo";
import { FAQ_BY_PRODUCT } from "@/lib/faq";

export const metadata = buildMetadata({
  title: "Віньєтка онлайн — оплата платних доріг Європи за номером авто",
  description:
    "Купити електронну віньєтку онлайн для Австрії, Чехії, Словаччини, Угорщини, Словенії, Швейцарії, Румунії, Болгарії та Молдови. Реєстрація на номер авто, оплата в гривні, підтвердження в месенджер. Ціни 2026 і строки для легкового авто.",
  path: "/vignette",
  keywords: [
    "віньєтка", "віньєтка онлайн", "купити віньєтку", "електронна віньєтка", "віньєтка Австрія",
    "віньєтка Чехія", "віньєтка Словаччина", "віньєтка Угорщина", "віньєтка Словенія", "віньєтка Швейцарія",
    "віньєтка Румунія", "віньєтка Болгарія", "платні дороги Європи", "оплата доріг Європа", "віньєтка ціна 2026",
  ],
});

export default function VignettePage() {
  return (
    <>
      <JsonLd
        data={[
          serviceLd({
            name: "Віньєтка онлайн — платні дороги Європи",
            serviceType: "Оформлення електронних віньєток для платних доріг Європи",
            description:
              "Електронна віньєтка за номером авто для Австрії, Чехії, Словаччини, Угорщини, Словенії, Швейцарії, Румунії, Болгарії та Молдови. Вибір строку й дати початку, оплата в гривні, підтвердження оператора.",
            path: "/vignette",
          }),
          faqLd(FAQ_BY_PRODUCT["vignette"]),
          breadcrumbLd([
            { name: "Головна", path: "/" },
            { name: "Віньєтка", path: "/vignette" },
          ]),
        ]}
      />
      <main className="flex-1">
        <VignetteFlow />
        <VignetteBenefits />
        <MarketingSections
          showFaq
          faqItems={FAQ_BY_PRODUCT["vignette"]}
          faqSubtitle="Усе, що потрібно знати про віньєтки"
        />
      </main>
      <Footer />
    </>
  );
}
