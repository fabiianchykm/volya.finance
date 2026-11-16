import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Gift, Clock, CheckCircle2, Hourglass, Ban, BadgeCheck, Landmark } from "lucide-react";
import { T } from "@/components/i18n/T";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { GiftActions } from "@/components/gift/GiftActions";
import { getGift, isGiftActive, GIFT_PAYEE, GIFT_VALID_MONTHS } from "@/lib/gift";

export const metadata: Metadata = {
  title: "Подарунковий сертифікат — volya.finance",
  robots: { index: false, follow: false }, // іменна сторінка за невгадуваним кодом
};

// Сторінка сертифіката: її дарують (посилання/друк). Статус живий: очікує оплати →
// активний → використано. Код — єдиний «ключ», тож персональних даних покупця
// (телефон, email) тут нема; лише імена й привітання, які він сам написав.
export default async function GiftCertificatePage({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ new?: string }> }) {
  const { code } = await params;
  const { new: isNew } = await searchParams;
  const gift = await getGift(code);
  if (!gift) notFound();

  const active = isGiftActive(gift);
  const expired = gift.status === "paid" && !active;
  const fmt = (n: number) => n.toLocaleString("uk-UA");
  const date = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("uk-UA") : "");

  const status = gift.status === "redeemed"
    ? { Icon: CheckCircle2, cls: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300", uk: `Використано ${date(gift.redeemedAt)}`, en: `Redeemed ${date(gift.redeemedAt)}` }
    : gift.status === "cancelled"
      ? { Icon: Ban, cls: "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300", uk: "Скасовано", en: "Cancelled" }
      : expired
        ? { Icon: Clock, cls: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300", uk: `Строк дії минув ${date(gift.validUntil)}`, en: `Expired ${date(gift.validUntil)}` }
        : active
          ? { Icon: BadgeCheck, cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300", uk: `Активний · діє до ${date(gift.validUntil)}`, en: `Active · valid until ${date(gift.validUntil)}` }
          : { Icon: Hourglass, cls: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300", uk: "Очікує оплати", en: "Awaiting payment" };

  return (
    <>
      <div className="print:hidden"><Navbar solid /></div>
      <main className="flex-1 bg-[#FAFAFA] pt-24 pb-16 dark:bg-[#0f0f11] print:bg-white print:pt-0">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          {isNew && (
            <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200 print:hidden">
              <p className="font-semibold"><T uk="Заявку прийнято!" en="Request received!" /></p>
              <p className="mt-1">
                <T uk={`Менеджер звʼяжеться з вами за номером ${gift.buyerPhone} і підтвердить оплату. Збережіть це посилання: після оплати сертифікат тут стане активним, і його можна буде подарувати.`}
                   en={`A manager will contact you at ${gift.buyerPhone} and confirm the payment. Keep this link: once paid, the certificate becomes active here and can be given.`} />
              </p>
            </div>
          )}

          {/* Сам сертифікат */}
          <div className="overflow-hidden rounded-3xl shadow-2xl ring-1 ring-black/5 print:shadow-none print:ring-1 print:ring-zinc-300">
            <div className="relative px-6 py-10 text-white sm:px-10 sm:py-12" style={{ backgroundImage: "linear-gradient(135deg, #0f0c29, #1e1060, #4f46e5, #7c3aed)" }}>
              <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
              <div className="flex items-center justify-between gap-4">
                <span className="text-lg font-bold tracking-wide">VOLYA<span className="text-indigo-200">.finance</span></span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold ring-1 ring-white/20"><Gift className="h-3.5 w-3.5" /> <T uk="Подарунковий сертифікат" en="Gift certificate" /></span>
              </div>
              <p className="mt-8 text-sm uppercase tracking-[0.2em] text-indigo-200"><T uk="на страхування на суму" en="for insurance worth" /></p>
              <p className="mt-1 text-5xl font-bold tracking-tight sm:text-6xl">{fmt(gift.amount)} <span className="text-3xl font-semibold text-indigo-200">₴</span></p>
              {(gift.recipientName || gift.buyerName) && (
                <div className="mt-8 grid gap-4 text-sm sm:grid-cols-2">
                  {gift.recipientName && <div><p className="text-indigo-200"><T uk="Кому" en="To" /></p><p className="text-lg font-semibold">{gift.recipientName}</p></div>}
                  <div><p className="text-indigo-200"><T uk="Від" en="From" /></p><p className="text-lg font-semibold">{gift.buyerName}</p></div>
                </div>
              )}
              {gift.message && <p className="mt-6 max-w-xl text-base italic leading-relaxed text-indigo-50">«{gift.message}»</p>}
            </div>
            <div className="bg-white px-6 py-6 dark:bg-zinc-900 sm:px-10">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400"><T uk="Код сертифіката" en="Certificate code" /></p>
                  <p className="mt-1 font-mono text-2xl font-bold tracking-[0.15em] text-zinc-900 dark:text-zinc-100">{gift.code}</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${status.cls}`}><status.Icon className="h-4 w-4" /> <T uk={status.uk} en={status.en} /></span>
              </div>
              <div className="mt-5"><GiftActions code={gift.code} /></div>
            </div>
          </div>

          {/* Що далі */}
          {gift.status === "requested" && (
            <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 text-sm dark:border-zinc-700 dark:bg-zinc-900 sm:p-6 print:hidden">
              <h2 className="flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-100"><Landmark className="h-4 w-4 text-indigo-500" /> <T uk="Оплата сертифіката" en="Paying for the certificate" /></h2>
              {GIFT_PAYEE.iban ? (
                <dl className="mt-3 grid gap-2 text-zinc-600 dark:text-zinc-300 sm:grid-cols-[auto_1fr] sm:gap-x-6">
                  <dt className="text-zinc-400"><T uk="Одержувач" en="Payee" /></dt><dd className="font-medium text-zinc-900 dark:text-zinc-100">{GIFT_PAYEE.name}</dd>
                  <dt className="text-zinc-400">IBAN</dt><dd className="font-mono font-medium text-zinc-900 dark:text-zinc-100">{GIFT_PAYEE.iban}</dd>
                  <dt className="text-zinc-400"><T uk="Код (РНОКПП)" en="Tax ID" /></dt><dd className="font-medium text-zinc-900 dark:text-zinc-100">{GIFT_PAYEE.ipn}</dd>
                  <dt className="text-zinc-400"><T uk="Сума" en="Amount" /></dt><dd className="font-medium text-zinc-900 dark:text-zinc-100">{fmt(gift.amount)} ₴</dd>
                  <dt className="text-zinc-400"><T uk="Призначення" en="Purpose" /></dt><dd className="font-medium text-zinc-900 dark:text-zinc-100"><T uk={`Подарунковий сертифікат ${gift.code}`} en={`Gift certificate ${gift.code}`} /></dd>
                </dl>
              ) : (
                <p className="mt-2 text-zinc-600 dark:text-zinc-300"><T uk="Реквізити для переказу надішле менеджер у Telegram або повідомить телефоном. У призначенні платежу вкажіть код сертифіката." en="The manager will send the transfer details on Telegram or by phone. Put the certificate code in the payment purpose." /></p>
              )}
              <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400"><T uk={`Після надходження коштів сертифікат стає активним на ${GIFT_VALID_MONTHS} місяців. Статус на цій сторінці оновиться автоматично.`} en={`Once the funds arrive the certificate becomes active for ${GIFT_VALID_MONTHS} months. The status on this page updates automatically.`} /></p>
            </section>
          )}

          <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 text-sm dark:border-zinc-700 dark:bg-zinc-900 sm:p-6">
            <h2 className="font-bold text-zinc-900 dark:text-zinc-100"><T uk="Як скористатися" en="How to use it" /></h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-zinc-600 dark:text-zinc-300">
              <li><T uk="Оберіть поліс: автоцивілка, КАСКО, Зелена карта, туристичне, нещасні випадки, житло чи тварини — на сайті " en="Choose a policy: car, CASCO, Green Card, travel, accident, property or pets — on " /><Link href="/" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">volya.finance</Link>.</li>
              <li><T uk="Напишіть менеджеру в Telegram або зателефонуйте й назвіть код сертифіката." en="Message the manager on Telegram or call and give the certificate code." /></li>
              <li><T uk="Менеджер оформить поліс і зарахує суму сертифіката в оплату. Якщо поліс дорожчий — різницю доплачуєте; якщо дешевший — залишок лишається на наступний поліс до кінця строку дії." en="The manager issues the policy and applies the certificate amount. If the policy costs more, you pay the difference; if less, the remainder stays for the next policy until the certificate expires." /></li>
            </ol>
          </section>
        </div>
      </main>
      <div className="print:hidden"><Footer /></div>
    </>
  );
}
