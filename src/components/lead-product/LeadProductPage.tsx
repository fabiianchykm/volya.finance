import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { MarketingSections } from "@/components/sections/MarketingSections";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildMetadata, serviceLd, faqLd, breadcrumbLd } from "@/lib/seo";
import { FAQ_BY_PRODUCT } from "@/lib/faq";
import { LEAD_PRODUCTS } from "@/lib/lead-products";
import { LeadProductFlow } from "./LeadProductFlow";
import { LeadProductBenefits } from "./LeadProductBenefits";

// Серверна сторінка продукту «через менеджера»: metadata + JSON-LD + флоу +
// переваги + спільні маркетингові секції з FAQ продукту.

export function leadProductMetadata(slug: string): Metadata {
  const cfg = LEAD_PRODUCTS[slug];
  return buildMetadata({ title: cfg.seo.title, description: cfg.seo.description, path: `/${slug}`, keywords: cfg.seo.keywords });
}

export function LeadProductPage({ slug }: { slug: string }) {
  const cfg = LEAD_PRODUCTS[slug];
  const faq = FAQ_BY_PRODUCT[cfg.faqKey] ?? [];
  return (
    <>
      <JsonLd
        data={[
          serviceLd({ name: cfg.seo.title.split(" — ")[0], serviceType: cfg.seo.serviceType, description: cfg.seo.description, path: `/${slug}`, audience: cfg.seo.audience }),
          faqLd(faq),
          breadcrumbLd([{ name: "Головна", path: "/" }, { name: cfg.seo.breadcrumb, path: `/${slug}` }]),
        ]}
      />
      <main className="flex-1">
        <LeadProductFlow slug={slug} />
        <LeadProductBenefits slug={slug} />
        <MarketingSections showFaq faqItems={faq} faqSubtitle={cfg.faqSubtitle} />
      </main>
      <Footer />
    </>
  );
}
