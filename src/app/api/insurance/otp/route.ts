import { NextRequest, NextResponse } from "next/server";
import { ukaskoService } from "@/services/ukasko";
import { rateLimit, maybeCleanup } from "@/lib/rate-limit";

// Ліміти підібрані під реальний UX: на оформлення поліса вистачає
// кількох SMS і кількох спроб введення коду.
const SEND_LIMIT = 3;          // не більше 3 SMS
const SEND_WINDOW_MS = 10 * 60 * 1000;   // за 10 хвилин

const CHECK_LIMIT = 5;         // не більше 5 спроб коду
const CHECK_WINDOW_MS = 10 * 60 * 1000;  // за 10 хвилин

function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: NextRequest) {
  try {
    maybeCleanup();

    const { action, orderId, otp } = await req.json();

    if (!orderId) {
      return NextResponse.json({ success: false, error: "Missing orderId" }, { status: 400 });
    }

    const ip = getClientIp(req);

    if (action === "send") {
      const rl = rateLimit(`otp-send:${ip}:${orderId}`, SEND_LIMIT, SEND_WINDOW_MS);
      if (!rl.allowed) {
        return NextResponse.json(
          { success: false, error: "Забагато запитів на SMS. Спробуйте пізніше." },
          { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
        );
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
      const ok = await ukaskoService.checkOtp(orderId, otp);
      return NextResponse.json({ success: true, valid: ok });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Error" }, { status: 500 });
  }
}
