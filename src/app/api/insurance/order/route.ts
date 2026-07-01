import { NextRequest, NextResponse } from "next/server";
import { ukaskoService } from "@/services/ukasko";
import { guardRequest } from "@/lib/api-guard";
import { withIdempotency } from "@/lib/idempotency";

export async function POST(req: NextRequest) {
  try {
    // Створення/заявлення поліса запускає SMS/email — обмежуємо жорсткіше.
    const blocked = guardRequest(req, { name: "order", limit: 15, windowMs: 10 * 60 * 1000 });
    if (blocked) return blocked;

    const body = await req.json();
    const { action, ...orderData } = body;
    const idemHeader = req.headers.get("idempotency-key");

    if (action === "draft") {
      // Чернетку дедуплікуємо за клієнтським ключем спроби (Idempotency-Key).
      const { status, body: resBody } = await withIdempotency(
        idemHeader ? `draft:${idemHeader}` : null,
        async () => {
          const result = await ukaskoService.createDraft(orderData);
          return { status: 200, body: { success: true, data: result } };
        }
      );
      return NextResponse.json(resBody, { status });
    }

    if (action === "declare") {
      // Заявлення дедуплікуємо за orderId — повторний declare того ж замовлення
      // не створює другий поліс, а повертає той самий результат.
      const orderId = orderData.orderId as string | undefined;
      const key = orderId ? `declare:${orderId}` : idemHeader ? `declare:${idemHeader}` : null;
      const { status, body: resBody } = await withIdempotency(key, async () => {
        try {
          const result = await ukaskoService.declarePolicy(orderData);
          return { status: 200, body: { success: true, data: result } };
        } catch (declareErr) {
          console.error("[order] declare ERROR:", declareErr instanceof Error ? declareErr.message : declareErr);
          throw declareErr;
        }
      });
      return NextResponse.json(resBody, { status });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
