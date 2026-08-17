import { NextRequest, NextResponse } from "next/server";
import { guardRequest } from "@/lib/api-guard";
import { trySendTelegram, escapeHtml } from "@/lib/telegram";
import { saveLead } from "@/lib/leads";
import { saveCalcLead } from "@/lib/calc-leads";

// Клієнтські події воронки → Telegram (+ БД для лідів):
//   checkout_started → лід у БД (/admin/leads) + пінг у sales («почав оформлення»)
//   payment_started  → sales-бот («розпочато оплату», з контекстом покупки)
//   abandoned        → dev-бот («зрив на пізньому кроці» — лише otp/payment, щоб не спамити)
// Усе fire-and-forget з боку клієнта; тут просто акуратно маршрутизуємо.

interface TrackContext {
  product?: string;
  name?: string;
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
  let body: Record<string, unknown>;
  try {
    body = await req.json();
    event = String(body?.event ?? "");
    step = String(body?.step ?? "");
    ctx = (body?.context ?? {}) as TrackContext;
  } catch {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  // Прорахунок на калькуляторі → лід у БД (/admin/calculations). Тихо, без Telegram.
  if (event === "calculate") {
    try {
      await saveCalcLead({
        product: String(body?.product ?? ""),
        params: (body?.params ?? {}) as Record<string, unknown>,
        visitor: typeof body?.visitor === "string" ? body.visitor : null,
      });
    } catch { /* аналітика не має ламати відповідь */ }
    return NextResponse.json({ success: true });
  }

  const car = ctx.car ? `🚙 Авто: ${s(ctx.car)}` : null;
  const company = ctx.company ? `🏢 Компанія: ${s(ctx.company)}` : null;
  const price = typeof ctx.price === "number" ? `💰 Сума: <b>${ctx.price} грн</b>` : null;
  const contact = ctx.phone
    ? `📞 <code>${s(ctx.phone, 20)}</code>`
    : ctx.email
      ? `📧 <code>${s(ctx.email)}</code>`
      : null;

  if (event === "checkout_started") {
    // Лід у БД (для /admin/leads) — не має ламати відповідь клієнту.
    try {
      await saveLead({
        product: ctx.product ?? null,
        customerName: ctx.name ?? null,
        phone: ctx.phone ?? null,
        email: ctx.email ?? null,
        company: ctx.company ?? null,
        price: typeof ctx.price === "number" ? ctx.price : null,
        car: ctx.car ?? null,
        stage: step || "otp",
      });
    } catch (e) {
      console.error("[track] saveLead error:", e instanceof Error ? e.message : e);
    }
    const lines = [
      `📝 <b>Почав оформлення${ctx.product ? ` · ${s(ctx.product)}` : ""}</b>`,
      "",
      ctx.name ? `👤 ${s(ctx.name)}` : null,
      company,
      car,
      price,
      contact,
    ].filter(Boolean);
    await trySendTelegram("sales", lines.join("\n"));
    return NextResponse.json({ success: true });
  }

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
