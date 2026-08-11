import Link from "next/link";
import { ChevronRight, Star } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { INSURERS } from "@/lib/insurers";
import { logoSrc } from "@/lib/logos";
import { buildMetadata, breadcrumbLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata = buildMetadata({
  title: "Страхові компанії — відгуки та контакти",
  description:
    "Каталог страхових компаній: інформація, контакти, офіси та реальні відгуки клієнтів, які оформили поліс на volya.finance.",
  path: "/insurers",
  keywords: ["відгуки про страхові", "страхові компанії україни", "рейтинг страхових", "контакти страхових"],
});

export default function InsurersPage() {
  return (
    <>
      <JsonLd data={[breadcrumbLd([{ name: "Головна", path: "/" }, { name: "Страхові компанії", path: "/insurers" }])]} />
      <Navbar solid />
      <main className="flex-1 bg-[#FAFAFA] pt-24 pb-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">Страхові компанії</h1>
            <p className="mt-2 max-w-2xl text-base text-zinc-500">
              Інформація про страховиків, контакти та відгуки клієнтів. Залишити відгук може той,
              хто оформив поліс цієї страхової у нас.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {INSURERS.map((ins) => {
              const src = logoSrc(ins.slug);
              return (
                <Link
                  key={ins.slug}
                  href={`/insurers/${ins.slug}`}
                  className="group flex items-center gap-4 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-100 hover:shadow-md"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50 p-1.5">
                    {src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={src} alt={ins.name} className="max-h-10 max-w-[48px] object-contain" />
                    ) : (
                      <span className="text-center text-xs font-semibold text-zinc-500">{ins.name}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-zinc-900">{ins.name}</p>
                    <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-zinc-400">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> Відгуки та контакти
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-zinc-300 transition-colors group-hover:text-indigo-500" />
                </Link>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
