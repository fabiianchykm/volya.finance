import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getPostsForProduct } from "@/lib/blog";

// «Читайте також» на сторінці продукту: внутрішні посилання на статті блогу
// (SEO: звʼязок продукт ↔ контент). Серверний компонент, без даних — нічого не рендерить.
export function RelatedPosts({ product, title = "Корисні статті" }: { product: string; title?: string }) {
  const posts = getPostsForProduct(product);
  if (!posts.length) return null;
  return (
    <section className="py-14 sm:py-16">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">{title}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <Link key={p.slug} href={`/blog/${p.slug}`} className="group flex flex-col rounded-2xl bg-white dark:bg-zinc-900 p-5 shadow-sm ring-1 ring-zinc-200/50 dark:ring-zinc-700 transition-all hover:-translate-y-0.5 hover:shadow-md">
              <h3 className="text-base font-bold leading-snug text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{p.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{p.excerpt}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 dark:text-indigo-400">Читати <ArrowRight className="h-4 w-4" /></span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
