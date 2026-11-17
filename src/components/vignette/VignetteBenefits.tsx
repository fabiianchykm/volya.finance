"use client";

import { Car, Zap, ShieldAlert, Smartphone, Globe, Receipt, type LucideIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { VIGNETTE_COUNTRIES, VIGNETTE_PERIODS } from "./vignette-options";

type Tr = { uk: string; en: string };

const BENEFITS: { icon: LucideIcon; title: Tr; desc: Tr }[] = [
  { icon: Car, title: { uk: "За номером авто", en: "By plate number" }, desc: { uk: "Електронна віньєтка привʼязується до держномера — камери на автобанах бачать її автоматично. Жодних наліпок на склі.", en: "The e-vignette is tied to your plate — motorway cameras read it automatically. No windscreen stickers." } },
  { icon: Zap, title: { uk: "Діє з обраної дати", en: "Valid from your date" }, desc: { uk: "Оберіть день початку поїздки — віньєтка активується саме тоді, і жоден день не згорає даремно.", en: "Pick the first day of the trip — the vignette activates exactly then, no wasted days." } },
  { icon: ShieldAlert, title: { uk: "Без штрафів", en: "No fines" }, desc: { uk: "Проїзд без віньєтки в Австрії чи Чехії коштує від €120 до €300 і більше. Віньєтка на 10 днів — у 10–20 разів дешевша.", en: "Driving without a vignette in Austria or Czechia costs €120–300 or more. A 10-day vignette is 10–20× cheaper." } },
  { icon: Globe, title: { uk: "Кілька країн за раз", en: "Several countries at once" }, desc: { uk: "Їдете через Угорщину в Австрію й далі в Словенію? Оформимо всі віньєтки маршруту однією заявкою.", en: "Driving through Hungary to Austria and on to Slovenia? We arrange every vignette on the route in one request." } },
  { icon: Smartphone, title: { uk: "Підтвердження на телефон", en: "Confirmation on your phone" }, desc: { uk: "Офіційне підтвердження оператора надходить у Telegram, Viber або на email — покажете при потребі.", en: "The operator's official confirmation arrives via Telegram, Viber or email — show it if ever asked." } },
  { icon: Receipt, title: { uk: "Оплата в гривні", en: "Pay in hryvnia" }, desc: { uk: "Без валютної картки й іноземних сайтів. Менеджер називає суму в гривні, ви оплачуєте — ми реєструємо.", en: "No foreign-currency card or foreign websites. The manager quotes a price in UAH, you pay — we register it." } },
];

export function VignetteBenefits() {
  const { t } = useI18n();
  const periodLabel = (v: string) => t(VIGNETTE_PERIODS.find((p) => p.value === v)?.label ?? { uk: v, en: v });
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="mb-12 text-center">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-3xl">{t({ uk: "Навіщо віньєтка і як це працює", en: "Why you need a vignette and how it works" })}</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-zinc-500 dark:text-zinc-400 sm:text-base">
          {t({ uk: "У низці країн Європи проїзд автобанами платний — без віньєтки камери фіксують порушення автоматично.", en: "In several European countries motorways are tolled — without a vignette, cameras record the violation automatically." })}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {BENEFITS.map(({ icon: Icon, title, desc }) => (
          <div key={title.uk} className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/40">
              <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{t(title)}</h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t(desc)}</p>
          </div>
        ))}
      </div>

      {/* Таблиця країн — і для людей, і для пошуку («віньєтка Австрія ціна»). */}
      <div className="mt-12">
        <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-2xl">{t({ uk: "Країни, строки й орієнтовні ціни", en: "Countries, periods and indicative prices" })}</h3>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t({ uk: "Легковий автомобіль до 3,5 т. Офіційні тарифи операторів на 2026 рік, точну суму в гривні називає менеджер.", en: "Car up to 3.5 t. Official operator tariffs for 2026; the exact price in UAH is quoted by the manager." })}</p>
        <div className="mt-5 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-800/60 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-semibold">{t({ uk: "Країна", en: "Country" })}</th>
                <th className="hidden px-4 py-3 font-semibold sm:table-cell">{t({ uk: "Строки", en: "Periods" })}</th>
                <th className="px-4 py-3 font-semibold">{t({ uk: "Орієнтир", en: "Indicative" })}</th>
                <th className="hidden px-4 py-3 font-semibold md:table-cell">{t({ uk: "Формат", en: "Format" })}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {VIGNETTE_COUNTRIES.map((c) => (
                <tr key={c.code}>
                  <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100"><span className="mr-2">{c.flag}</span>{t(c.name)}</td>
                  <td className="hidden px-4 py-3 text-zinc-600 dark:text-zinc-300 sm:table-cell">{c.periods.map(periodLabel).join(" · ")}</td>
                  <td className="px-4 py-3 font-medium text-indigo-700 dark:text-indigo-300">{t(c.hint)}</td>
                  <td className="hidden px-4 py-3 text-zinc-500 dark:text-zinc-400 md:table-cell">{t(c.note)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
          {t({ uk: "Польща, Німеччина, Хорватія, Італія, Франція та Іспанія віньєток не мають: там платять за окремі ділянки, мости чи тунелі на місці або онлайн.", en: "Poland, Germany, Croatia, Italy, France and Spain have no vignettes: individual sections, bridges or tunnels are paid on the spot or online." })}
        </p>
      </div>
    </section>
  );
}
