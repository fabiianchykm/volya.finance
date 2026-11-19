// Оплата частинами (розстрочка). Поки в API Ukasko її немає — показуємо опцію
// зі статусом «скоро» на кроці оплати, щоб клієнт бачив, що вона буде, і ми
// міряли інтерес (клік по неактивній опції → подія в аналітиці).
//
// Правило (узгоджене зі страховими, 18.11.2026): розстрочка доступна лише для
// певних страхових, і лише на ДОРОЖЧУ з двох пропозицій однієї компанії (кожна з
// них подає дві). Дешевша пропозиція — лише повна оплата карткою. Сума — не менша
// за INSTALLMENT_MIN. Коли Ukasko віддасть розстрочку — перемкнути INSTALLMENT_ENABLED.

import { insurerSlug } from "./offer-ranking";

export const INSTALLMENT_ENABLED = true;
/** При оплаті частинами бонуси й промокоди НЕ застосовуються — списується повна вартість
 *  (комісію банку покриваємо з маржі, тож знижку з комісії дати не можемо). */
export const INSTALLMENT_NO_DISCOUNTS = true;
export const INSTALLMENT_MIN = 500;
/** Слаги страхових (lib/insurers), у яких доступна розстрочка. */
export const INSTALLMENT_INSURERS = ["usg", "utsk", "inho", "pzu", "inter-polis", "express"];

export type InstallmentState = "enabled" | "soon" | null;

/** Стан опції для конкретної пропозиції: null — не показувати. */
export function installmentState(amount: number | null | undefined, eligible: boolean): InstallmentState {
  if (!eligible) return null;
  if (!amount || amount < INSTALLMENT_MIN) return null;
  return INSTALLMENT_ENABLED ? "enabled" : "soon";
}

/**
 * Які пропозиції зі списку мають право на розстрочку: для кожної страхової зі
 * списку INSTALLMENT_INSURERS, що подала ≥2 пропозиції, — найдорожча з них.
 */
export function installmentEligibleOffers<T extends { offerId: string; companyName: string; price: number }>(offers: T[]): Set<string> {
  const groups = new Map<string, T[]>();
  for (const o of offers) {
    const slug = insurerSlug(o.companyName);
    if (!slug || !INSTALLMENT_INSURERS.includes(slug)) continue;
    const list = groups.get(slug) ?? [];
    list.push(o);
    groups.set(slug, list);
  }
  const out = new Set<string>();
  for (const list of groups.values()) {
    if (list.length < 2) continue;
    const top = list.reduce((a, b) => (b.price > a.price ? b : a));
    out.add(top.offerId);
  }
  return out;
}
