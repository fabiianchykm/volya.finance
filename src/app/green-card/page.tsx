import { Footer } from "@/components/layout/Footer";
import { GreenCardFlow } from "@/components/greencard/GreenCardFlow";
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
  title: "Зелена карта онлайн — автострахування за кордон",
  description:
    "Зелена карта онлайн — обов'язкова автострахова для виїзду за кордон. Оберіть територію, тип авто і строк — залиште заявку, ми підберемо вигідний поліс.",
  path: "/green-card",
  keywords: [
    "Зелена карта", "Зелена карта онлайн", "Зелена карта купити", "автострахування за кордон",
    "грін карта авто", "страховка для виїзду за кордон", "Green Card авто",
  ],
});

export default function GreenCardPage() {
  return (
    <>
      <JsonLd
        data={[
          serviceLd({
            name: "Зелена карта онлайн",
            serviceType: "Міжнародне автострахування «Зелена карта»",
            description:
              "Оформлення міжнародного поліса «Зелена карта» для виїзду за кордон: Європа, Молдова, Азербайджан. Підбір вигідної пропозиції за параметрами поїздки.",
            path: "/green-card",
          }),
          faqLd(FAQ_BY_PRODUCT["green-card"]),
          breadcrumbLd([
            { name: "Головна", path: "/" },
            { name: "Зелена карта", path: "/green-card" },
          ]),
        ]}
      />
      <main className="flex-1">
        <GreenCardFlow />
        <MarketingSections
          showFaq
          faqItems={FAQ_BY_PRODUCT["green-card"]}
          faqSubtitle="Усе, що потрібно знати про Зелену карту"
        />
      </main>
      <Footer />
    </>
  );
}
