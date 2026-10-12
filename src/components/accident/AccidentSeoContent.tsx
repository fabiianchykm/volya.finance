"use client";

import Link from "next/link";
import { HeartPulse, Baby, Dumbbell, HardHat, Globe, Clock, Banknote, FileText } from "lucide-react";
import { useI18n } from "@/lib/i18n";

// SEO-контент для /accident: індексований текст про продукт (що покриває, для кого,
// умови, ціни, як оформити) під калькулятором. Клієнтський компонент заради
// uk/en, але рендериться на сервері — Google бачить повний HTML.
// Ціни — реальні з калькулятора ІНГО на момент запуску (жовтень 2026); орієнтовні.

const COVER = [
  { icon: HeartPulse, uk: "Травма внаслідок нещасного випадку — виплата за таблицею страховика у відсотках від страхової суми.", en: "Injury caused by an accident — a payout per the insurer's table as a percentage of the insured sum." },
  { icon: FileText, uk: "Тимчасова втрата працездатності — лікарняний через нещасний випадок.", en: "Temporary disability — sick leave caused by an accident." },
  { icon: Banknote, uk: "Стійка втрата працездатності (інвалідність) — виплата залежно від групи.", en: "Permanent disability — a payout depending on the disability group." },
  { icon: HeartPulse, uk: "Смерть внаслідок нещасного випадку — 100% страхової суми вигодонабувачам.", en: "Death caused by an accident — 100% of the insured sum to the beneficiaries." },
];

const WHO = [
  { icon: Baby, title: { uk: "Дітям", en: "Children" }, uk: "Садок, школа, секції, табір — поліс для дитини від 1 року. Платником може бути будь-хто з батьків.", en: "Kindergarten, school, clubs, camp — a policy for a child from age 1. Either parent can be the payer." },
  { icon: Dumbbell, title: { uk: "Спортсменам", en: "Athletes" }, uk: "Аматорам і професіоналам: футбол, бокс, плавання, велоспорт, альпінізм тощо. Є варіант захисту лише на час тренувань і змагань.", en: "Amateurs and professionals: football, boxing, swimming, cycling, mountaineering and more. Coverage can be limited to training and competitions." },
  { icon: HardHat, title: { uk: "Небезпечним професіям", en: "Hazardous jobs" }, uk: "Будівельники, електрики, пожежники, охоронці — з урахуванням підвищеного ризику.", en: "Builders, electricians, firefighters, security guards — with the elevated risk priced in." },
  { icon: Globe, title: { uk: "Для подорожей і воєнних ризиків", en: "Travel and war risks" }, uk: "Територія — Україна або весь світ; за потреби додайте покриття воєнних ризиків.", en: "Territory — Ukraine or worldwide; add war-risk coverage if needed." },
];

const PRICES = [
  { uk: "Дитина, 10 днів, 50 000 грн", en: "Child, 10 days, UAH 50,000", price: "159" },
  { uk: "Дитина, 1 рік, 50 000 грн", en: "Child, 1 year, UAH 50,000", price: "800" },
  { uk: "Дорослий, 1 рік, 100 000 грн", en: "Adult, 1 year, UAH 100,000", price: "1 256" },
  { uk: "Дорослий, 1 рік, 100 000 грн, воєнні ризики", en: "Adult, 1 year, UAH 100,000, war risks", price: "2 824" },
  { uk: "Футбол (аматор), 1 рік, 100 000 грн", en: "Football (amateur), 1 year, UAH 100,000", price: "3 766" },
];

const STEPS = [
  { uk: "Вкажіть дату народження застрахованого, строк, страхову суму, територію та фактор ризику — побачите ціну одразу.", en: "Enter the insured person's date of birth, term, insured sum, territory and risk factor — you see the price immediately." },
  { uk: "Заповніть дані платника і, якщо страхуєте дитину чи родича, — застрахованої особи. Потрібні паспорт або ID-картка та ІПН.", en: "Fill in the payer's details and, if insuring a child or relative, the insured person's. A passport or ID card and tax number are required." },
  { uk: "Підтвердіть номер телефону кодом із SMS і оплатіть карткою через LiqPay.", en: "Confirm your phone number with an SMS code and pay by card via LiqPay." },
  { uk: "Електронний поліс приходить на email і зберігається в кабінеті «Мої поліси».", en: "The electronic policy arrives by email and is stored in your “My policies” account." },
];

export function AccidentSeoContent() {
  const { t } = useI18n();
  return (
    <section id="about-accident" className="bg-[#FAFAFA] dark:bg-[#0f0f11] py-16 sm:py-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 space-y-14">
        {/* Що таке + що покриває */}
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
              {t({ uk: "Що таке страхування від нещасних випадків (НВ)", en: "What is accident insurance" })}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
              {t({
                uk: "Поліс НВ — це особисте страхування життя та здоровʼя. Якщо застрахована особа отримає травму, втратить працездатність або загине внаслідок нещасного випадку, страхова компанія виплачує гроші в межах обраної страхової суми — від 10 000 до 300 000 грн. Гроші можна витратити на лікування, реабілітацію або будь-що інше: виплата не залежить від чеків і інших полісів.",
                en: "An accident policy is personal life and health insurance. If the insured person suffers an injury, loses working capacity or dies as a result of an accident, the insurer pays money within the chosen insured sum — from UAH 10,000 to 300,000. The money can be spent on treatment, rehabilitation or anything else: the payout does not depend on receipts or other policies.",
              })}
            </p>
            <p className="mt-3 text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
              {t({
                uk: "На volya.finance поліс від нещасних випадків оформлюється онлайн за 5 хвилин: без візиту в офіс, із реальними цінами страхової та електронним полісом на email.",
                en: "On volya.finance an accident policy is issued online in 5 minutes: no office visit, real insurer prices and an electronic policy by email.",
              })}
            </p>
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{t({ uk: "Що покриває поліс", en: "What the policy covers" })}</h3>
            <ul className="mt-4 space-y-3">
              {COVER.map((c, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                  <c.icon className="mt-0.5 h-5 w-5 shrink-0 text-indigo-500" aria-hidden />
                  <span>{t({ uk: c.uk, en: c.en })}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Для кого */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
            {t({ uk: "Кому потрібне страхування від нещасного випадку", en: "Who needs accident insurance" })}
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {WHO.map((w) => (
              <div key={w.title.uk} className="rounded-2xl bg-white dark:bg-zinc-900 p-5 shadow-sm ring-1 ring-zinc-200/50 dark:ring-zinc-700">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300">
                  <w.icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{t(w.title)}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{t({ uk: w.uk, en: w.en })}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Умови + ціни */}
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
              {t({ uk: "Умови поліса НВ", en: "Policy terms" })}
            </h2>
            <dl className="mt-5 space-y-3 text-sm">
              {[
                { icon: Clock, k: { uk: "Строк", en: "Term" }, v: { uk: "10, 15, 30 днів, 3, 6, 9 місяців або 1 рік; початок дії — не раніше наступного дня.", en: "10, 15, 30 days, 3, 6, 9 months or 1 year; starts no earlier than the next day." } },
                { icon: Banknote, k: { uk: "Страхова сума", en: "Insured sum" }, v: { uk: "10 000 – 300 000 грн, фіксовані варіанти.", en: "UAH 10,000 – 300,000, fixed options." } },
                { icon: Globe, k: { uk: "Територія", en: "Territory" }, v: { uk: "Україна або весь світ.", en: "Ukraine or worldwide." } },
                { icon: Clock, k: { uk: "Час дії захисту", en: "Coverage hours" }, v: { uk: "Цілодобово, лише в години навчання/роботи або лише під час тренувань і змагань.", en: "Around the clock, during study/work hours only, or during training and competitions only." } },
                { icon: HeartPulse, k: { uk: "Вік застрахованого", en: "Insured age" }, v: { uk: "Від 1 до 75 років.", en: "From 1 to 75 years." } },
              ].map((row) => (
                <div key={row.k.uk} className="flex gap-3 rounded-xl bg-white dark:bg-zinc-900 p-4 ring-1 ring-zinc-200/50 dark:ring-zinc-700">
                  <row.icon className="mt-0.5 h-5 w-5 shrink-0 text-indigo-500" aria-hidden />
                  <div>
                    <dt className="font-semibold text-zinc-900 dark:text-zinc-100">{t(row.k)}</dt>
                    <dd className="mt-0.5 text-zinc-600 dark:text-zinc-300">{t(row.v)}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
              {t({ uk: "Скільки коштує страхування від нещасних випадків", en: "How much does accident insurance cost" })}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              {t({
                uk: "Ціна залежить від віку, строку, страхової суми, території та фактора ризику (спорт, воєнні ризики, професія). Орієнтовні ціни ІНГО:",
                en: "The price depends on age, term, insured sum, territory and risk factor (sports, war risks, occupation). Indicative INGO prices:",
              })}
            </p>
            <div className="mt-4 overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 ring-1 ring-zinc-200/50 dark:ring-zinc-700">
              <table className="w-full text-sm">
                <caption className="sr-only">{t({ uk: "Приклади цін поліса НВ", en: "Example accident policy prices" })}</caption>
                <tbody>
                  {PRICES.map((p) => (
                    <tr key={p.uk} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                      <th scope="row" className="px-4 py-3 text-left font-normal text-zinc-600 dark:text-zinc-300">{t({ uk: p.uk, en: p.en })}</th>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-zinc-900 dark:text-zinc-100">{p.price} {t({ uk: "грн", en: "UAH" })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
              {t({ uk: "Точну ціну для ваших параметрів показує калькулятор вище.", en: "The calculator above shows the exact price for your parameters." })}
            </p>
          </div>
        </div>

        {/* Як оформити */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
            {t({ uk: "Як оформити поліс НВ онлайн", en: "How to buy an accident policy online" })}
          </h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={i} className="rounded-2xl bg-white dark:bg-zinc-900 p-5 shadow-sm ring-1 ring-zinc-200/50 dark:ring-zinc-700">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">{i + 1}</span>
                <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{t({ uk: s.uk, en: s.en })}</p>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">
            {t({ uk: "Їдете за кордон? Для лікування в подорожі потрібне ", en: "Travelling abroad? For medical treatment on a trip you need " })}
            <Link href="/tourism" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">{t({ uk: "туристичне страхування", en: "travel insurance" })}</Link>
            {t({ uk: ", а поліс НВ доповнює його грошовою виплатою. Питання — ", en: ", and an accident policy adds a cash payout on top. Questions — " })}
            <Link href="/support" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">{t({ uk: "напишіть у підтримку", en: "contact support" })}</Link>.
          </p>
        </div>
      </div>
    </section>
  );
}
