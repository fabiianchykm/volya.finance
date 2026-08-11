import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Home, MapPin, Phone, Globe, Info } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { InsurerReviews } from "@/components/reviews/InsurerReviews";
import { getInsurer, INSURERS } from "@/lib/insurers";
import { logoSrc } from "@/lib/logos";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export function generateStaticParams() {
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
  const { slug } = await params;
  const ins = getInsurer(slug);
  if (!ins) notFound();
  const src = logoSrc(ins.slug);

  return (
    <>
      <Navbar solid />
      <main className="flex-1 bg-[#FAFAFA] pt-24 pb-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          {/* Breadcrumb */}
          <div className="mb-5 flex items-center gap-1.5 text-xs text-zinc-400">
            <Link href="/" className="hover:text-indigo-500"><Home className="h-3.5 w-3.5" /></Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/insurers" className="hover:text-indigo-500">Страхові компанії</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-zinc-600">{ins.name}</span>
          </div>

          {/* Шапка */}
          <div className="mb-6 flex items-center gap-4 rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50 p-2">
              {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt={ins.name} className="max-h-12 max-w-[56px] object-contain" />
              ) : (
                <span className="text-center text-xs font-semibold text-zinc-500">{ins.name}</span>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{ins.name}</h1>
              {ins.website && (
                <a href={ins.website} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:underline">
                  <Globe className="h-3.5 w-3.5" /> Офіційний сайт
                </a>
              )}
            </div>
          </div>

          {/* Інформація (ПРИКЛАД — заповнити реальними даними) */}
          <div className="mb-6 rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
              <Info className="h-3.5 w-3.5" /> Дані для прикладу — буде замінено на реальні
            </div>
            <h2 className="mb-2 text-lg font-bold text-zinc-900">Про компанію</h2>
            <p className="text-sm leading-relaxed text-zinc-600">{ins.about}</p>
            {ins.founded && <p className="mt-2 text-sm text-zinc-500">Рік заснування: <span className="font-medium text-zinc-700">{ins.founded}</span></p>}

            {ins.offices && ins.offices.length > 0 && (
              <div className="mt-4">
                <h3 className="mb-2 text-sm font-semibold text-zinc-800">Офіси</h3>
                <ul className="space-y-1.5">
                  {ins.offices.map((o) => (
                    <li key={o} className="flex items-start gap-2 text-sm text-zinc-600"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" /> {o}</li>
                  ))}
                </ul>
              </div>
            )}

            {ins.phones && ins.phones.length > 0 && (
              <div className="mt-4">
                <h3 className="mb-2 text-sm font-semibold text-zinc-800">Контакти</h3>
                <ul className="space-y-1.5">
                  {ins.phones.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-sm text-zinc-600"><Phone className="h-4 w-4 shrink-0 text-indigo-500" /> {p}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Відгуки */}
          <InsurerReviews slug={ins.slug} name={ins.name} />
        </div>
      </main>
      <Footer />
    </>
  );
}
