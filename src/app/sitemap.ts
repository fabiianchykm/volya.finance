import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { getPosts } from "@/lib/blog";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  // Публічні сторінки-продукти (приватні /checkout, /policies — поза індексом).
  const routes = ["", "/osago", "/kasko", "/mini-kasko", "/green-card", "/tourism", "/pets", "/housing", "/subagent"];
  const productPages: MetadataRoute.Sitemap = routes.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === "/subagent" ? "monthly" : "weekly",
    priority: path === "" ? 1 : path === "/subagent" ? 0.3 : 0.8,
  }));
  // Дописи блогу.
  const blogPages: MetadataRoute.Sitemap = getPosts().map((p) => ({
    url: `${SITE_URL}/blog/${p.slug}`,
    lastModified: new Date(p.date),
    changeFrequency: "monthly",
    priority: 0.6,
  }));
  return [...productPages, ...blogPages];
}
