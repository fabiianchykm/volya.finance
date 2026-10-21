import { NextRequest, NextResponse } from "next/server";
import { withJourney } from "@/lib/journey";
import { ukaskoService, UKASKO_IS_DEV } from "@/services/ukasko";
import { guardRequest } from "@/lib/api-guard";
import { withIdempotency } from "@/lib/idempotency";
import { notifyDevError } from "@/lib/telegram";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Спільний платіжний роут. Заявки v2 (product="osago" | "tourism") оплачуються через
// Payments v2 (payment-systems → checkout → payment-status); решта продуктів —
// legacy get-invoice. Перевірка оплати (check) для всіх — checkInvoice, який спершу
// питає payment-status v2, а для v1-заявок падає на isPaid у get-invoice.

async function handlePost(req: NextRequest) {
  try {
    // check опитується кілька разів на клік — тримаємо ліміт вищим, але обмеженим.
    const blocked = guardRequest(req, { name: "payment", limit: 40, windowMs: 10 * 60 * 1000 });
    if (blocked) return blocked;

    const { action, orderId, product } = await req.json();
    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json({ success: false, error: "Missing orderId" }, { status: 400 });
    }
    const productName = typeof product === "string" ? product : undefined;

    if (action === "invoice") {
      // Генерацію рахунку дедуплікуємо за orderId — повторні відкриття модалки
      // повертають той самий рахунок, без зайвих звернень до Ukasko.
      const { status, body } = await withIdempotency(
        `invoice:${orderId}`,
        async () => {
          const resultUrl = `${BASE_URL}/payment-success?orderId=${orderId}`;
          if (productName === "osago" || productName === "tourism") {
            // ОСЦПВ v2 / туризм v2: checkout у платіжній системі. 409 (уже сплачено) → paid:true —
            // модалка одразу переходить до укладення.
            try {
              const inv = await ukaskoService.getInvoiceV2(orderId, resultUrl);
              if (inv.alreadyPaid) return { status: 200, body: { success: true, data: { paid: true }, testMode: UKASKO_IS_DEV } };
              return { status: 200, body: { success: true, data: inv, testMode: UKASKO_IS_DEV } };
            } catch (e) {
              // Заявка старого флоу (відновлений checkout) або збій v2 — пробуємо legacy.
              console.error("[payment v2 invoice] fallback to legacy:", e instanceof Error ? e.message.slice(0, 300) : String(e));
            }
          }
          try {
            const data = await ukaskoService.getInvoice(orderId, resultUrl);
            return { status: 200, body: { success: true, data, testMode: UKASKO_IS_DEV } };
          } catch {
            // invoiceLink недоступний — повертаємо order info з mtsbuLink.
            // testMode каже клієнту, чи можна підтверджувати БЕЗ оплати (лише dev).
            const orderData = await ukaskoService.getOrderInfo(orderId);
            return { status: 200, body: { success: true, data: orderData, testMode: UKASKO_IS_DEV } };
          }
        }
      );
      return NextResponse.json(body, { status });
    }

    if (action === "check") {
      // check НЕ ідемпотентний — статус оплати змінюється з часом. product (опційно)
      // з клієнта: для не-ОСЦПВ orderStatus=2 ≠ оплата (див. checkInvoice).
      const data = await ukaskoService.checkInvoice(orderId, productName);
      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (e) {
    console.error("[payment/route] error →", e instanceof Error ? e.message : String(e));
    await notifyDevError("insurance payment", e);
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Error" }, { status: 500 });
  }
}

export const POST = withJourney("insurance/payment", handlePost);
