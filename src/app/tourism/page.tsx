import { Footer } from "@/components/layout/Footer";
import { TourismFlow } from "@/components/tourism/TourismFlow";
import { MarketingSections } from "@/components/sections/MarketingSections";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildMetadata, serviceLd, faqLd, breadcrumbLd } from "@/lib/seo";
import { FAQ_BY_PRODUCT } from "@/lib/faq";

export const metadata = buildMetadata({
  title: "Туристичне страхування онлайн — поліс для подорожей за кордон",
  description:
    "Туристичне страхування онлайн — медична допомога та захист у подорожі за кордон. Поліс для віз і виїзду. Порівняйте пропозиції провідних страхових і оформіть за кілька хвилин.",
  path: "/tourism",
  keywords: [
    "туристичне страхування", "страховка для подорожей", "медичне страхування за кордон",
    "страховка для візи", "туристична страховка онлайн", "поліс для виїзду за кордон",
  ],
});

export default function TourismPage() {
  return (
    <>
      <JsonLd
        data={[
          serviceLd({
            name: "Туристичне страхування онлайн",
            serviceType: "Медичне страхування подорожуючих за кордон",
            description:
              "Туристичний страховий поліс для подорожей за кордон: медична допомога, нещасні випадки, ризики поїздки. Підбір вигідної пропозиції за параметрами подорожі.",
            path: "/tourism",
          }),
          faqLd(FAQ_BY_PRODUCT["tourism"]),
          breadcrumbLd([
            { name: "Головна", path: "/" },
            { name: "Туристичне страхування", path: "/tourism" },
          ]),
        ]}
      />
      <main className="flex-1">
        <TourismFlow />
        <MarketingSections
          showFaq
          faqItems={FAQ_BY_PRODUCT["tourism"]}
          faqSubtitle="Усе, що потрібно знати про туристичне страхування"
        />
      </main>
      <Footer />
    </>
  );
}
