import { NextRequest, NextResponse } from "next/server";
import { finalizeOrder, notifyPaidNotIssued } from "@/lib/finalize-order";
import { listUnfinalizedOrders, markPendingAlerted } from "@/lib/pending-orders";
import { notifyDevError } from "@/lib/telegram";

// Safety-net: періодично (зовнішній cron) добираємо ОПЛАЧЕНІ, але НЕ УКЛАДЕНІ
// замовлення й доукладаємо їх. Закриває дві діри, яких не ловить /payment-success:
//   1) клієнт оплатив, але не повернувся на /payment-success → finalize не викликався;
//   2) укладання впало транзієнтно (Ukasko/МТСБУ лежали) → тут повторимо, коли оживе.
// Оплачене-й-невидане, що не вдалось і тут → гучний алерт (раз на кілька годин).
// Ідемпотентно (finalizeOrder), тож повторні прогони безпечні.

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const RE_ALERT_AFTER_MS = 6 * 60 * 60 * 1000; // не частіше ніж раз на 6 год на замовлення

async function runSweep(req: NextRequest) {
  // Захист: без SWEEP_SECRET роут вимкнено (щоб випадково не лишити відкритим).
  const secret = process.env.SWEEP_SECRET;
  if (!secret) return NextResponse.json({ success: false, error: "sweep disabled (no SWEEP_SECRET)" }, { status: 503 });
  const provided = req.headers.get("x-sweep-secret") || new URL(req.url).searchParams.get("secret");
  if (provided !== secret) return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 });

  const orders = await listUnfinalizedOrders({ minAgeMinutes: 2, maxAgeHours: 72, limit: 100 });
  const now = Date.now();
  const summary = { checked: orders.length, issued: 0, unpaid: 0, stillFailing: 0, alerted: 0, errors: 0 };

  for (const o of orders) {
    try {
      const r = await finalizeOrder(o.orderId);
      if (!r.paid) { summary.unpaid++; continue; }
      if (r.issued) { summary.issued++; continue; }
      // Оплачено, але й тут не укладається.
      summary.stillFailing++;
      const alertedRecently = o.alertedAt && (now - new Date(o.alertedAt).getTime() < RE_ALERT_AFTER_MS);
      if (!alertedRecently) {
        await notifyPaidNotIssued({ orderId: o.orderId, product: r.product, error: r.error, meta: r.meta });
        await markPendingAlerted(o.orderId);
        summary.alerted++;
      }
    } catch (e) {
      summary.errors++;
      await notifyDevError(`finalize sweep order=${o.orderId}`, e);
    }
  }

  return NextResponse.json({ success: true, ...summary });
}

// Cron/зовнішній виклик — GET (простіше для планувальників); POST теж приймаємо.
export async function GET(req: NextRequest) {
  try { return await runSweep(req); }
  catch (e) { await notifyDevError("finalize sweep", e); return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Error" }, { status: 500 }); }
}
export async function POST(req: NextRequest) {
  try { return await runSweep(req); }
  catch (e) { await notifyDevError("finalize sweep", e); return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Error" }, { status: 500 }); }
}
