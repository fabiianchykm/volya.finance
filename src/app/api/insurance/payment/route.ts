import { NextRequest, NextResponse } from "next/server";
import { ukaskoService } from "@/services/ukasko";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function POST(req: NextRequest) {
  try {
    const { action, orderId } = await req.json();

    if (action === "invoice") {
      const resultUrl = `${BASE_URL}/payment-success?orderId=${orderId}`;
      try {
        const data = await ukaskoService.getInvoice(orderId, resultUrl);
        return NextResponse.json({ success: true, data });
      } catch {
        // invoiceLink недоступний — повертаємо order info з mtsbuLink
        const orderData = await ukaskoService.getOrderInfo(orderId);
        return NextResponse.json({ success: true, data: orderData });
      }
    }

    if (action === "check") {
      const data = await ukaskoService.checkInvoice(orderId);
      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Error" }, { status: 500 });
  }
}
