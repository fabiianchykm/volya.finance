import type { Metadata } from "next";

// Базовий публічний URL сайту для SEO (metadataBase, sitemap, robots, canonical).
// У проді виставляється через NEXT_PUBLIC_APP_URL; дефолт — прод-домен.
export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "https://volya.finance").replace(/\/+$/, "");

export const BRAND = "volya.finance";
export const PHONE = "+380965092400";
export const EMAIL = "volya.finance.team@gmail.com";

/** Абсолютний URL для заданого шляху ("/" → корінь без хвостового слеша). */
export function absoluteUrl(path = "/"): string {
  return path === "/" ? SITE_URL : `${SITE_URL}${path}`;
}

interface PageMetaInput {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
}

/**
 * Формує повні метадані сторінки: canonical + OpenGraph + Twitter в одному місці,
 * щоб кожна сторінка мала унікальний title/description і правильний canonical.
 * title передається без бренду — його додає title.template з root layout.
 */
export function buildMetadata({ title, description, path, keywords }: PageMetaInput): Metadata {
  const url = absoluteUrl(path);
  const ogTitle = `${title} | ${BRAND}`;
  return {
    title,
    description,
    keywords,
    alternates: { canonical: path },
    openGraph: {
      title: ogTitle,
      description,
      url,
      type: "website",
      locale: "uk_UA",
      siteName: BRAND,
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
    },
  };
}

// ─────────────────────────── JSON-LD (schema.org) ───────────────────────────
// Структуровані дані для Google: rich-результати (FAQ, крихти), кращий Knowledge
// Graph і правильне розуміння сутностей (компанія, послуги, покриття — Україна).

export function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "InsuranceAgency",
    "@id": `${SITE_URL}/#organization`,
    name: BRAND,
    url: SITE_URL,
    image: `${SITE_URL}/opengraph-image`,
    logo: `${SITE_URL}/icon`,
    email: EMAIL,
    telephone: PHONE,
    areaServed: { "@type": "Country", name: "Україна" },
    description:
      "Онлайн-оформлення автострахування: автоцивілка (ОСЦПВ/ОСАГО), КАСКО, Міні-КАСКО та Зелена карта. Порівняння цін від 18+ страхових компаній, офіційні поліси МТСБУ.",
  };
}

export function websiteLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: BRAND,
    url: SITE_URL,
    inLanguage: "uk-UA",
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

export function serviceLd(input: { name: string; serviceType: string; description: string; path: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: input.name,
    serviceType: input.serviceType,
    description: input.description,
    url: absoluteUrl(input.path),
    provider: { "@id": `${SITE_URL}/#organization` },
    areaServed: { "@type": "Country", name: "Україна" },
    audience: { "@type": "Audience", audienceType: "Власники транспортних засобів" },
  };
}

export function faqLd(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.question,
      acceptedAnswer: { "@type": "Answer", text: i.answer },
    })),
  };
}

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}
