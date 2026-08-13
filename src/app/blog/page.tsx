import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PostList } from "@/components/blog/PostList";
import { getPosts } from "@/lib/blog";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Блог про страхування",
  description: "Статті та поради про страхування: як обрати поліс, на що звертати увагу, корисні гайди від volya.finance.",
  path: "/blog",
  keywords: ["блог про страхування", "поради страхування", "як обрати поліс", "статті про страхування"],
});

export default function BlogPage() {
  return (
    <>
      <Navbar solid />
      <main className="flex-1 pt-24 pb-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h1 className="mb-1 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">Блог</h1>
          <p className="mb-8 text-sm text-zinc-500 dark:text-zinc-400">Статті та поради про страхування.</p>
          <PostList posts={getPosts("blog")} empty="Статей поки немає." />
        </div>
      </main>
      <Footer />
    </>
  );
}
