import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { GreenCardFlow } from "@/components/greencard/GreenCardFlow";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildMetadata, serviceLd, breadcrumbLd } from "@/lib/seo";

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
          breadcrumbLd([
            { name: "Головна", path: "/" },
            { name: "Зелена карта", path: "/green-card" },
          ]),
        ]}
      />
      <Navbar />
      <main className="flex-1">
        <GreenCardFlow />
      </main>
      <Footer />
    </>
  );
}
