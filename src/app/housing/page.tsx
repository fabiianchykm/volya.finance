import { Footer } from "@/components/layout/Footer";
import { HousingFlow } from "@/components/housing/HousingFlow";
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
          faqLd(FAQ_BY_PRODUCT["housing"]),
          breadcrumbLd([
            { name: "Головна", path: "/" },
            { name: "Страхування житла", path: "/housing" },
          ]),
        ]}
      />
      {/* Navbar рендериться всередині HousingFlow (прозорий герой → solid екран пропозицій) */}
      <main className="flex-1">
        <HousingFlow />
        <MarketingSections
          showFaq
          faqItems={FAQ_BY_PRODUCT["housing"]}
          faqSubtitle="Усе, що потрібно знати про страхування житла"
        />
      </main>
      <Footer />
    </>
  );
}
