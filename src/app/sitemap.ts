import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  // Публічні сторінки-продукти (приватні /checkout, /policies — поза індексом).
  const routes = ["", "/osago", "/kasko", "/mini-kasko", "/green-card", "/subagent"];
  return routes.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === "/subagent" ? "monthly" : "weekly",
    priority: path === "" ? 1 : path === "/subagent" ? 0.3 : 0.8,
  }));
}
