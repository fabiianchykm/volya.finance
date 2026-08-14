import Link from "next/link";
import { type ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { formatPostDate, CATEGORY_LABEL, type Post } from "@/lib/blog";
import { T } from "@/components/i18n/T";

// Спільний список дописів (для /blog і /news).
export function PostList({ posts, empty }: { posts: Post[]; empty?: ReactNode }) {
  if (posts.length === 0) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">{empty ?? <T uk="Поки немає дописів." en="No posts yet." />}</p>;
  }
  return (
    <div className="space-y-4">
      {posts.map((p) => (
        <Link
          key={p.slug}
          href={`/blog/${p.slug}`}
          className="group block rounded-2xl bg-white dark:bg-zinc-900 p-5 shadow-sm ring-1 ring-zinc-200/60 dark:ring-zinc-700 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-900/5"
        >
          <div className="mb-2 flex items-center gap-2 text-xs">
            <span className={`rounded-full px-2.5 py-0.5 font-semibold ${p.category === "news" ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300" : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300"}`}>
              {CATEGORY_LABEL[p.category]}
            </span>
            <span className="text-zinc-400 dark:text-zinc-500">
              {formatPostDate(p.date)}{p.readingMinutes ? ` · ${p.readingMinutes} хв читання` : ""}
            </span>
          </div>
          <h2 className="text-lg font-bold leading-snug text-zinc-900 dark:text-zinc-100">{p.title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{p.excerpt}</p>
          <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
            <T uk="Читати" en="Read" /> <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </Link>
      ))}
    </div>
  );
}
