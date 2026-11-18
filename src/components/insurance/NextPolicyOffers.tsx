"use client";

import Link from "next/link";
import { ArrowRight, Car, Gift, Globe, HeartPulse, Home, PawPrint, Plane, Route, ShieldCheck, Sparkles, type LucideIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { trackEvent } from "@/lib/analytics";
import { GIFT_LAUNCH_LABEL, GIFT_PRESETS, isGiftLaunched } from "@/lib/gift-constants";

// Крос-продаж на екрані «Поліс оформлено» — «круговорот»: кожен куплений поліс веде
// до наступного, що логічно його доповнює (автоцивілка → міні-КАСКО/КАСКО/НВ,
// туристичне → НВ/Зелена карта, житло → тварини/НВ…), а внизу завжди подарунковий
// сертифікат. Віньєтку повернемо в пропозиції ЗК/туризму після запуску (VIGNETTE_LAUNCHED).
// сертифікат. Лише посилання на калькулятори, без автозаповнення — клієнт сам вирішує.

type ProductKey = "osago" | "greencard" | "kasko" | "mini-kasko" | "accident" | "tourism" | "housing" | "pets" | "vignette";
type Tr = { uk: string; en: string };

const CATALOG: Record<ProductKey, { href: string; icon: LucideIcon; title: Tr; tint: string; hint?: Tr }> = {
  osago: { href: "/osago", icon: Car, title: { uk: "Автоцивілка", en: "MTPL (OSAGO)" }, tint: "from-indigo-500 to-indigo-700", hint: { uk: "21+ страхових", en: "21+ insurers" } },
  greencard: { href: "/green-card", icon: Globe, title: { uk: "Зелена карта", en: "Green Card" }, tint: "from-violet-500 to-purple-700", hint: { uk: "за номером авто", en: "by plate number" } },
  kasko: { href: "/kasko", icon: ShieldCheck, title: { uk: "КАСКО", en: "CASCO" }, tint: "from-blue-600 to-indigo-700", hint: { uk: "повний захист авто", en: "full car cover" } },
  "mini-kasko": { href: "/mini-kasko", icon: Car, title: { uk: "Міні-КАСКО", en: "Mini-CASCO" }, tint: "from-sky-500 to-blue-700", hint: { uk: "ключові ризики за доступною ціною", en: "key risks at a fair price" } },
  accident: { href: "/accident", icon: HeartPulse, title: { uk: "Нещасний випадок", en: "Accident insurance" }, tint: "from-rose-500 to-pink-700", hint: { uk: "від 159 ₴ на рік", en: "from UAH 159 a year" } },
  tourism: { href: "/tourism", icon: Plane, title: { uk: "Туристичне", en: "Travel insurance" }, tint: "from-cyan-500 to-sky-700", hint: { uk: "Шенген і весь світ", en: "Schengen & worldwide" } },
  housing: { href: "/housing", icon: Home, title: { uk: "Житло", en: "Property" }, tint: "from-amber-500 to-orange-700", hint: { uk: "квартира чи будинок", en: "flat or house" } },
  pets: { href: "/pets", icon: PawPrint, title: { uk: "Тварини", en: "Pets" }, tint: "from-emerald-500 to-teal-700", hint: { uk: "коти й собаки", en: "cats and dogs" } },
  vignette: { href: "/vignette", icon: Route, title: { uk: "Віньєтка", en: "Vignette" }, tint: "from-slate-600 to-indigo-700", hint: { uk: "9 країн Європи", en: "9 European countries" } },
};

type Suggestion = { key: ProductKey; tag: Tr; text: Tr };

// Заголовок блоку й пропозиції для кожного щойно купленого продукту.
const PLAN: Record<ProductKey, { heading: Tr; items: Suggestion[] }> = {
  osago: {
    heading: { uk: "Чуже авто захищене. А ваше — і ви самі?", en: "The other car is covered. What about yours — and you?" },
    items: [
      { key: "mini-kasko", tag: { uk: "Те саме авто", en: "Same car" }, text: { uk: "Автоцивілка платить лише потерпілому. Міні-КАСКО відшкодує ремонт вашого авто після ДТП.", en: "MTPL only pays the other party. Mini-CASCO covers repairs to your own car after an accident." } },
      { key: "kasko", tag: { uk: "Максимальний захист", en: "Full protection" }, text: { uk: "ДТП, викрадення, стихія, вандалізм — повне КАСКО закриває все, за що не платить автоцивілка.", en: "Accidents, theft, weather, vandalism — full CASCO covers everything MTPL doesn't." } },
      { key: "accident", tag: { uk: "Водій і пасажири", en: "Driver & passengers" }, text: { uk: "Виплата при травмі в ДТП — незалежно від того, хто винен.", en: "A payout if injured in an accident — whoever is at fault." } },
    ],
  },
  greencard: {
    heading: { uk: "За кордон їдете захищеними. Доповніть поїздку", en: "You're covered abroad. Complete the trip" },
    items: [
      { key: "tourism", tag: { uk: "Для подорожі", en: "For the trip" }, text: { uk: "Лікування за кордоном коштує тисячі євро — туристичне покриє медичні витрати в дорозі.", en: "Medical care abroad costs thousands — travel insurance covers it on the road." } },
      { key: "mini-kasko", tag: { uk: "Те саме авто", en: "Same car" }, text: { uk: "Зелена карта покриває шкоду іншим. Міні-КАСКО — ремонт вашого авто після ДТП.", en: "The Green Card covers damage to others. Mini-CASCO covers repairs to your own car." } },
      { key: "accident", tag: { uk: "Водій і пасажири", en: "Driver & passengers" }, text: { uk: "Виплата при травмі в ДТП — у поїздці й удома, цілий рік.", en: "A payout if injured in an accident — on the trip and at home, all year." } },
    ],
  },
  kasko: {
    heading: { uk: "Авто захищене повністю. Подбайте про людей", en: "The car is fully covered. Now the people" },
    items: [
      { key: "accident", tag: { uk: "Водій і пасажири", en: "Driver & passengers" }, text: { uk: "КАСКО ремонтує авто, а виплату за травму водію й пасажирам дає страховка від нещасного випадку.", en: "CASCO repairs the car; accident insurance pays the driver and passengers if injured." } },
      { key: "greencard", tag: { uk: "Для поїздки", en: "For trips" }, text: { uk: "Для виїзду автівкою за кордон потрібна Зелена карта — оформлюється за номером.", en: "Driving abroad needs a Green Card — issued by plate number." } },
      { key: "housing", tag: { uk: "Для дому", en: "For home" }, text: { uk: "Квартира чи будинок — від пожежі, затоплення й крадіжки.", en: "Flat or house — against fire, flooding and theft." } },
    ],
  },
  "mini-kasko": {
    heading: { uk: "Ваше авто під захистом. Що далі?", en: "Your car is covered. What's next?" },
    items: [
      { key: "kasko", tag: { uk: "Розширити захист", en: "Upgrade" }, text: { uk: "Міні-КАСКО закриває ключові ризики. Повне КАСКО — ще й викрадення, стихію і вандалізм.", en: "Mini-CASCO covers the key risks. Full CASCO adds theft, weather and vandalism." } },
      { key: "accident", tag: { uk: "Водій і пасажири", en: "Driver & passengers" }, text: { uk: "Авто застраховане, а люди в ньому? Виплата при травмі в ДТП.", en: "The car is insured — what about the people in it? A payout if injured." } },
      { key: "greencard", tag: { uk: "Для поїздки", en: "For trips" }, text: { uk: "Для виїзду автівкою за кордон потрібна Зелена карта.", en: "A Green Card is required to drive abroad." } },
    ],
  },
  tourism: {
    heading: { uk: "Медицина в поїздці є. Закрийте решту ризиків", en: "Medical cover is set. Close the other risks" },
    items: [
      { key: "accident", tag: { uk: "Для вас", en: "For you" }, text: { uk: "Травма не лише в поїздці: виплата при нещасному випадку цілий рік, де б ви не були.", en: "Injury cover beyond the trip: a payout after an accident all year, wherever you are." } },
      { key: "greencard", tag: { uk: "Своїм авто", en: "Own car" }, text: { uk: "Їдете автівкою? За кордоном для неї потрібна Зелена карта.", en: "Driving your own car? It needs a Green Card abroad." } },
      { key: "housing", tag: { uk: "Поки вас немає", en: "While away" }, text: { uk: "Застрахуйте квартиру від затоплення, пожежі й крадіжки на час відпустки.", en: "Insure your home against flooding, fire and theft while you're on holiday." } },
    ],
  },
  accident: {
    heading: { uk: "Ви захищені. Тепер — близькі й майно", en: "You're covered. Now family and property" },
    items: [
      { key: "tourism", tag: { uk: "Для подорожі", en: "For trips" }, text: { uk: "Для поїздок за кордон — медичне страхування мандрівника, підходить для віз.", en: "For trips abroad — traveller's medical insurance, valid for visas." } },
      { key: "housing", tag: { uk: "Для дому", en: "For home" }, text: { uk: "Квартира чи будинок — від пожежі, затоплення й крадіжки.", en: "Flat or house — against fire, flooding and theft." } },
      { key: "osago", tag: { uk: "Є авто?", en: "Have a car?" }, text: { uk: "Автоцивілка за номером авто — порівняння 21+ страхових за хвилину.", en: "MTPL by plate number — compare 21+ insurers in a minute." } },
    ],
  },
  housing: {
    heading: { uk: "Дім під захистом. А ті, хто в ньому живе?", en: "Home is covered. What about those who live in it?" },
    items: [
      { key: "pets", tag: { uk: "Улюбленці", en: "Pets" }, text: { uk: "Є кіт чи собака? Страхування покриє лікування у ветеринара.", en: "Have a cat or a dog? Pet insurance covers vet treatment." } },
      { key: "accident", tag: { uk: "Для родини", en: "For family" }, text: { uk: "Виплата при травмі чи нещасному випадку — для вас і близьких.", en: "A payout after an injury or accident — for you and your family." } },
      { key: "osago", tag: { uk: "Є авто?", en: "Have a car?" }, text: { uk: "Автоцивілка за номером авто — порівняння 21+ страхових за хвилину.", en: "MTPL by plate number — compare 21+ insurers in a minute." } },
    ],
  },
  vignette: {
    heading: { uk: "Дороги оплачено. А авто й люди в ньому?", en: "Tolls are paid. What about the car and the people in it?" },
    items: [
      { key: "greencard", tag: { uk: "Обовʼязково в ЄС", en: "Mandatory in the EU" }, text: { uk: "Без Зеленої карти за кордон не випустять — міжнародна автоцивілка за номером авто.", en: "You can't cross the border without a Green Card — international MTPL by plate number." } },
      { key: "tourism", tag: { uk: "Для подорожі", en: "For the trip" }, text: { uk: "Лікування за кордоном коштує тисячі євро — туристичне покриє медичні витрати в дорозі.", en: "Medical care abroad costs thousands — travel insurance covers it on the road." } },
      { key: "mini-kasko", tag: { uk: "Те саме авто", en: "Same car" }, text: { uk: "Ремонт вашого авто після ДТП у поїздці — міні-КАСКО за доступною ціною.", en: "Repairs to your car after an accident on the trip — Mini-CASCO at a fair price." } },
    ],
  },
  pets: {
    heading: { uk: "Улюбленець захищений. Подбайте й про себе", en: "Your pet is covered. Now take care of yourself" },
    items: [
      { key: "housing", tag: { uk: "Для дому", en: "For home" }, text: { uk: "Квартира чи будинок — від пожежі, затоплення й крадіжки.", en: "Flat or house — against fire, flooding and theft." } },
      { key: "accident", tag: { uk: "Для родини", en: "For family" }, text: { uk: "Виплата при травмі чи нещасному випадку — для вас і близьких.", en: "A payout after an injury or accident — for you and your family." } },
      { key: "tourism", tag: { uk: "Для подорожі", en: "For trips" }, text: { uk: "Для поїздок за кордон — медичне страхування мандрівника.", en: "For trips abroad — traveller's medical insurance." } },
    ],
  },
};

// Назви продукту в різних місцях різні (pending_orders, policies, чекаути).
function normalizeProduct(p?: string | null): ProductKey {
  const v = (p ?? "").trim().toLowerCase();
  if (v === "greencard" || v === "green-card" || v.includes("зелен")) return "greencard";
  if (v === "mini-kasko" || v === "minikasko" || v.includes("міні")) return "mini-kasko";
  if (v === "kasko" || v.includes("каско")) return "kasko";
  if (v === "accident" || v.includes("нещас")) return "accident";
  if (v === "tourism" || v.includes("турист")) return "tourism";
  if (v === "housing" || v === "home" || v.includes("житл")) return "housing";
  if (v === "pets" || v.includes("тварин")) return "pets";
  if (v === "vignette" || v.includes("віньєт")) return "vignette";
  return "osago";
}

export function NextPolicyOffers({ product, className = "" }: { product?: string | null; className?: string }) {
  const { t } = useI18n();
  const from = normalizeProduct(product);
  const { heading, items } = PLAN[from];
  const giftLaunched = isGiftLaunched();

  return (
    <div className={`w-full text-left ${className}`}>
      <div className="mb-3">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
          <Sparkles className="h-3 w-3" />
          {t({ uk: "Що ще варто оформити", en: "What else is worth insuring" })}
        </p>
        <h3 className="mt-2 text-base font-bold leading-snug text-zinc-900 dark:text-zinc-100">{t(heading)}</h3>
      </div>

      <ul className="space-y-2.5">
        {items.map((s, i) => {
          const c = CATALOG[s.key];
          const Icon = c.icon;
          return (
            <li key={s.key}>
              <Link
                href={c.href}
                onClick={() => trackEvent("cross_sell_click", { from, to: s.key, position: i + 1 })}
                className="group flex items-stretch gap-3 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-indigo-800"
              >
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center self-center rounded-xl bg-gradient-to-br ${c.tint} text-white shadow-sm`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{t(c.title)}</span>
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">{t(s.tag)}</span>
                  </span>
                  <span className="mt-1 block text-xs leading-snug text-zinc-600 dark:text-zinc-400">{t(s.text)}</span>
                  {c.hint && <span className="mt-1.5 block text-[11px] font-medium text-indigo-600 dark:text-indigo-300">{t(c.hint)}</span>}
                </span>
                <span className="flex shrink-0 items-center self-center text-zinc-300 transition-colors group-hover:text-indigo-600 dark:text-zinc-600 dark:group-hover:text-indigo-300">
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Подарунковий сертифікат — завжди внизу, після будь-якого продукту. */}
      <Link
        href="/gift"
        onClick={() => trackEvent("cross_sell_click", { from, to: "gift", position: items.length + 1 })}
        className="group relative mt-3 flex items-center gap-3 overflow-hidden rounded-2xl p-4 text-white shadow-md transition-transform hover:-translate-y-0.5"
        style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #4338ca 45%, #6d28d9 100%)" }}
      >
        <span aria-hidden className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
          <Gift className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-bold">{t({ uk: "Подарунковий сертифікат", en: "Gift certificate" })}</span>
            {!giftLaunched && (
              <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-100 ring-1 ring-white/20">
                {t({ uk: `з ${GIFT_LAUNCH_LABEL.uk}`, en: `from ${GIFT_LAUNCH_LABEL.en}` })}
              </span>
            )}
          </span>
          <span className="mt-1 block text-xs leading-snug text-indigo-100">
            {t({ uk: `Подаруйте близьким захист на будь-який поліс — від ${GIFT_PRESETS[0].toLocaleString("uk-UA")} ₴.`, en: `Give your loved ones cover for any policy — from UAH ${GIFT_PRESETS[0].toLocaleString("en-US")}.` })}
          </span>
        </span>
        <ArrowRight className="h-4 w-4 shrink-0 text-indigo-200 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}
