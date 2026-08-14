import { NextRequest, NextResponse } from "next/server";
import { ukaskoService } from "@/services/ukasko";
import { guardRequest } from "@/lib/api-guard";
import { withIdempotency } from "@/lib/idempotency";
import { getPendingOrder, markPendingFinalized } from "@/lib/pending-orders";
import { savePolicy } from "@/lib/policies";
import { notifyDevError } from "@/lib/telegram";

// Продукт-незалежна фіналізація після оплати. LiqPay редіректить клієнта на
// /payment-success незалежно від продукту, а укладання договору відрізняється по
// продуктах (ОСЦПВ/ЗК/житло/тварини/міні-КАСКО — по orderId; туризм — повний order).
// Раніше /payment-success укладав ЛИШЕ ОСЦПВ → інші продукти лишались оплаченими,
// але без поліса. Тут дивимось збережений при declare pending_order і кличемо
// правильне укладання + зберігаємо поліс. Це замикає діру «оплатив — поліса нема».

async function confirmByProduct(product: string, orderId: string, orderPayload: Record<string, unknown> | null): Promise<{ contractId: string }> {
  switch (product) {
    case "tourism": {
      if (!orderPayload) throw new Error("Немає даних для укладання туристичного поліса.");
      const r = await ukaskoService.confirmTourismOrder({ ...orderPayload, orderId });
      return { contractId: r.contractId };
    }
    case "greencard": {
      const r = await ukaskoService.confirmGreenCard(orderId);
      return { contractId: r.contractId };
    }
    case "housing": {
      const r = await ukaskoService.confirmHome(orderId);
      return { contractId: r.contractId };
    }
    case "pets": {
      const r = await ukaskoService.confirmPetsOrder(orderId);
      return { contractId: r.contractId };
    }
    case "mini-kasko": {
      const r = await ukaskoService.confirmMiniKasko(orderId);
      return { contractId: r.contractId };
    }
    case "osago":
    default: {
      const r = await ukaskoService.confirmPolicy(orderId);
      return { contractId: r.contractId };
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const blocked = guardRequest(req, { name: "finalize", limit: 40, windowMs: 10 * 60 * 1000 });
    if (blocked) return blocked;

    const { orderId } = await req.json();
    const id = String(orderId ?? "");
    if (!id) return NextResponse.json({ success: false, error: "orderId required" }, { status: 400 });

    // 1) Перевіряємо оплату ПОЗА idempotency (статус змінюється з часом; кешувати не
    // можна — інакше «не оплачено» застрягне). statusId=2 → оплачено.
    const inv = await ukaskoService.checkInvoice(id);
    if (inv.status_id !== 2) {
      return NextResponse.json({ success: true, paid: false });
    }

    // 2) Оплачено → укладаємо (мутація) під idempotency: повторні виклики повертають
    // той самий contractId, без дублів.
    const { status, body } = await withIdempotency(`finalize:${id}`, async () => {
      // Продукт зі збереженого pending order; немає запису → ОСЦПВ (як історично).
      const pending = await getPendingOrder(id);
      const product = pending?.product ?? "osago";
      const { contractId } = await confirmByProduct(product, id, pending?.orderPayload ?? null);

      // Зберігаємо поліс у кабінет (best-effort — не валимо відповідь).
      const meta = pending?.meta;
      if (meta?.email) {
        try {
          await savePolicy({
            id: contractId || id,
            email: String(meta.email),
            phone: meta.phone ?? null,
            customerName: meta.customerName ?? null,
            customer: meta.customer ?? null,
            contractId,
            orderId: id,
            company: meta.company ?? null,
            vehicle: meta.vehicle ?? {},
            price: typeof meta.price === "number" ? meta.price : null,
            startDate: meta.startDate ?? null,
            endDate: meta.endDate ?? null,
            product,
          });
        } catch (e) {
          await notifyDevError("finalize savePolicy", e);
        }
      }

      await markPendingFinalized(id);
      return { status: 200, body: { success: true, paid: true, contractId, product } };
    });

    return NextResponse.json(body, { status });
  } catch (e) {
    await notifyDevError("finalize", e);
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Error" }, { status: 500 });
  }
}
