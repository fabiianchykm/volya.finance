// Знижки на ОСЦПВ, ВЖЕ враховані в ціні, яку віддає API. Для маркетингу показуємо
// «стару» ціну (до знижки) закресленою: original = price / (1 - pct/100).
// pct — відсоток знижки для конкретної страхової.
const OSAGO_DISCOUNTS: { match: RegExp; pct: number }[] = [
  { match: /\bтас\b|«?тас»?/i,          pct: 42.38 },
  { match: /арсенал/i,                  pct: 29.36 },
  { match: /інго|ingo/i,                pct: 29.17 },
  { match: /княжа/i,                    pct: 28.64 },
  { match: /ютіко|ютико|utico/i,        pct: 14.72 },
  { match: /гардіан|guardian/i,         pct: 10.10 },
  { match: /інтер[\s-]?поліс|inter[\s-]?polis/i, pct: 10.01 },
  { match: /євроінс|euroins/i,          pct: 8.95 },
  { match: /оранта/i,                   pct: 8.85 },
  { match: /експрес|express/i,          pct: 7.14 },
];

/** Відсоток знижки для страхової (0..100) або null, якщо знижки нема. */
export function osagoDiscountPct(companyName: string | undefined): number | null {
  if (!companyName) return null;
  return OSAGO_DISCOUNTS.find((d) => d.match.test(companyName))?.pct ?? null;
}

/**
 * «Стара» ціна (до знижки) для показу закресленою, або null якщо для цієї страхової
 * знижки нема. price — актуальна ціна з API (уже зі знижкою).
 */
export function osagoStrikePrice(companyName: string | undefined, price: number): number | null {
  const pct = osagoDiscountPct(companyName);
  if (pct == null || !(price > 0)) return null;
  const original = Math.round(price / (1 - pct / 100));
  return original > price ? original : null;
}
