import { Footer } from "@/components/layout/Footer";
import { AccidentFlow } from "@/components/accident/AccidentFlow";
import { MarketingSections } from "@/components/sections/MarketingSections";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildMetadata, serviceLd, faqLd, breadcrumbLd } from "@/lib/seo";
import { FAQ_BY_PRODUCT } from "@/lib/faq";

export const metadata = buildMetadata({
  title: "Страхування від нещасних випадків онлайн — поліс НВ за 5 хвилин",
  description:
    "Страхування від нещасних випадків онлайн: виплата при травмі, втраті працездатності чи загибелі. Для себе або дитини, Україна чи весь світ, від 10 днів до року. Порівняйте ціни страхових і оформіть поліс.",
  path: "/accident",
  keywords: [
    "страхування від нещасних випадків", "страхування нв", "поліс нв онлайн",
    "страхування від нещасного випадку дитини", "страхування спортсменів", "особисте страхування",
  ],
});

export default function AccidentPage() {
  return (
    <>
      <JsonLd
        data={[
          serviceLd({
            name: "Страхування від нещасних випадків онлайн",
            serviceType: "Страхування від нещасних випадків",
            description:
              "Поліс страхування від нещасних випадків: виплата при травмі, втраті працездатності чи загибелі. Для дорослих і дітей, в Україні або по всьому світу.",
            path: "/accident",
          }),
          faqLd(FAQ_BY_PRODUCT["accident"]),
          breadcrumbLd([
            { name: "Головна", path: "/" },
            { name: "Страхування від нещасних випадків", path: "/accident" },
          ]),
        ]}
      />
      <main className="flex-1">
        <AccidentFlow />
        <MarketingSections
          showFaq
          faqItems={FAQ_BY_PRODUCT["accident"]}
          faqSubtitle="Усе, що потрібно знати про страхування від нещасних випадків"
        />
      </main>
      <Footer />
    </>
  );
}
