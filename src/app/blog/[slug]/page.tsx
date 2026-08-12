import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PostBody } from "@/components/blog/PostBody";
import { getPost, getPosts, formatPostDate, CATEGORY_LABEL } from "@/lib/blog";
import { buildMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return getPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return buildMetadata({ title: "Блог", description: "", path: `/blog/${slug}` });
  return buildMetadata({ title: post.title, description: post.excerpt, path: `/blog/${slug}` });
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <>
      <Navbar solid />
      <main className="flex-1 pt-24 pb-16">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          {/* Breadcrumb */}
          <div className="mb-5 flex items-center gap-1.5 text-xs text-zinc-400">
            <Link href="/blog" className="transition-colors hover:text-indigo-500">Блог</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="truncate font-medium text-zinc-600">{post.title}</span>
          </div>

          <div className="mb-3 flex items-center gap-2 text-xs">
            <span className={`rounded-full px-2.5 py-0.5 font-semibold ${post.category === "news" ? "bg-emerald-50 text-emerald-700" : "bg-indigo-50 text-indigo-700"}`}>
              {CATEGORY_LABEL[post.category]}
            </span>
            <span className="text-zinc-400">
              {formatPostDate(post.date)}{post.readingMinutes ? ` · ${post.readingMinutes} хв читання` : ""}
            </span>
          </div>

          <h1 className="mb-6 text-2xl font-bold leading-tight tracking-tight text-zinc-900 sm:text-3xl">
            {post.title}
          </h1>

          <article className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200/60 sm:p-8">
            <PostBody content={post.content} />
          </article>

          <Link href="/blog" className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:underline">
            <ArrowLeft className="h-4 w-4" /> Усі дописи
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
