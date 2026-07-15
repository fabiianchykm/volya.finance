import { NextRequest, NextResponse } from "next/server";
import { guardRequest } from "@/lib/api-guard";
import { sendTelegram, escapeHtml, notifyDevError } from "@/lib/telegram";
import { withIdempotency } from "@/lib/idempotency";
import { normalizePhone, isValidPhone } from "@/lib/phone";

// Заявка на Зелену карту. Онлайн-калькулятора в Ukasko поки немає, тож це лід:
// клієнт лишає телефон + параметри поїздки, менеджеру падає заявка в Telegram.

interface GreenCardParams {
  territory?: string;
  vehicle?: string;
  startDate?: string;
  duration?: string;
}

export async function POST(req: NextRequest) {
  // Захист від cross-site + ліміт, щоб формою не спамили.
  const blocked = guardRequest(req, { name: "greencard", limit: 10, windowMs: 10 * 60 * 1000 });
  if (blocked) return blocked;

  let phone: string;
  let params: GreenCardParams;
  try {
    const body = await req.json();
    phone = String(body?.phone ?? "");
    params = (body?.params ?? {}) as GreenCardParams;
  } catch {
    return NextResponse.json({ success: false, error: "Некоректний запит" }, { status: 400 });
  }

  if (!isValidPhone(phone)) {
    return NextResponse.json({ success: false, error: "Введіть коректний номер телефону" }, { status: 400 });
  }

  const lines = [
    "🌍 <b>Нова заявка на Зелену карту</b>",
    "",
    `📞 Телефон: <code>${escapeHtml(normalizePhone(phone))}</code>`,
    params.territory ? `📍 Територія: ${escapeHtml(params.territory)}` : null,
    params.vehicle ? `🚙 ТЗ: ${escapeHtml(params.vehicle)}` : null,
    params.startDate ? `📅 Початок: ${escapeHtml(params.startDate)}` : null,
    params.duration ? `⏳ Строк: ${escapeHtml(params.duration)}` : null,
  ].filter(Boolean);

  try {
    const idem = req.headers.get("idempotency-key");
    const { status, body } = await withIdempotency(
      idem ? `greencard:${idem}` : null,
      async () => {
        await sendTelegram("sales", lines.join("\n"));
        return { status: 200, body: { success: true } };
      }
    );
    return NextResponse.json(body, { status });
  } catch (e) {
    console.error("[greencard] lead send error:", e instanceof Error ? e.message : e);
    await notifyDevError("greencard lead", e);
    return NextResponse.json(
      { success: false, error: "Не вдалося надіслати заявку. Зателефонуйте нам або спробуйте пізніше." },
      { status: 500 }
    );
  }
}
