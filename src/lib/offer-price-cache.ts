// Ціна й стеля знижки пропозиції за offerId — щоб роут заявки міг перевести бонуси
// (грн) у discountPercent за СЕРВЕРНОЮ ціною, а не за тією, що прислав клієнт.
// Пропозиції Ukasko v2 живуть до кінця доби, тож TTL 24 год достатньо. Кеш
// процесний: при промаху (інший інстанс) роут бере ціну з тіла запиту, але
// додатково звіряє фактичну знижку з відповіді Ukasko.

interface CachedOffer { price: number; maxDiscount: number | null; expires: number }

const TTL_MS = 24 * 60 * 60 * 1000;
const cache = new Map<string, CachedOffer>();

export function rememberOfferPrices(offers: { offerId: string; price: number; maxDiscount?: number | null }[]): void {
  const now = Date.now();
  for (const o of offers) {
    if (!o.offerId || !(o.price > 0)) continue;
    cache.set(o.offerId, { price: o.price, maxDiscount: typeof o.maxDiscount === "number" ? o.maxDiscount : null, expires: now + TTL_MS });
  }
  if (cache.size > 5000) {
    for (const [k, v] of cache) if (v.expires <= now) cache.delete(k);
  }
}

export function lookupOfferPrice(offerId: string): { price: number; maxDiscount: number | null } | null {
  const hit = cache.get(offerId);
  if (!hit) return null;
  if (hit.expires <= Date.now()) { cache.delete(offerId); return null; }
  return { price: hit.price, maxDiscount: hit.maxDiscount };
}
