import { NextRequest, NextResponse } from "next/server";
import { ukaskoService } from "@/services/ukasko";
import { guardRequest } from "@/lib/api-guard";
import { withIdempotency } from "@/lib/idempotency";

export async function POST(req: NextRequest) {
  try {
    // Підтвердження поліса й завантаження договору — обмежуємо по IP.
    const blocked = guardRequest(req, { name: "contract", limit: 20, windowMs: 10 * 60 * 1000 });
    if (blocked) return blocked;

    const { action, orderId, contractId } = await req.json();

    if (action === "confirm") {
      // Дедуплікуємо за orderId — повторне підтвердження повертає той самий contractId.
      const { status, body } = await withIdempotency(
        orderId ? `confirm:${orderId}` : null,
        async () => {
          const data = await ukaskoService.confirmPolicy(orderId);
          return { status: 200, body: { success: true, data } };
        }
      );
      return NextResponse.json(body, { status });
    }

    if (action === "download") {
      const data = await ukaskoService.downloadContract(contractId);
      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Error" }, { status: 500 });
  }
}
