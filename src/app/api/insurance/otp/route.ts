import { NextRequest, NextResponse } from "next/server";
import { withJourney } from "@/lib/journey";
import { ukaskoService, type V2OtpProduct } from "@/services/ukasko";
import { rateLimit, maybeCleanup } from "@/lib/rate-limit";
import { assertSameOrigin } from "@/lib/api-guard";
import { notifyDevError } from "@/lib/telegram";

// Спільний OTP-роут. Два бекенди Ukasko:
//  • v2 (body.v2=true — ОСЦПВ v2, туризм v2; body.product обирає шлях):
//    /v2/insurance/{product}/order/resend-otp + verify-otp (otp + otpDgo);
//  • v1 (решта продуктів: ЗК, житло, тварини, НВ): orders/send-otp + check-otp.
//    УВАГА: з 21.10.2026 v1 send-otp падає 500 для туризму — тому туризм на v2.
// Ліміти підібрані під реальний UX: на оформлення поліса вистачає
// кількох SMS і кількох спроб введення коду.
const SEND_LIMIT = 3;          // не більше 3 SMS з одного IP
const SEND_WINDOW_MS = 10 * 60 * 1000;   // за 10 хвилин

// Ліміт на саме замовлення, незалежно від IP — щоб ротація IP не дозволяла
// бомбити SMS на один телефон. Трохи вищий за per-IP (легітимні повтори/мережа).
const SEND_ORDER_LIMIT = 5;
const SEND_ORDER_WINDOW_MS = 30 * 60 * 1000;

const CHECK_LIMIT = 5;         // не більше 5 спроб коду
const CHECK_WINDOW_MS = 10 * 60 * 1000;  // за 10 хвилин

function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

async function handlePost(req: NextRequest) {
  let ctx = "";
  try {
    const originBlocked = assertSameOrigin(req);
    if (originBlocked) return originBlocked;

    maybeCleanup();

    const { action, orderId, otp, otpDgo, v2, product } = await req.json();
    const isV2 = v2 === true;
    // v2-продукт за назвою з клієнта: туризм → /tourism/, решта (ОСЦПВ) → /oscpv/.
    const v2Product: V2OtpProduct = product === "tourism" ? "tourism" : product === "greencard" ? "greencard" : "oscpv";
    ctx = `${action ?? "?"}${isV2 ? " v2" : ""} order=${orderId ?? "?"}`;

    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json({ success: false, error: "Missing orderId" }, { status: 400 });
    }

    const ip = getClientIp(req);

    if (action === "send") {
      // Перший бар'єр — на замовлення (незалежно від IP), другий — на IP.
      const rlOrder = rateLimit(`otp-send-order:${orderId}`, SEND_ORDER_LIMIT, SEND_ORDER_WINDOW_MS);
      const rl = rateLimit(`otp-send:${ip}:${orderId}`, SEND_LIMIT, SEND_WINDOW_MS);
      if (!rlOrder.allowed || !rl.allowed) {
        const retryAfter = Math.max(rlOrder.retryAfter, rl.retryAfter);
        return NextResponse.json(
          { success: false, error: "Забагато запитів на SMS. Спробуйте пізніше." },
          { status: 429, headers: { "Retry-After": String(retryAfter) } }
        );
      }
      if (isV2) {
        const data = await ukaskoService.resendOsagoOtpV2(orderId, v2Product);
        console.error(`[otp v2 resend] ${v2Product} order=${orderId} sent=${data.otpSent} len=${data.otpLength ?? "-"} dgo=${data.otpDgoRequired}`);
        return NextResponse.json({ success: true, data });
      }
      await ukaskoService.sendOtp(orderId, 1);
      return NextResponse.json({ success: true });
    }

    if (action === "check") {
      const rl = rateLimit(`otp-check:${ip}:${orderId}`, CHECK_LIMIT, CHECK_WINDOW_MS);
      if (!rl.allowed) {
        return NextResponse.json(
          { success: false, error: "Забагато спроб введення коду. Спробуйте пізніше." },
          { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
        );
      }
      if (typeof otp !== "string" || !otp.trim()) {
        return NextResponse.json({ success: false, error: "Введіть код підтвердження." }, { status: 400 });
      }
      if (isV2) {
        const r = await ukaskoService.verifyOsagoOtpV2(orderId, otp.trim(), typeof otpDgo === "string" && otpDgo.trim() ? otpDgo.trim() : null, v2Product);
        console.error(`[otp v2 check] ${v2Product} order=${orderId} valid=${r.valid}${r.error ? ` reason=${r.error.slice(0, 160)}` : ""}`);
        return NextResponse.json({ success: true, valid: r.valid, ...(r.error ? { reason: r.error } : {}) });
      }
      const ok = await ukaskoService.checkOtp(orderId, otp);
      // Результат перевірки — у лог: інакше зрив на кроці OTP не відрізнити від
      // «ввели невірний код» (роут відповідає 200 в обох випадках).
      console.error(`[otp check] order=${orderId} valid=${ok}`);
      return NextResponse.json({ success: true, valid: ok });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (e) {
    // OTP-помилка блокує оформлення — логуємо реальну причину (від Ukasko) + алерт у dev-Telegram.
    const msg = e instanceof Error ? e.message : "Error";
    console.error(`[otp] ${ctx} error:`, msg.slice(0, 600));
    await notifyDevError(`otp ${ctx}`, e);
    // НІКОЛИ не показуємо клієнту сирий дамп Ukasko (URL + PHP/JSON). Розрізняємо:
    //  • «невірний код» при перевірці — актуально клієнту, кажемо перевірити лист;
    //  • будь-який збій НАДСИЛАННЯ коду (вкл. v2 422 «код вже підтверджено / лист не
    //    надіслано») — це збій СК, не клієнта, тож просимо повторити або написати нам.
    const isSend = ctx.startsWith("send");
    const wrongCode = !isSend && /не\s*коректн|невірн|прострочен/i.test(msg);
    const clientMsg = wrongCode
      ? "Невірний код підтвердження. Перевірте лист і спробуйте ще раз."
      : isSend
        ? "Не вдалося надіслати код підтвердження (збій на боці страхової). Спробуйте ще раз за хвилину або зверніться в підтримку — допоможемо оформити."
        : "Не вдалося підтвердити код. Спробуйте ще раз за хвилину.";
    return NextResponse.json({ success: false, error: clientMsg }, { status: 500 });
  }
}

export const POST = withJourney("insurance/otp", handlePost);
