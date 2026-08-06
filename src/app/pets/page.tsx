import { Footer } from "@/components/layout/Footer";
import { PetsFlow } from "@/components/pets/PetsFlow";
import { FeaturesSection } from "@/components/sections/FeaturesSection";
import { InsurersSection } from "@/components/sections/InsurersSection";
import { ReviewsSection } from "@/components/sections/ReviewsSection";
import { CTAWrapper } from "@/components/sections/CTAWrapper";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildMetadata, serviceLd, breadcrumbLd } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Страхування тварин онлайн — поліс для кота чи собаки",
  description:
    "Страхування домашніх тварин онлайн — захист кота чи собаки: ветеринарні витрати та ризики. Порівняйте пропозиції страхових і оформіть поліс за кілька хвилин.",
  path: "/pets",
  keywords: [
    "страхування тварин", "страхування домашніх тварин", "страховка для собаки",
    "страховка для кота", "ветеринарне страхування", "поліс для тварини онлайн",
  ],
});

export default function PetsPage() {
  return (
    <>
      <JsonLd
        data={[
          serviceLd({
            name: "Страхування тварин онлайн",
            serviceType: "Страхування домашніх тварин",
            description:
              "Страховий поліс для домашніх тварин (кіт, собака): ветеринарні витрати та ризики. Підбір вигідної пропозиції онлайн.",
            path: "/pets",
          }),
          breadcrumbLd([
            { name: "Головна", path: "/" },
            { name: "Страхування тварин", path: "/pets" },
          ]),
        ]}
      />
      <main className="flex-1">
        <PetsFlow />
        <FeaturesSection />
        <InsurersSection />
        <ReviewsSection />
        <CTAWrapper />
      </main>
      <Footer />
    </>
  );
}
