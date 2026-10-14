import { Footer } from "@/components/layout/Footer";
import { AccidentFlow } from "@/components/accident/AccidentFlow";
import { AccidentSeoContent } from "@/components/accident/AccidentSeoContent";
import { RelatedPosts } from "@/components/blog/RelatedPosts";
import { MarketingSections } from "@/components/sections/MarketingSections";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildMetadata, serviceLd, faqLd, breadcrumbLd } from "@/lib/seo";
import { FAQ_BY_PRODUCT } from "@/lib/faq";

export const metadata = buildMetadata({
  title: "Страхування від нещасних випадків онлайн — поліс НВ від 159 грн",
  description:
    "Страхування від нещасних випадків онлайн: виплата при травмі, інвалідності чи загибелі. Для дорослих, дітей і спортсменів, Україна або весь світ, від 10 днів до року. Поліс за 5 хвилин.",
  path: "/accident",
  keywords: [
    "страхування від нещасних випадків", "страхування нв", "поліс нв онлайн",
    "страхування від нещасного випадку дитини", "страхування дитини від нещасного випадку", "страхування спортсменів",
    "страховка для спортсменів", "страхування НВ ціна", "особисте страхування", "страхування життя від нещасного випадку",
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
            audience: "Фізичні особи: дорослі, діти, спортсмени, працівники небезпечних професій",
            priceFrom: 159,
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
        <AccidentSeoContent />
        <RelatedPosts product="accident" title="Корисні статті про страхування від нещасних випадків" />
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
