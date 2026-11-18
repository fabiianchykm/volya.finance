import { INSURERS } from "./insurers";

// Сортування пропозицій: не лише за ціною, а й «Рекомендовані» — ціна + популярність
// страхової на volya.finance (скільки полісів цієї СК реально оформили клієнти).
// Популярність — об'єктивний сигнал із власної БД полісів (/api/insurers/popular),
// а не ручний «рейтинг»; якщо даних нема (БД недоступна) — рекомендовані = дешевші.

export type OfferSortKey = "recommended" | "price_asc" | "price_desc";

/** slug страхової → кількість оформлених полісів (за останній рік). */
export type InsurerPopularity = Record<string, number>;

export interface RankableOffer {
  price: number;
  company?: string | null;
}

/** slug з довідника INSURERS за публічною назвою СК, або null. */
export function insurerSlug(name: string | null | undefined): string | null {
  if (!name) return null;
  const hit = INSURERS.find((i) => i.match.test(name));
  return hit ? hit.slug : null;
}

export function popularityOf(name: string | null | undefined, pop: InsurerPopularity): number {
  const slug = insurerSlug(name);
  return slug ? pop[slug] ?? 0 : 0;
}

/**
 * Відсортовує пропозиції. «Рекомендовані»: 65% — наскільки ціна близька до найнижчої,
 * 35% — популярність СК серед наших клієнтів. Нічия — дешевша вище.
 */
export function rankOffers<T>(offers: T[], get: (o: T) => RankableOffer, sortBy: OfferSortKey, pop: InsurerPopularity): T[] {
  const list = [...offers];
  if (sortBy === "price_desc") return list.sort((a, b) => get(b).price - get(a).price);
  if (sortBy === "price_asc" || list.length === 0) return list.sort((a, b) => get(a).price - get(b).price);

  const prices = list.map((o) => get(o).price).filter((p) => p > 0);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPop = Math.max(0, ...list.map((o) => popularityOf(get(o).company, pop)));
  const score = (o: T) => {
    const { price, company } = get(o);
    const priceScore = price > 0 && minPrice > 0 ? minPrice / price : 0;
    const popScore = maxPop > 0 ? popularityOf(company, pop) / maxPop : 0;
    return 0.65 * priceScore + 0.35 * popScore;
  };
  return list.sort((a, b) => score(b) - score(a) || get(a).price - get(b).price);
}

export type OfferBadge = "cheapest" | "popular" | "both";

/** Ручний вибір «Популярний вибір» (слаги lib/insurers): якщо така СК є серед
 *  пропозицій, бейдж іде їй (найдешевшій її пропозиції) незалежно від статистики.
 *  Порожній масив — бейдж за фактичною популярністю серед наших клієнтів. */
export const POPULAR_PICK: string[] = ["tas"];

/** СК, яким не ставимо «Найвигідніше», навіть якщо їхня ціна найнижча (слаги lib/insurers).
 *  Бейдж переходить до наступної найдешевшої пропозиції. */
export const CHEAPEST_EXCLUDE: string[] = ["guardian"];

/**
 * Бейджі для карток: найдешевша пропозиція → «Найвигідніше»; пропозиція найпопулярнішої
 * СК (мінімум 3 оформлені поліси, щоб не «популяризувати» випадкову) → «Популярний вибір».
 * Повертає Map offerId → бейдж. Якщо всі СК однаково (не)популярні — лише «Найвигідніше».
 */
export function offerBadges<T>(offers: T[], get: (o: T) => RankableOffer & { id: string }, pop: InsurerPopularity): Map<string, OfferBadge> {
  const out = new Map<string, OfferBadge>();
  if (offers.length < 2) return out;
  let cheapest: T | null = null;
  for (const o of offers) {
    const slug = insurerSlug(get(o).company);
    if (slug && CHEAPEST_EXCLUDE.includes(slug)) continue;
    if (get(o).price > 0 && (!cheapest || get(o).price < get(cheapest).price)) cheapest = o;
  }
  if (cheapest) out.set(get(cheapest).id, "cheapest");

  // Ручний вибір має пріоритет над статистикою.
  const picked = offers.filter((o) => { const slug = insurerSlug(get(o).company); return !!slug && POPULAR_PICK.includes(slug); })
    .sort((a, b) => get(a).price - get(b).price)[0];
  if (picked) {
    const id = get(picked).id;
    out.set(id, out.get(id) === "cheapest" ? "both" : "popular");
    return out;
  }

  const withPop = offers.map((o) => ({ o, n: popularityOf(get(o).company, pop) }));
  const maxPop = Math.max(0, ...withPop.map((x) => x.n));
  if (maxPop >= 3 && withPop.filter((x) => x.n === maxPop).length === 1) {
    // Серед пропозицій найпопулярнішої СК — найдешевша (у неї може бути кілька програм).
    const top = withPop.filter((x) => x.n === maxPop).map((x) => x.o).sort((a, b) => get(a).price - get(b).price)[0];
    const id = get(top).id;
    out.set(id, out.get(id) === "cheapest" ? "both" : "popular");
  }
  return out;
}

export function badgeText(b: OfferBadge | undefined, t: (m: { uk: string; en: string }) => string): string | undefined {
  if (!b) return undefined;
  if (b === "cheapest") return t({ uk: "Найвигідніше", en: "Best value" });
  if (b === "popular") return t({ uk: "Популярний вибір", en: "Popular choice" });
  return t({ uk: "Найвигідніше · популярний вибір", en: "Best value · popular choice" });
}
