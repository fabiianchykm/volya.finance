import { savePolicy } from "@/lib/policies";
import { creditPolicyRewards } from "@/lib/referral";
import { getPendingOrder, markPendingFinalized, type PendingMeta } from "@/lib/pending-orders";
import { trySendTelegram, notifyDevError, escapeHtml } from "@/lib/telegram";

// Один «поліс оформлено» для всіх шляхів видачі: sales-сповіщення в Telegram
// (клієнтський POST /api/policies, /api/finalize після LiqPay, confirm у модалці
// ЗК/туризму/тварин). Раніше бот знав лише про шлях через /api/policies — поліси,
// укладені після редиректу з LiqPay або в модалці ЗК/туризму, в бот не потрапляли.

const PRODUCT_LABELS: Record<string, string> = {
  osago: "Автоцивілка", greencard: "Зелена карта", tourism: "Туристичне", housing: "Житло", home: "Житло",
  pets: "Тварини", "mini-kasko": "Міні-КАСКО", kasko: "КАСКО",
};

export interface IssuedPolicyInfo {
  product?: string | null;
  company?: string | null;
  vehicle?: Record<string, unknown> | null;
  price?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  customerName?: string | null;
  phone?: string | null;
  email?: string | null;
  /** Рядок джерела (utm/реферал), якщо відомий. */
  sourceLine?: string | null;
}

export async function notifyPolicyIssued(p: IssuedPolicyInfo): Promise<void> {
  const v = p.vehicle ?? {};
  const car = [v.mark, v.model].filter(Boolean).join(" ");
  const label = (p.product && PRODUCT_LABELS[p.product]) || p.product || "ОСЦПВ";
  const lines = [
    `✅ <b>Оформлено ${escapeHtml(String(label))}</b>`,
    "",
    `🏢 Компанія: ${escapeHtml(String(p.company ?? "—"))}`,
    car ? `🚙 Авто: ${escapeHtml(car)}${v.year ? `, ${v.year}` : ""}` : null,
    v.plate ? `🔢 Номер: <code>${escapeHtml(String(v.plate))}</code>` : null,
    typeof p.price === "number" ? `💰 Сума: <b>${p.price} грн</b>` : null,
    p.startDate && p.endDate ? `📅 Період: ${escapeHtml(String(p.startDate))} — ${escapeHtml(String(p.endDate))}` : null,
    p.customerName ? `👤 ${escapeHtml(String(p.customerName))}` : null,
    p.phone ? `📞 <code>${escapeHtml(String(p.phone))}</code>` : null,
    p.email ? `📧 Email: <code>${escapeHtml(String(p.email))}</code>` : null,
    p.sourceLine ?? null,
  ].filter(Boolean);
  await trySendTelegram("sales", lines.join("\n"));
}

/**
 * Серверний запис укладеного поліса з pending-замовлення: кабінет + бонуси +
 * sales-сповіщення + закриття pending. Best-effort — жоден збій не валить укладання.
 * Викликати ВСЕРЕДИНІ idempotency-блоку confirm, щоб сповіщення не дублювалось.
 */
export async function recordIssuedPolicy(args: {
  orderId: string;
  contractId: string;
  product: string;
  meta?: PendingMeta | null;
  refCode?: string | null;
}): Promise<void> {
  const { orderId, contractId, product } = args;
  const meta = args.meta === undefined ? (await getPendingOrder(orderId).catch(() => null))?.meta ?? null : args.meta;

  if (meta?.email) {
    const price = typeof meta.price === "number" ? meta.price : null;
    try {
      await savePolicy({
        id: contractId || orderId,
        email: String(meta.email),
        phone: meta.phone ?? null,
        customerName: meta.customerName ?? null,
        customer: meta.customer ?? null,
        contractId,
        orderId,
        company: meta.company ?? null,
        vehicle: meta.vehicle ?? {},
        price,
        startDate: meta.startDate ?? null,
        endDate: meta.endDate ?? null,
        product,
      });
    } catch (e) {
      await notifyDevError("issued savePolicy", e);
    }
    try {
      await creditPolicyRewards({ email: String(meta.email), policyId: contractId || orderId, price, refCode: args.refCode ?? null });
    } catch (e) {
      await notifyDevError("issued rewards", e);
    }
  }

  // Сповіщаємо навіть без email у meta — продаж був, бот має про нього знати.
  await notifyPolicyIssued({
    product: meta?.productLabel ?? product,
    company: meta?.company,
    vehicle: meta?.vehicle,
    price: typeof meta?.price === "number" ? meta.price : null,
    startDate: meta?.startDate,
    endDate: meta?.endDate,
    customerName: meta?.customerName,
    phone: meta?.phone,
    email: meta?.email,
  });

  await markPendingFinalized(orderId).catch(() => {});
}
