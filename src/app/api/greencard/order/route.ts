import { NextRequest, NextResponse } from "next/server";
import { ukaskoService } from "@/services/ukasko";
import { guardRequest } from "@/lib/api-guard";
import { withIdempotency } from "@/lib/idempotency";
import { notifyDevError } from "@/lib/telegram";

// Флоу «Зелена карта» (аналог ОСЦПВ): declare (order/create) → orderId →
// [спільні OTP та оплата по orderId] → confirm (contract/confirm) → contractId →
// download (contract/take). OTP/оплату переюзуємо з /api/insurance/otp|payment.

export async function POST(req: NextRequest) {
  try {
    const blocked = guardRequest(req, { name: "gc-order", limit: 15, windowMs: 10 * 60 * 1000 });
    if (blocked) return blocked;

    const body = await req.json();
    const { action, ...data } = body;
    const idem = req.headers.get("idempotency-key");

    if (action === "declare") {
      const key = idem ? `gc-declare:${idem}` : null;
      const { status, body: resBody } = await withIdempotency(key, async () => {
        const result = await ukaskoService.createGreenCardOrder(data);
        return { status: 200, body: { success: true, data: result } };
      });
      return NextResponse.json(resBody, { status });
    }

    if (action === "confirm") {
      const orderId = String(data.orderId ?? "");
      const { status, body: resBody } = await withIdempotency(
        orderId ? `gc-confirm:${orderId}` : null,
        async () => {
          const result = await ukaskoService.confirmGreenCard(orderId);
          return { status: 200, body: { success: true, data: result } };
        }
      );
      return NextResponse.json(resBody, { status });
    }

    if (action === "download") {
      const result = await ukaskoService.downloadGreenCardContract(String(data.contractId ?? ""));
      return NextResponse.json({ success: true, data: result });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await notifyDevError("greencard order", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
