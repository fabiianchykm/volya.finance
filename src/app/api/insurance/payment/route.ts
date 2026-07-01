import { NextRequest, NextResponse } from "next/server";
import { ukaskoService } from "@/services/ukasko";
import { guardRequest } from "@/lib/api-guard";
import { withIdempotency } from "@/lib/idempotency";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function POST(req: NextRequest) {
  try {
    // check опитується кілька разів на клік — тримаємо ліміт вищим, але обмеженим.
    const blocked = guardRequest(req, { name: "payment", limit: 40, windowMs: 10 * 60 * 1000 });
    if (blocked) return blocked;

    const { action, orderId } = await req.json();

    if (action === "invoice") {
      // Генерацію рахунку дедуплікуємо за orderId — повторні відкриття модалки
      // повертають той самий рахунок, без зайвих звернень до Ukasko.
      const { status, body } = await withIdempotency(
        orderId ? `invoice:${orderId}` : null,
        async () => {
          const resultUrl = `${BASE_URL}/payment-success?orderId=${orderId}`;
          try {
            const data = await ukaskoService.getInvoice(orderId, resultUrl);
            return { status: 200, body: { success: true, data } };
          } catch {
            // invoiceLink недоступний — повертаємо order info з mtsbuLink
            const orderData = await ukaskoService.getOrderInfo(orderId);
            return { status: 200, body: { success: true, data: orderData } };
          }
        }
      );
      return NextResponse.json(body, { status });
    }

    if (action === "check") {
      // check НЕ ідемпотентний — статус оплати змінюється з часом.
      const data = await ukaskoService.checkInvoice(orderId);
      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Error" }, { status: 500 });
  }
}
