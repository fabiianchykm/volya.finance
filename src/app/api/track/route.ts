import { NextRequest, NextResponse } from "next/server";
import { guardRequest } from "@/lib/api-guard";
import { trySendTelegram, escapeHtml } from "@/lib/telegram";

// Клієнтські події воронки → Telegram:
//   payment_started → sales-бот («розпочато оплату», з контекстом покупки)
//   abandoned       → dev-бот («зрив на пізньому кроці» — лише otp/payment, щоб не спамити)
// Усе fire-and-forget з боку клієнта; тут просто акуратно маршрутизуємо.

interface TrackContext {
  company?: string;
  price?: number;
  car?: string;
  plate?: string;
  phone?: string;
  email?: string;
}

// Кроки, зрив на яких вартий уваги dev-бота (клієнт і так шле лише їх, це запобіжник).
const LATE_STEPS = new Set(["otp", "payment"]);

function s(v: unknown, max = 80): string {
  return escapeHtml(String(v ?? "").slice(0, max));
}

export async function POST(req: NextRequest) {
  // Подій може бути багато (beacon на виході) — ліміт вищий, але обмежений.
  const blocked = guardRequest(req, { name: "track", limit: 60, windowMs: 10 * 60 * 1000 });
  if (blocked) return blocked;

  let event: string;
  let step: string;
  let ctx: TrackContext;
  try {
    const body = await req.json();
    event = String(body?.event ?? "");
    step = String(body?.step ?? "");
    ctx = (body?.context ?? {}) as TrackContext;
  } catch {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const car = ctx.car ? `🚙 Авто: ${s(ctx.car)}` : null;
  const company = ctx.company ? `🏢 Компанія: ${s(ctx.company)}` : null;
  const price = typeof ctx.price === "number" ? `💰 Сума: <b>${ctx.price} грн</b>` : null;
  const contact = ctx.phone
    ? `📞 <code>${s(ctx.phone, 20)}</code>`
    : ctx.email
      ? `📧 <code>${s(ctx.email)}</code>`
      : null;

  if (event === "payment_started") {
    const lines = ["💳 <b>Розпочато оплату</b>", "", company, car, price, contact].filter(Boolean);
    await trySendTelegram("sales", lines.join("\n"));
    return NextResponse.json({ success: true });
  }

  if (event === "abandoned" && LATE_STEPS.has(step)) {
    const lines = [
      `⚠️ <b>Зрив на кроці «${s(step, 20)}»</b>`,
      company,
      car,
      price,
      contact,
    ].filter(Boolean);
    await trySendTelegram("dev", lines.join("\n"));
    return NextResponse.json({ success: true });
  }

  // Невідома подія / ранній крок — тихо ігноруємо (не помилка).
  return NextResponse.json({ success: true });
}
