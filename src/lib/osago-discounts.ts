// Знижки на ОСЦПВ, ВЖЕ враховані в ціні, яку віддає API. Для маркетингу показуємо
// «стару» ціну (до знижки) закресленою: original = price / (1 - pct/100).
// pct — відсоток знижки для конкретної страхової.
// Знижки прибрано — не показуємо «стару» ціну/відсоток. Список порожній, тож
// функції нижче повертають null (заглушка лишена, щоб не чіпати місця виклику).
const OSAGO_DISCOUNTS: { match: RegExp; pct: number }[] = [];

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
