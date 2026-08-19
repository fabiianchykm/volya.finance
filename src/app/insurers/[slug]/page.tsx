import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Home, Globe } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { InsurerReviews } from "@/components/reviews/InsurerReviews";
import { getInsurer, INSURERS, INSURERS_FROZEN } from "@/lib/insurers";
import { logoSrc } from "@/lib/logos";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export function generateStaticParams() {
  if (INSURERS_FROZEN) return []; // розділ заморожено — сторінки не генеруємо
  return INSURERS.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const ins = getInsurer(slug);
  if (!ins) return buildMetadata({ title: "Страхова компанія", description: "", path: `/insurers/${slug}` });
  return buildMetadata({
    title: `${ins.name} — відгуки, контакти, інформація`,
    description: `${ins.name}: інформація про страхову, офіси, контакти та відгуки клієнтів volya.finance.`,
    path: `/insurers/${slug}`,
    keywords: [`${ins.name} відгуки`, `${ins.name} страхова`, `${ins.name} контакти`],
  });
}

export default async function InsurerPage({ params }: { params: Promise<{ slug: string }> }) {
  if (INSURERS_FROZEN) notFound(); // розділ заморожено, поки нема реальних даних профілів
  const { slug } = await params;
  const ins = getInsurer(slug);
  if (!ins) notFound();
  const src = logoSrc(ins.slug);

  return (
    <>
      <Navbar solid />
      <main className="flex-1 bg-[#FAFAFA] dark:bg-[#0f0f11] pt-24 pb-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          {/* Breadcrumb */}
          <div className="mb-5 flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
            <Link href="/" className="hover:text-indigo-500"><Home className="h-3.5 w-3.5" /></Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/insurers" className="hover:text-indigo-500">Страхові компанії</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-zinc-600 dark:text-zinc-300">{ins.name}</span>
          </div>

          {/* Шапка */}
          <div className="mb-6 flex items-center gap-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-100 p-2">
              {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt={ins.name} className="max-h-12 max-w-[56px] object-contain" />
              ) : (
                <span className="text-center text-xs font-semibold text-zinc-500 dark:text-zinc-400">{ins.name}</span>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{ins.name}</h1>
              {ins.website && (
                <a href={ins.website} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                  <Globe className="h-3.5 w-3.5" /> Офіційний сайт
                </a>
              )}
            </div>
          </div>

          {/* Профіль-поля (about/offices/phones) поки заглушки — НЕ показуємо, доки
              не буде реальних даних. Сторінка = назва + лого + сайт + відгуки. */}

          {/* Відгуки */}
          <InsurerReviews slug={ins.slug} name={ins.name} />
        </div>
      </main>
      <Footer />
    </>
  );
}
