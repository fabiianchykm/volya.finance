import { Footer } from "@/components/layout/Footer";
import { PetsFlow } from "@/components/pets/PetsFlow";
import { MarketingSections } from "@/components/sections/MarketingSections";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildMetadata, serviceLd, faqLd, breadcrumbLd } from "@/lib/seo";
import { FAQ_BY_PRODUCT } from "@/lib/faq";

// Динамічний рендер — обхід бага роутера Next 16.2: якщо статичну сторінку відкрили
// повним завантаженням з параметрами флоу (?step=offers…, після перезавантаження,
// повернення з оплати чи відновлення вкладки), будь-який наступний перехід на цей
// шлях (меню, новий номер авто) роутер підміняв першою адресою — і замість першого
// екрана знову показувались старі пропозиції (25.11.2026).
export const dynamic = "force-dynamic";

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
          faqLd(FAQ_BY_PRODUCT["pets"]),
          breadcrumbLd([
            { name: "Головна", path: "/" },
            { name: "Страхування тварин", path: "/pets" },
          ]),
        ]}
      />
      <main className="flex-1">
        <PetsFlow />
        <MarketingSections
          showFaq
          faqItems={FAQ_BY_PRODUCT["pets"]}
          faqSubtitle="Усе, що потрібно знати про страхування тварин"
        />
      </main>
      <Footer />
    </>
  );
}
