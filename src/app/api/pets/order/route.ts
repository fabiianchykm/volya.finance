import { NextRequest, NextResponse } from "next/server";
import { ukaskoService } from "@/services/ukasko";
import { guardRequest } from "@/lib/api-guard";
import { withIdempotency } from "@/lib/idempotency";
import { notifyDevError } from "@/lib/telegram";

// Флоу тварин: declare (order/create statusId:5) → orderId → [спільні OTP та
// оплата] → confirm (pets/contract/confirm) → download (pets/contract/take).

export async function POST(req: NextRequest) {
  try {
    const blocked = guardRequest(req, { name: "pets-order", limit: 15, windowMs: 10 * 60 * 1000 });
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
      const key = idem ? `pets-declare:${idem}` : null;
      const { status, body: resBody } = await withIdempotency(key, async () => {
        const result = await ukaskoService.declarePetsOrder(order);
        return { status: 200, body: { success: true, data: result } };
      });
      return NextResponse.json(resBody, { status });
    }

    if (action === "confirm") {
      const id = String(orderId ?? "");
      const { status, body: resBody } = await withIdempotency(
        id ? `pets-confirm:${id}` : null,
        async () => {
          const result = await ukaskoService.confirmPetsOrder(id);
          return { status: 200, body: { success: true, data: result } };
        }
      );
      return NextResponse.json(resBody, { status });
    }

    if (action === "download") {
      const result = await ukaskoService.takePetsContract(String(contractId ?? ""));
      return NextResponse.json({ success: true, data: result });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await notifyDevError("pets order", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
