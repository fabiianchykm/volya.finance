import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { TourismHero } from "@/components/tourism/TourismHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildMetadata, serviceLd, breadcrumbLd } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Туристичне страхування онлайн — поліс для подорожей за кордон",
  description:
    "Туристичне страхування онлайн — медична допомога та захист у подорожі за кордон. Поліс для віз і виїзду. Залиште номер — підберемо вигідну пропозицію.",
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
          breadcrumbLd([
            { name: "Головна", path: "/" },
            { name: "Туристичне страхування", path: "/tourism" },
          ]),
        ]}
      />
      <Navbar />
      <main className="flex-1">
        <TourismHero />
      </main>
      <Footer />
    </>
  );
}
