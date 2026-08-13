import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PostList } from "@/components/blog/PostList";
import { getPosts } from "@/lib/blog";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Новини",
  description: "Новини та оновлення сервісу volya.finance: нові продукти, можливості та зміни.",
  path: "/news",
  keywords: ["новини страхування", "новини volya.finance", "оновлення сервісу"],
});

export default function NewsPage() {
  return (
    <>
      <Navbar solid />
      <main className="flex-1 pt-24 pb-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h1 className="mb-1 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">Новини</h1>
          <p className="mb-8 text-sm text-zinc-500 dark:text-zinc-400">Оновлення сервісу та нові можливості.</p>
          <PostList posts={getPosts("news")} empty="Новин поки немає." />
        </div>
      </main>
      <Footer />
    </>
  );
}
