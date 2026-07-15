import { Footer } from "@/components/layout/Footer";
import { InsuranceFlow } from "@/components/insurance/InsuranceFlow";
import { FeaturesSection } from "@/components/sections/FeaturesSection";
import { InsurersSection } from "@/components/sections/InsurersSection";
import { FAQSection } from "@/components/sections/FAQSection";
import { CTAWrapper } from "@/components/sections/CTAWrapper";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildMetadata, serviceLd, faqLd, breadcrumbLd } from "@/lib/seo";
import { FAQ_ITEMS } from "@/lib/faq";

export const metadata = buildMetadata({
  title: "Автоцивілка купити онлайн — ОСЦПВ (ОСАГО)",
  description:
    "Купити автоцивілку (ОСЦПВ/ОСАГО) онлайн за 3 хвилини. Введіть номер авто — порівняйте ціни від 18+ страхових і оформіть електронний поліс МТСБУ.",
  path: "/osago",
  keywords: [
    "автоцивілка купити", "автоцивілка онлайн", "ОСЦПВ онлайн", "ОСЦПВ купити",
    "ОСАГО купити", "ОСАГО онлайн", "електронний поліс ОСЦПВ", "страховка на авто онлайн",
  ],
});

export default function OsagoPage() {
  return (
    <>
      <JsonLd
        data={[
          serviceLd({
            name: "Автоцивілка (ОСЦПВ) онлайн",
            serviceType: "Обов'язкове страхування цивільно-правової відповідальності (ОСЦПВ/ОСАГО)",
            description:
              "Онлайн-оформлення електронного поліса автоцивілки (ОСЦПВ) з порівнянням цін від 18+ страхових компаній та реєстрацією в МТСБУ.",
            path: "/osago",
          }),
          faqLd(FAQ_ITEMS),
          breadcrumbLd([
            { name: "Головна", path: "/" },
            { name: "Автоцивілка (ОСЦПВ)", path: "/osago" },
          ]),
        ]}
      />
      <main className="flex-1">
        <InsuranceFlow />
        <FeaturesSection />
        <InsurersSection />
        <FAQSection />
        <CTAWrapper />
      </main>
      <Footer />
    </>
  );
}
