import { NextRequest, NextResponse } from "next/server";
import { guardRequest } from "@/lib/api-guard";
import { finalizeOrder, notifyPaidNotIssued } from "@/lib/finalize-order";
import { notifyDevError } from "@/lib/telegram";

// Продукт-незалежна фіналізація після оплати. LiqPay редіректить клієнта на
// /payment-success незалежно від продукту; спільна логіка укладання — у
// lib/finalize-order (тими ж кроками користується фоновий /api/finalize/sweep).
// Це замикає діру «оплатив — поліса нема».

export async function POST(req: NextRequest) {
  try {
    const blocked = guardRequest(req, { name: "finalize", limit: 40, windowMs: 10 * 60 * 1000 });
    if (blocked) return blocked;

    const { orderId } = await req.json();
    const id = String(orderId ?? "");
    if (!id) return NextResponse.json({ success: false, error: "orderId required" }, { status: 400 });

    const r = await finalizeOrder(id, { refCode: req.cookies.get("ref")?.value ?? null });

    if (!r.paid) return NextResponse.json({ success: true, paid: false });
    if (r.issued) return NextResponse.json({ success: true, paid: true, contractId: r.contractId, product: r.product });

    // Оплачено, але укладання впало — гучний алерт підтримці + 500, щоб клієнт бачив
    // «обробляється» (finalize ідемпотентний: успішний повтор сам укладе). Фоновий
    // sweep також добере це замовлення пізніше, якщо клієнт не повернеться.
    await notifyPaidNotIssued({ orderId: id, product: r.product, error: r.error, meta: r.meta });
    return NextResponse.json({ success: false, error: r.error }, { status: 500 });
  } catch (e) {
    await notifyDevError("finalize", e);
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Error" }, { status: 500 });
  }
}
