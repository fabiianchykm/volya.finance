import { NextRequest, NextResponse } from "next/server";
import { ukaskoService } from "@/services/ukasko";
import { guardRequest } from "@/lib/api-guard";
import { withIdempotency } from "@/lib/idempotency";
import { notifyDevError } from "@/lib/telegram";

// Флоу туристичного (аналог ОСЦПВ/ЗК): declare (order/create type=save) → orderId
// → [спільні OTP та оплата по orderId] → confirm (order/create type=nextFinal з
// повним payload) → contractId → download (tourism/contract/take).
// OTP та оплату переюзуємо з /api/insurance/otp|payment.

export async function POST(req: NextRequest) {
  try {
    const blocked = guardRequest(req, { name: "tourism-order", limit: 15, windowMs: 10 * 60 * 1000 });
    if (blocked) return blocked;

    const body = await req.json();
    const { action, order, orderId, contractId } = body as {
      action: string;
      order?: Record<string, unknown>;
      orderId?: string;
      contractId?: string;
    };
    const idem = req.headers.get("idempotency-key");

    if (action === "declare") {
      if (!order) return NextResponse.json({ success: false, error: "Немає даних заявки" }, { status: 400 });
      const key = idem ? `tour-declare:${idem}` : null;
      const { status, body: resBody } = await withIdempotency(key, async () => {
        const result = await ukaskoService.declareTourismOrder(order);
        return { status: 200, body: { success: true, data: result } };
      });
      return NextResponse.json(resBody, { status });
    }

    if (action === "confirm") {
      const id = String(orderId ?? "");
      if (!order || !id) return NextResponse.json({ success: false, error: "Немає даних для підтвердження" }, { status: 400 });
      const { status, body: resBody } = await withIdempotency(
        `tour-confirm:${id}`,
        async () => {
          const result = await ukaskoService.confirmTourismOrder({ ...order, orderId: id });
          return { status: 200, body: { success: true, data: result } };
        }
      );
      return NextResponse.json(resBody, { status });
    }

    if (action === "download") {
      const result = await ukaskoService.takeTourismContract(String(contractId ?? ""));
      return NextResponse.json({ success: true, data: result });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await notifyDevError("tourism order", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
