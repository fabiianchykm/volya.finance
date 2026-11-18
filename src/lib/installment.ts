// Оплата частинами (розстрочка). Поки в API Ukasko її немає — показуємо опцію
// зі статусом «скоро» на кроці оплати, щоб клієнт бачив, що вона буде, і ми
// міряли інтерес (клік по неактивній опції → подія в аналітиці).
//
// Умови показу: сума до оплати не менша за INSTALLMENT_MIN і продукт у списку
// INSTALLMENT_PRODUCTS (порожній список = усі продукти). Коли Ukasko віддасть
// розстрочку — перемкнути INSTALLMENT_ENABLED і вписати продукти.

export const INSTALLMENT_ENABLED = false;
/** При оплаті частинами бонуси й промокоди НЕ застосовуються — списується повна вартість
 *  (комісію банку покриваємо з маржі, тож знижку з комісії дати не можемо). */
export const INSTALLMENT_NO_DISCOUNTS = true;
export const INSTALLMENT_MIN = 500;
/** Ключі продуктів, де розстрочка доступна (osago, greencard, tourism, housing, pets, accident, mini-kasko, kasko). Порожній = усі. */
export const INSTALLMENT_PRODUCTS: string[] = [];

export type InstallmentState = "enabled" | "soon" | null;

export function installmentState(product: string | null | undefined, amount: number | null | undefined): InstallmentState {
  if (!amount || amount < INSTALLMENT_MIN) return null;
  const key = (product ?? "osago").toLowerCase();
  if (INSTALLMENT_PRODUCTS.length > 0 && !INSTALLMENT_PRODUCTS.includes(key)) return null;
  return INSTALLMENT_ENABLED ? "enabled" : "soon";
}
