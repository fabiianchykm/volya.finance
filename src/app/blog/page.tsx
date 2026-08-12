import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getPosts, formatPostDate, CATEGORY_LABEL } from "@/lib/blog";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Блог і новини про страхування",
  description: "Статті, поради та новини про страхування: як обрати поліс, на що звертати увагу та оновлення сервісу volya.finance.",
  path: "/blog",
  keywords: ["блог про страхування", "новини страхування", "поради страхування", "як обрати поліс"],
});

export default function BlogPage() {
  const posts = getPosts();

  return (
    <>
      <Navbar solid />
      <main className="flex-1 pt-24 pb-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h1 className="mb-1 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">Блог і новини</h1>
          <p className="mb-8 text-sm text-zinc-500">Поради про страхування та оновлення сервісу.</p>

          <div className="space-y-4">
            {posts.map((p) => (
              <Link
                key={p.slug}
                href={`/blog/${p.slug}`}
                className="group block rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200/60 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-900/5"
              >
                <div className="mb-2 flex items-center gap-2 text-xs">
                  <span className={`rounded-full px-2.5 py-0.5 font-semibold ${p.category === "news" ? "bg-emerald-50 text-emerald-700" : "bg-indigo-50 text-indigo-700"}`}>
                    {CATEGORY_LABEL[p.category]}
                  </span>
                  <span className="text-zinc-400">
                    {formatPostDate(p.date)}{p.readingMinutes ? ` · ${p.readingMinutes} хв читання` : ""}
                  </span>
                </div>
                <h2 className="text-lg font-bold leading-snug text-zinc-900">{p.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-zinc-500">{p.excerpt}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600">
                  Читати <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
