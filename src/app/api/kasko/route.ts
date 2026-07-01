import { NextRequest, NextResponse } from "next/server";
import { guardRequest } from "@/lib/api-guard";
import { sendTelegramMessage, escapeHtml } from "@/lib/telegram";
import { withIdempotency } from "@/lib/idempotency";

// Заявка на КАСКО. КАСКО не оформлюється онлайн — клієнт лишає телефон, заявка
// з даними авто йде менеджеру в Telegram, він передзвонює й рахує індивідуально.

interface KaskoVehicle {
  number?: string;
  mark?: string;
  model?: string;
  year?: number;
  vin?: string;
  cityName?: string;
}

// Нормалізує український номер до вигляду +380XXXXXXXXX (best-effort).
function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("380")) return `+${digits}`;
  if (digits.length === 10 && digits.startsWith("0")) return `+38${digits}`;
  if (digits.length === 9) return `+380${digits}`;
  return raw.trim();
}

function isValidPhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 9 && digits.length <= 13;
}

export async function POST(req: NextRequest) {
  // Захист від cross-site + ліміт, щоб формою не спамили заявками.
  const blocked = guardRequest(req, { name: "kasko", limit: 10, windowMs: 10 * 60 * 1000 });
  if (blocked) return blocked;

  let phone: string;
  let vehicle: KaskoVehicle;
  let product: string;
  try {
    const body = await req.json();
    phone = String(body?.phone ?? "");
    vehicle = (body?.vehicle ?? {}) as KaskoVehicle;
    // Назва продукту приходить з клієнта (КАСКО / Міні-КАСКО). Обмежуємо довжину,
    // щоб у заявку не вставили сторонній текст; дефолт — КАСКО.
    product = String(body?.product ?? "КАСКО").slice(0, 40);
  } catch {
    return NextResponse.json({ success: false, error: "Некоректний запит" }, { status: 400 });
  }

  if (!isValidPhone(phone)) {
    return NextResponse.json({ success: false, error: "Введіть коректний номер телефону" }, { status: 400 });
  }

  const carTitle = [vehicle.mark, vehicle.model].filter(Boolean).join(" ") || "—";
  const lines = [
    `🚗 <b>Нова заявка на ${escapeHtml(product)}</b>`,
    "",
    `📞 Телефон: <code>${escapeHtml(normalizePhone(phone))}</code>`,
    `🚙 Авто: ${escapeHtml(carTitle)}${vehicle.year ? `, ${vehicle.year}` : ""}`,
    vehicle.number ? `🔢 Номер: <code>${escapeHtml(vehicle.number)}</code>` : null,
    vehicle.vin ? `🆔 VIN: <code>${escapeHtml(vehicle.vin)}</code>` : null,
    vehicle.cityName ? `📍 Місто: ${escapeHtml(vehicle.cityName)}` : null,
  ].filter(Boolean);

  try {
    // Дедуплікуємо за клієнтським ключем — подвійний submit не задвоює заявку в Telegram.
    const idem = req.headers.get("idempotency-key");
    const { status, body } = await withIdempotency(
      idem ? `kasko:${idem}` : null,
      async () => {
        await sendTelegramMessage(lines.join("\n"));
        return { status: 200, body: { success: true } };
      }
    );
    return NextResponse.json(body, { status });
  } catch (e) {
    console.error("[kasko] lead send error:", e instanceof Error ? e.message : e);
    return NextResponse.json(
      { success: false, error: "Не вдалося надіслати заявку. Зателефонуйте нам або спробуйте пізніше." },
      { status: 500 }
    );
  }
}
