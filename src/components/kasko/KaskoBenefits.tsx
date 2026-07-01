import type { KaskoProductConfig } from "./products";

export function KaskoBenefits({ config }: { config: KaskoProductConfig }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="mb-12 text-center">
        <h2 className="text-2xl font-bold text-zinc-900 sm:text-3xl">{config.benefitsTitle}</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-zinc-500 sm:text-base">
          {config.benefitsSubtitle}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {config.benefits.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50">
              <Icon className="h-5 w-5 text-indigo-600" />
            </div>
            <h3 className="font-semibold text-zinc-900">{title}</h3>
            <p className="mt-1 text-sm text-zinc-500">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
