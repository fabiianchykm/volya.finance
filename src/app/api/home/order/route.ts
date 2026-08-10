import { NextRequest, NextResponse } from "next/server";
import { ukaskoService } from "@/services/ukasko";
import { guardRequest } from "@/lib/api-guard";
import { withIdempotency } from "@/lib/idempotency";
import { notifyDevError } from "@/lib/telegram";

// Флоу житла: declare (order/create) → [спільні OTP /api/insurance/otp + оплата
// /api/insurance/payment] → confirm (contract/confirm) → download (contract/take → URL).
export async function POST(req: NextRequest) {
  try {
    const blocked = guardRequest(req, { name: "home-order", limit: 20, windowMs: 10 * 60 * 1000 });
    if (blocked) return blocked;

    const body = await req.json();
    const { action, ...data } = body ?? {};
    const idem = req.headers.get("idempotency-key");

    if (action === "declare") {
      const key = idem ? `home-declare:${idem}` : null;
      const { status, body: resBody } = await withIdempotency(key, async () => {
        const result = await ukaskoService.createHomeOrder(data);
        return { status: 200, body: { success: true, data: result } };
      });
      return NextResponse.json(resBody, { status });
    }

    if (action === "confirm") {
      const orderId = String(data.orderId ?? "");
      const { status, body: resBody } = await withIdempotency(
        orderId ? `home-confirm:${orderId}` : null,
        async () => {
          const result = await ukaskoService.confirmHome(orderId);
          return { status: 200, body: { success: true, data: result } };
        }
      );
      return NextResponse.json(resBody, { status });
    }

    if (action === "download") {
      const contractId = String(data.contractId ?? "");
      // Файл може ще генеруватись (contract === null) — кілька спроб.
      let contract: string | null | undefined;
      for (let i = 0; i < 3; i++) {
        const res = await ukaskoService.takeHomeContract(contractId);
        contract = res.contract;
        if (contract) break;
        await new Promise((r) => setTimeout(r, 1500));
      }
      if (!contract) return NextResponse.json({ success: false, error: "Документ ще генерується. Спробуйте за мить." }, { status: 202 });
      return NextResponse.json({ success: true, data: { contract, mtsbuLink: null } });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await notifyDevError("home order", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
