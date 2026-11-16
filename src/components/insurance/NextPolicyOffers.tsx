"use client";

import Link from "next/link";
import { ArrowRight, Car, Globe, HeartPulse, Home, PawPrint, Plane, ShieldCheck, type LucideIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { trackEvent } from "@/lib/analytics";

// Крос-продаж на екрані «Поліс оформлено»: 2–3 продукти, що логічно доповнюють
// щойно куплений (після автоцивілки — Зелена карта, міні-КАСКО, НВ тощо). Лише
// посилання на калькулятори, без автозаповнення — клієнт сам вирішує.

type ProductKey = "osago" | "greencard" | "mini-kasko" | "accident" | "tourism" | "housing" | "pets";

const CATALOG: Record<ProductKey, { href: string; icon: LucideIcon; uk: string; en: string }> = {
  osago: { href: "/osago", icon: ShieldCheck, uk: "Автоцивілка", en: "MTPL (OSAGO)" },
  greencard: { href: "/green-card", icon: Globe, uk: "Зелена карта", en: "Green Card" },
  "mini-kasko": { href: "/mini-kasko", icon: Car, uk: "Міні-КАСКО", en: "Mini-CASCO" },
  accident: { href: "/accident", icon: HeartPulse, uk: "Нещасний випадок", en: "Accident insurance" },
  tourism: { href: "/tourism", icon: Plane, uk: "Туристичне", en: "Travel insurance" },
  housing: { href: "/housing", icon: Home, uk: "Житло", en: "Property" },
  pets: { href: "/pets", icon: PawPrint, uk: "Тварини", en: "Pets" },
};

const SUGGESTIONS: Record<ProductKey, { key: ProductKey; uk: string; en: string }[]> = {
  osago: [
    { key: "greencard", uk: "Плануєте виїзд за кордон? Автоцивілка там не діє — на це авто потрібна Зелена карта.", en: "Driving abroad? Your MTPL policy doesn't work there — this car needs a Green Card." },
    { key: "mini-kasko", uk: "Автоцивілка платить лише за чуже авто. Міні-КАСКО відшкодує ремонт вашого після ДТП.", en: "MTPL only pays for the other car. Mini-CASCO covers repairs to yours after an accident." },
    { key: "accident", uk: "Виплата водію й пасажирам при травмі в ДТП — незалежно від того, хто винен.", en: "A payout to the driver and passengers if injured in an accident — whoever is at fault." },
  ],
  greencard: [
    { key: "tourism", uk: "Лікування за кордоном коштує дорого — туристичне покриє медичні витрати в поїздці.", en: "Medical care abroad is expensive — travel insurance covers it on the trip." },
    { key: "mini-kasko", uk: "Зелена карта покриває шкоду іншим. Міні-КАСКО — ремонт вашого авто після ДТП.", en: "The Green Card covers damage to others. Mini-CASCO covers repairs to your own car." },
    { key: "osago", uk: "Перевірте, чи чинна автоцивілка в Україні, — продовжити можна за хвилину.", en: "Check that your MTPL policy in Ukraine is still valid — renewing takes a minute." },
  ],
  "mini-kasko": [
    { key: "accident", uk: "Авто захищене, а водій і пасажири? Виплата при травмі в ДТП.", en: "The car is covered — what about the driver and passengers? A payout if injured." },
    { key: "greencard", uk: "Для поїздки автівкою за кордон потрібна Зелена карта.", en: "A Green Card is required to drive abroad." },
    { key: "osago", uk: "Автоцивілка обовʼязкова — перевірте термін дії та продовжіть онлайн.", en: "MTPL is mandatory — check the expiry date and renew online." },
  ],
  tourism: [
    { key: "greencard", uk: "Їдете своїм авто? За кордоном для нього потрібна Зелена карта.", en: "Taking your own car? It needs a Green Card abroad." },
    { key: "accident", uk: "Захист від травм не лише в поїздці: виплата при нещасному випадку цілий рік.", en: "Injury cover beyond the trip: a payout after an accident all year round." },
    { key: "housing", uk: "Поки ви у відпустці — застрахуйте квартиру від затоплення, пожежі й крадіжки.", en: "While you're away — insure your home against flooding, fire and theft." },
  ],
  accident: [
    { key: "tourism", uk: "Для поїздок за кордон — медичне страхування мандрівника.", en: "For trips abroad — traveller's medical insurance." },
    { key: "housing", uk: "Захист квартири чи будинку від затоплення, пожежі та крадіжки.", en: "Protect your flat or house against flooding, fire and theft." },
    { key: "osago", uk: "Є авто? Автоцивілка оформлюється онлайн за кілька хвилин.", en: "Have a car? MTPL is issued online in a few minutes." },
  ],
  housing: [
    { key: "accident", uk: "Виплата при травмі чи нещасному випадку — для вас і родини.", en: "A payout after an injury or accident — for you and your family." },
    { key: "pets", uk: "Є кіт чи собака? Страхування покриє лікування улюбленця.", en: "Have a cat or a dog? Pet insurance covers their treatment." },
    { key: "osago", uk: "Є авто? Автоцивілка оформлюється онлайн за кілька хвилин.", en: "Have a car? MTPL is issued online in a few minutes." },
  ],
  pets: [
    { key: "housing", uk: "Захист квартири чи будинку від затоплення, пожежі та крадіжки.", en: "Protect your flat or house against flooding, fire and theft." },
    { key: "accident", uk: "Виплата при травмі чи нещасному випадку — для вас і родини.", en: "A payout after an injury or accident — for you and your family." },
    { key: "osago", uk: "Є авто? Автоцивілка оформлюється онлайн за кілька хвилин.", en: "Have a car? MTPL is issued online in a few minutes." },
  ],
};

// Назви продукту в різних місцях різні (pending_orders, policies, чекаути).
function normalizeProduct(p?: string | null): ProductKey {
  const v = (p ?? "").trim().toLowerCase();
  if (v === "greencard" || v === "green-card" || v.includes("зелен")) return "greencard";
  if (v === "mini-kasko" || v === "minikasko" || v.includes("каско")) return "mini-kasko";
  if (v === "accident" || v.includes("нещас")) return "accident";
  if (v === "tourism" || v.includes("турист")) return "tourism";
  if (v === "housing" || v === "home" || v.includes("житл")) return "housing";
  if (v === "pets" || v.includes("тварин")) return "pets";
  return "osago";
}

export function NextPolicyOffers({ product, className = "" }: { product?: string | null; className?: string }) {
  const { t } = useI18n();
  const from = normalizeProduct(product);
  const items = SUGGESTIONS[from];
  return (
    <div className={`w-full text-left ${className}`}>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {t({ uk: "Що ще варто оформити", en: "What else is worth insuring" })}
      </p>
      <ul className="divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-700">
        {items.map((s) => {
          const c = CATALOG[s.key];
          const Icon = c.icon;
          return (
            <li key={s.key}>
              <Link
                href={c.href}
                onClick={() => trackEvent("cross_sell_click", { from, to: s.key })}
                className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">{t({ uk: c.uk, en: c.en })}</span>
                  <span className="block text-xs leading-snug text-zinc-500 dark:text-zinc-400">{t({ uk: s.uk, en: s.en })}</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-zinc-400" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
