// Клієнтський шар подій конверсій. Кожну ключову дію (розрахунок вартості, лід,
// зворотний дзвінок, початок оплати, покупка) відправляємо ДВОМА шляхами:
//   1) window.dataLayer — семантична подія {event: name, ...params}, яку читає
//      Google Tag Manager (рекламники маплять її на конверсію Google Ads БЕЗ правок коду);
//   2) gtag('event', …) — напряму в GA4 (він активний уже зараз, тож події видно
//      в аналітиці ще до підключення GTM).
// Обидва шляхи незалежні: поки GTM немає, працює лише gtag; коли додадуть GTM —
// dataLayer-події вже чекатимуть на нього.

type EventParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(event: string, params: EventParams = {}): void {
  if (typeof window === "undefined") return;
  // Прибираємо undefined, щоб не засмічувати подію порожніми полями.
  const clean: EventParams = {};
  for (const [k, v] of Object.entries(params)) if (v !== undefined) clean[k] = v;
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, ...clean });
    if (typeof window.gtag === "function") window.gtag("event", event, clean);
  } catch {
    // Аналітика ніколи не має ламати основний потік.
  }
}

// Лід воронки: клієнт заповнив дані й перейшов до підтвердження (OTP/оплата).
// Шлемо в /api/track → зберігається в БД (/admin/leads) + пінг у sales-Telegram.
// keepalive — щоб долетіло, навіть якщо клієнт одразу залишить сторінку.
export interface CheckoutLead {
  product: string;
  name?: string;
  company?: string;
  price?: number;
  car?: string;
  phone?: string;
  email?: string;
}
export function trackCheckoutStarted(context: CheckoutLead): void {
  if (typeof window === "undefined") return;
  try {
    void fetch("/api/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ event: "checkout_started", step: "otp", context }),
      keepalive: true,
    }).catch(() => { /* воронка не має ламати оформлення */ });
  } catch { /* ignore */ }
}
