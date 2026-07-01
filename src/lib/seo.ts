// Базовий публічний URL сайту для SEO (metadataBase, sitemap, robots, canonical).
// У проді виставляється через NEXT_PUBLIC_APP_URL; дефолт — прод-домен.
export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "https://volya.finance").replace(/\/+$/, "");
