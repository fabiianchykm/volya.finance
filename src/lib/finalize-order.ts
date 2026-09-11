import { ukaskoService } from "@/services/ukasko";
import { withIdempotency } from "@/lib/idempotency";
import { getPendingOrder, markPendingFinalized, type PendingMeta } from "@/lib/pending-orders";
import { savePolicy } from "@/lib/policies";
import { creditPolicyRewards } from "@/lib/referral";
import { notifyDevError } from "@/lib/telegram";

// Продукт-незалежне укладання після оплати. Спільне для /api/finalize (клієнт на
// /payment-success) та /api/finalize/sweep (фоновий добір оплачених-але-невиданих).
// Укладання відрізняється по продуктах: ОСЦПВ/ЗК/житло/тварини/міні-КАСКО — по
// orderId; туризм — повний order payload.

async function confirmByProduct(product: string, orderId: string, orderPayload: Record<string, unknown> | null): Promise<{ contractId: string }> {
  switch (product) {
    case "tourism": {
      if (!orderPayload) throw new Error("Немає даних для укладання туристичного поліса.");
      const r = await ukaskoService.confirmTourismOrder({ ...orderPayload, orderId });
      return { contractId: r.contractId };
    }
    case "greencard": {
      const r = await ukaskoService.confirmGreenCard(orderId);
      return { contractId: r.contractId };
    }
    case "housing": {
      const r = await ukaskoService.confirmHome(orderId);
      return { contractId: r.contractId };
    }
    case "pets": {
      const r = await ukaskoService.confirmPetsOrder(orderId);
      return { contractId: r.contractId };
    }
    case "mini-kasko": {
      const r = await ukaskoService.confirmMiniKasko(orderId);
      return { contractId: r.contractId };
    }
    case "osago":
    default: {
      const r = await ukaskoService.confirmPolicy(orderId);
      return { contractId: r.contractId };
    }
  }
}

export type FinalizeResult =
  | { paid: false }
  | { paid: true; issued: true; contractId: string; product: string }
  | { paid: true; issued: false; product: string; error: string; meta: PendingMeta | null };

// Укладає ОДНЕ замовлення, якщо воно оплачене. Ідемпотентно (той самий contractId,
// без дублів). Збій укладання НЕ кидає, а повертає issued:false — щоб викликач
// (finalize/sweep) вирішив, як алертити. Несподівані помилки (checkInvoice) — кидає.
export async function finalizeOrder(orderId: string, opts: { refCode?: string | null } = {}): Promise<FinalizeResult> {
  // Статус оплати — ПОЗА idempotency (змінюється з часом). statusId=2 → оплачено.
  const inv = await ukaskoService.checkInvoice(orderId);
  if (inv.status_id !== 2) return { paid: false };

  const pending = await getPendingOrder(orderId);
  const product = pending?.product ?? "osago";

  try {
    const { body } = await withIdempotency(`finalize:${orderId}`, async () => {
      const { contractId } = await confirmByProduct(product, orderId, pending?.orderPayload ?? null);

      // Зберігаємо поліс у кабінет + бонуси (best-effort, не валимо укладання).
      const meta = pending?.meta;
      if (meta?.email) {
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
            price: typeof meta.price === "number" ? meta.price : null,
            startDate: meta.startDate ?? null,
            endDate: meta.endDate ?? null,
            product,
          });
        } catch (e) {
          await notifyDevError("finalize savePolicy", e);
        }
        try {
          await creditPolicyRewards({
            email: String(meta.email),
            policyId: contractId || orderId,
            price: typeof meta.price === "number" ? meta.price : null,
            refCode: opts.refCode ?? null,
          });
        } catch (e) {
          await notifyDevError("finalize rewards", e);
        }
      }

      await markPendingFinalized(orderId);
      return { status: 200, body: { contractId } };
    });
    const contractId = (body as { contractId: string }).contractId;
    return { paid: true, issued: true, contractId, product };
  } catch (confirmErr) {
    // Оплата підтверджена, але укладання впало. НЕ кешується (idempotency прибирає
    // збій), тож повторний sweep спробує ще раз, коли Ukasko оживе / дані виправлять.
    const raw = confirmErr instanceof Error ? confirmErr.message : String(confirmErr);
    return { paid: true, issued: false, product, error: raw, meta: pending?.meta ?? null };
  }
}

// Гучний алерт підтримці «оплачено, але не видано» — з усіма даними для ручної видачі.
export async function notifyPaidNotIssued(r: { orderId: string; product: string; error: string; meta: PendingMeta | null }): Promise<void> {
  const m = r.meta;
  await notifyDevError(
    `💳❌ ОПЛАЧЕНО, АЛЕ НЕ ВИДАНО — потрібна ручна видача\n` +
    `product=${r.product} orderId=${r.orderId}\n` +
    `клієнт=${m?.customerName ?? "-"} тел=${m?.phone ?? "-"} email=${m?.email ?? "-"}\n` +
    `СК=${m?.company ?? "-"} ціна=${m?.price ?? "-"}\n` +
    `причина: ${r.error.slice(0, 400)}`,
    new Error(r.error)
  );
}
