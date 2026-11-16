import type { Metadata } from "next";
import { ShieldCheck, Car, Plane, HeartPulse, PawPrint, Home } from "lucide-react";
import { T } from "@/components/i18n/T";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildMetadata, breadcrumbLd, faqLd } from "@/lib/seo";
import { GiftOrderForm } from "@/components/gift/GiftOrderForm";
import { GiftLaunchBadge } from "@/components/gift/GiftLaunchBadge";
import { GIFT_VALID_MONTHS } from "@/lib/gift-constants";

export const metadata: Metadata = buildMetadata({
  title: "Подарунковий сертифікат на страхування",
  description:
    "Подаруйте захист: сертифікат volya.finance на будь-який поліс — автоцивілка, КАСКО, туристичне, нещасні випадки, житло чи тварини. Номінал 1 000, 2 000, 4 000, 10 000 грн або своя сума, діє 12 місяців.",
  path: "/gift",
  keywords: ["подарунковий сертифікат страхування", "подарувати страховку", "сертифікат на автоцивілку", "подарунок водію"],
});

const FAQ = [
  { q: "На які поліси діє сертифікат?", a: "На будь-який продукт volya.finance: автоцивілка (ОСЦПВ), КАСКО та міні-КАСКО, Зелена карта, туристичне страхування, страхування від нещасних випадків, житла і домашніх тварин." },
  { q: "Як одержувач використовує сертифікат?", a: "Одержувач обирає поліс на сайті або пише менеджеру в Telegram чи телефонує, називає код сертифіката — і менеджер оформлює поліс, зарахувавши суму сертифіката в оплату. Якщо поліс дорожчий, різницю одержувач доплачує; якщо дешевший, залишок можна використати на наступний поліс протягом строку дії." },
  { q: "Скільки діє сертифікат?", a: `${GIFT_VALID_MONTHS} місяців з дня оплати.` },
  { q: "Як оплатити?", a: "Переказом за IBAN на рахунок ТОВ «ЮІНШУР» — реквізити й призначення платежу з кодом сертифіката показуються одразу після заявки на сторінці сертифіката, менеджер також продублює їх. Щойно кошти надійдуть, сертифікат стане активним." },
  { q: "Як передати подарунок?", a: "Після оплати у вас буде посилання на сторінку сертифіката з кодом — надішліть його в месенджері або роздрукуйте." },
];

export default function GiftPage() {
  return (
    <>
      <JsonLd data={[
        breadcrumbLd([{ name: "Головна", path: "/" }, { name: "Подарунковий сертифікат", path: "/gift" }]),
        faqLd(FAQ.map((f) => ({ question: f.q, answer: f.a }))),
      ]} />
      <Navbar />
      <section
        className="relative overflow-x-hidden pb-20 pt-32 sm:pb-28 sm:pt-40 animate-gradient"
        style={{ backgroundImage: "linear-gradient(135deg, #06040f, #0f0c29, #1e1060, #4f46e5, #7c3aed, #1e1060, #06040f)" }}
      >
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 60% at 50% 48%, transparent 0%, rgba(0,0,0,0.1) 100%)" }} />
        <div className="relative mx-auto w-full max-w-5xl px-4 sm:px-6">
          <div className="mx-auto mb-10 max-w-3xl space-y-4 text-center">
            <GiftLaunchBadge />
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
              <T uk="Подарунковий сертифікат" en="Gift certificate" />
              <span className="mt-1 block bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent"><T uk="на будь-яке страхування" en="for any insurance" /></span>
            </h1>
            <p className="mx-auto max-w-xl text-base text-zinc-300">
              <T uk="Автоцивілка водію, туристичне мандрівнику, страховка від нещасних випадків спортсмену чи поліс для улюбленця. Ви обираєте суму — одержувач обирає поліс." en="Car insurance for a driver, travel cover for a globetrotter, accident insurance for an athlete or a policy for a pet. You choose the amount, the recipient chooses the policy." />
            </p>
          </div>

          <GiftOrderForm />
        </div>
      </section>

      <section className="bg-[#FAFAFA] py-14 dark:bg-[#0f0f11]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl"><T uk="Як це працює" en="How it works" /></h2>
          <ol className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { n: 1, uk: "Обираєте номінал і лишаєте телефон", en: "Pick the value and leave your phone", d: "Менеджер зателефонує, надішле реквізити для переказу й підтвердить оплату.", de: "A manager calls you, sends transfer details and confirms the payment." },
              { n: 2, uk: "Даруєте сертифікат", en: "Give the certificate", d: "Сторінка сертифіката з кодом — надішліть посилання в месенджері або роздрукуйте.", de: "A certificate page with a code: send the link or print it." },
              { n: 3, uk: "Одержувач обирає поліс", en: "The recipient picks a policy", d: "Називає код менеджеру — і сума сертифіката йде в оплату будь-якого полісу.", de: "They tell the manager the code and the amount goes towards any policy." },
            ].map((s) => (
              <li key={s.n} className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">{s.n}</span>
                <p className="mt-3 font-semibold text-zinc-900 dark:text-zinc-100"><T uk={s.uk} en={s.en} /></p>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400"><T uk={s.d} en={s.de} /></p>
              </li>
            ))}
          </ol>

          <h2 className="mt-14 text-center text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl"><T uk="На що можна витратити" en="What it can be spent on" /></h2>
          <ul className="mt-6 flex flex-wrap justify-center gap-2">
            {[
              { Icon: Car, uk: "Автоцивілка", en: "Car insurance", href: "/osago" }, { Icon: ShieldCheck, uk: "КАСКО / міні-КАСКО", en: "CASCO / Mini-CASCO", href: "/mini-kasko" },
              { Icon: Plane, uk: "Туристичне", en: "Travel", href: "/tourism" }, { Icon: HeartPulse, uk: "Нещасні випадки", en: "Accident", href: "/accident" },
              { Icon: Home, uk: "Житло", en: "Property", href: "/housing" }, { Icon: PawPrint, uk: "Тварини", en: "Pets", href: "/pets" },
            ].map(({ Icon, uk, en, href }) => (
              <li key={href}><a href={href} className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-indigo-300 hover:text-indigo-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"><Icon className="h-4 w-4 text-indigo-500" /><T uk={uk} en={en} /></a></li>
            ))}
          </ul>

          <h2 className="mt-14 text-center text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl"><T uk="Поширені запитання" en="FAQ" /></h2>
          <div className="mx-auto mt-6 max-w-3xl divide-y divide-zinc-200 rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-700 dark:bg-zinc-900">
            {FAQ.map((f) => (
              <details key={f.q} className="group px-5 py-4">
                <summary className="cursor-pointer list-none text-sm font-semibold text-zinc-900 dark:text-zinc-100">{f.q}</summary>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
