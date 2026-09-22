import { NextRequest, NextResponse } from "next/server";
import { trySendTelegram, escapeHtml } from "@/lib/telegram";

// ЖУРНАЛ ШЛЯХУ КЛІЄНТА (checkout journey). Один структурований рядок `[journey] {...}`
// у Cloud Logging на КОЖЕН виклик checkout-API: що за крок, для якого замовлення,
// звідки, чим завершилось і чому впало. Мета — по логах точно бачити, на якому
// кроці клієнт зійшов (declare → otp → invoice → pay-check → confirm → download)
// і яка була причина. Шукати: textPayload:"[journey]" (+ orderId).

type Outcome = Record<string, unknown>;

function ipOf(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd ? fwd.split(",")[0].trim() : req.headers.get("x-real-ip")) || "-";
}

function uaShort(req: NextRequest): string {
  const ua = req.headers.get("user-agent") || "";
  if (/iPhone|iPad/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  if (/Windows/i.test(ua)) return "windows";
  if (/Macintosh/i.test(ua)) return "mac";
  return ua.slice(0, 20) || "-";
}

export function logJourney(step: string, data: Outcome): void {
  const line = { step, ...data, at: new Date().toISOString() };
  console.error(`[journey] ${JSON.stringify(line)}`);
}

// Витягуємо з тіла запиту лише ідентифікатори (без персональних даних).
function pickRequest(body: unknown): Outcome {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const order = (b.order && typeof b.order === "object" ? b.order : {}) as Record<string, unknown>;
  return {
    action: b.action ?? b.event ?? "-",
    orderId: b.orderId ?? order.orderId ?? b.contractId ?? "-",
    product: b.product ?? "-",
    offerId: b.offerId ?? order.offerId ?? undefined,
    clientStep: b.step ?? undefined,
  };
}

// Витягуємо з відповіді результат (успіх/помилка/валідність коду/наявність рахунку).
function pickResponse(status: number, body: unknown): Outcome {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const d = (b.data && typeof b.data === "object" ? b.data : {}) as Record<string, unknown>;
  const out: Outcome = { http: status, ok: b.success === true && !b.error };
  if (b.error) out.error = String(b.error).slice(0, 300);
  if ("valid" in b) out.otpValid = b.valid;
  if ("paid" in b) out.paid = b.paid;
  if ("status_id" in d) out.payStatus = d.status_id;
  if ("uncertain" in d) out.payUncertain = d.uncertain;
  if ("invoiceLink" in d) out.invoiceLink = !!d.invoiceLink;
  if (d.contractId || b.contractId) out.contractId = d.contractId ?? b.contractId;
  if (d.id) out.newOrderId = d.id;
  if (d.status) out.orderStatus = d.status;
  return out;
}

/** Обгортка POST-хендлера checkout-роуту: логує запит+результат одним рядком. */
export function withJourney(route: string, handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const t0 = Date.now();
    let reqInfo: Outcome = {};
    try { reqInfo = pickRequest(await req.clone().json()); } catch { /* не JSON — ок */ }
    const base = { route, ...reqInfo, ip: ipOf(req), ua: uaShort(req) };
    try {
      const res = await handler(req);
      let resInfo: Outcome = { http: res.status };
      try { resInfo = pickResponse(res.status, await res.clone().json()); } catch { /* не JSON */ }
      const line: Outcome = { ...base, ...resInfo, ms: Date.now() - t0 };
      logJourney(String(reqInfo.action ?? route), line);
      // Збій на ПІЗНІХ кроках (рахунок/укладання) — одразу в dev-Telegram, щоб не
      // чекати на розбір логів: клієнт уже пройшов OTP, гроші поруч.
      const late = /invoice|confirm|finalize/i.test(String(reqInfo.action ?? route)) || route === "finalize";
      const failed = line.ok === false || (line.action === "invoice" && line.invoiceLink === false);
      if (late && failed) {
        void trySendTelegram("dev",
          `🛑 <b>Зрив на кроці «${escapeHtml(String(line.action))}»</b> (${escapeHtml(route)})\n` +
          `orderId=<code>${escapeHtml(String(line.orderId))}</code> product=${escapeHtml(String(line.product))}\n` +
          `причина: ${escapeHtml(String(line.error ?? (line.invoiceLink === false ? "рахунок LiqPay не сформовано (немає invoiceLink)" : "невідомо")))}`);
      }
      return res;
    } catch (e) {
      logJourney(String(reqInfo.action ?? route), { ...base, http: 500, ok: false, error: (e instanceof Error ? e.message : String(e)).slice(0, 300), thrown: true, ms: Date.now() - t0 });
      throw e;
    }
  };
}
