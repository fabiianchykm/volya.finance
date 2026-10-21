import { NextRequest, NextResponse } from "next/server";
import { withJourney } from "@/lib/journey";
import { ukaskoService } from "@/services/ukasko";
import { recordIssuedPolicy } from "@/lib/issued-policy";
import { guardRequest } from "@/lib/api-guard";
import { withIdempotency } from "@/lib/idempotency";
import { notifyDevError } from "@/lib/telegram";
import { splitDocSerialNumber } from "@/lib/doc-number";

type Rec = Record<string, unknown>;
const isRec = (v: unknown): v is Rec => !!v && typeof v === "object" && !Array.isArray(v);

// Серія/номер паспорта для Ukasko — окремими полями. Клієнт міг надіслати
// «GH636131» одним рядком (старий бандл) — розбиваємо тут ще раз, на бекенді.
function normalizeOrderDocs(order: Rec): Rec {
  const out: Rec = { ...order };
  if (isRec(order.info) && isRec(order.info.documentation)) {
    const d = order.info.documentation;
    const { serial, number } = splitDocSerialNumber(d.serial, d.number);
    out.info = { ...order.info, documentation: { ...d, serial, number } };
  }
  if (Array.isArray(order.touristsListInfo)) {
    out.touristsListInfo = order.touristsListInfo.map((t) => {
      if (!isRec(t)) return t;
      const { serial, number } = splitDocSerialNumber(t.passportSerial, t.passportNumber);
      return { ...t, passportSerial: serial, passportNumber: number };
    });
  }
  return out;
}

// Флоу туристичного (аналог ОСЦПВ/ЗК): declare (order/create type=save) → orderId
// → [спільні OTP та оплата по orderId] → confirm (order/create type=nextFinal з
// повним payload) → contractId → download (tourism/contract/take).
// OTP та оплату переюзуємо з /api/insurance/otp|payment.

async function handlePost(req: NextRequest) {
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
        const result = await ukaskoService.declareTourismOrder(normalizeOrderDocs(order));
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
          const result = await ukaskoService.confirmTourismOrder({ ...normalizeOrderDocs(order), orderId: id });
          // Кабінет + бонуси + sales-сповіщення + закриття pending (sweep не алертить).
          await recordIssuedPolicy({ orderId: id, contractId: result.contractId, product: "tourism" });
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

export const POST = withJourney("tourism/order", handlePost);
