// Реєструє контекст фіналізації одразу після declare (fire-and-forget). Завдяки
// цьому /payment-success може укласти договір для БУДЬ-ЯКОГО продукту, а не лише
// ОСЦПВ, і зберегти поліс у кабінет — навіть якщо клієнта редіректнуло з модалки.
export interface PendingOrderInput {
  orderId: string;
  product: "osago" | "tourism" | "greencard" | "housing" | "pets" | "mini-kasko";
  order?: Record<string, unknown>; // повний order — потрібен лише туризму
  meta?: {
    email?: string | null;
    phone?: string | null;
    customerName?: string | null;
    customer?: Record<string, unknown> | null;
    company?: string | null;
    price?: number | null;
    vehicle?: Record<string, unknown> | null;
    startDate?: string | null;
    endDate?: string | null;
    productLabel?: string | null;
  };
}

export function registerPendingOrder(input: PendingOrderInput): void {
  if (!input.orderId) return;
  void fetch("/api/pending-order", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
    keepalive: true,
  }).catch(() => {});
}
