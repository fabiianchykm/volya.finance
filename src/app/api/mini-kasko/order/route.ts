import { NextRequest, NextResponse } from "next/server";
import { ukaskoService } from "@/services/ukasko";
import { guardRequest } from "@/lib/api-guard";
import { withIdempotency } from "@/lib/idempotency";
import { notifyDevError } from "@/lib/telegram";

// Флоу міні-КАСКО: declare (чернетка+заявлення за один виклик) → send-otp →
// verify-otp → [оплата через спільний /api/insurance/payment] → confirm → download.
export async function POST(req: NextRequest) {
  try {
    const blocked = guardRequest(req, { name: "mk-order", limit: 20, windowMs: 10 * 60 * 1000 });
    if (blocked) return blocked;

    const body = await req.json();
    const { action, ...data } = body ?? {};
    const idem = req.headers.get("idempotency-key");

    if (action === "declare") {
      const key = idem ? `mk-declare:${idem}` : null;
      const { status, body: resBody } = await withIdempotency(key, async () => {
        const result = await ukaskoService.createMiniKaskoOrder(data);
        return { status: 200, body: { success: true, data: result } };
      });
      return NextResponse.json(resBody, { status });
    }

    if (action === "send-otp") {
      await ukaskoService.sendMiniKaskoOtp(String(data.orderId ?? ""), data.channel === "viber_sms" ? "viber_sms" : "email");
      return NextResponse.json({ success: true });
    }

    if (action === "verify-otp") {
      const valid = await ukaskoService.verifyMiniKaskoOtp(String(data.orderId ?? ""), String(data.otp ?? ""));
      return NextResponse.json({ success: true, valid });
    }

    if (action === "confirm") {
      const orderId = String(data.orderId ?? "");
      const { status, body: resBody } = await withIdempotency(
        orderId ? `mk-confirm:${orderId}` : null,
        async () => {
          const result = await ukaskoService.confirmMiniKasko(orderId, data.otp);
          return { status: 200, body: { success: true, data: result } };
        }
      );
      return NextResponse.json(resBody, { status });
    }

    if (action === "download") {
      // PDF стрімить окремий проксі-роут; віддаємо на нього посилання.
      const id = String(data.contractId ?? data.orderId ?? "");
      return NextResponse.json({ success: true, data: { contract: `/api/mini-kasko/download/${encodeURIComponent(id)}` } });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await notifyDevError("mini-kasko order", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
