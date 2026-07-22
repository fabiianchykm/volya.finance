import { NextRequest, NextResponse } from "next/server";
import { guardRequest, assertSameOrigin } from "@/lib/api-guard";
import { normalizePhone, createPhoneCode } from "@/lib/phone-login";
import { checkTelegramDeliverable, sendTelegramCode } from "@/lib/tg-gateway";

// Надсилання коду входу за номером телефону.
// Спершу пробуємо Telegram (Gateway). Якщо номера немає в Telegram → канал "sms"
// (поки не підключено → повідомляємо клієнта). Перевірку коду робить NextAuth
// credentials-провайдер "phone".

export async function POST(req: NextRequest) {
  const originBlocked = assertSameOrigin(req);
  if (originBlocked) return originBlocked;

  const blocked = guardRequest(req, { name: "phone-auth", limit: 6, windowMs: 10 * 60 * 1000 });
  if (blocked) return blocked;

  let phoneRaw = "";
  try {
    phoneRaw = String((await req.json())?.phone ?? "");
  } catch {
    return NextResponse.json({ success: false, error: "Bad request" }, { status: 400 });
  }

  const phone = normalizePhone(phoneRaw);
  if (!phone) {
    return NextResponse.json({ success: false, error: "Невірний номер телефону" }, { status: 400 });
  }

  // Чи доставимо через Telegram?
  const { deliverable, requestId } = await checkTelegramDeliverable(phone);

  if (!deliverable) {
    // Немає Telegram → тут буде SMS (поки не підключено).
    return NextResponse.json({
      success: false,
      channel: "sms",
      error: "Цей номер не в Telegram. Вхід за SMS буде доступний незабаром.",
    });
  }

  const code = await createPhoneCode(phone);
  if (!code) {
    return NextResponse.json({ success: false, error: "Тимчасова помилка. Спробуйте пізніше." }, { status: 500 });
  }

  const sent = await sendTelegramCode(phone, code, requestId);
  if (!sent) {
    return NextResponse.json(
      { success: false, error: "Не вдалося надіслати код у Telegram. Спробуйте ще раз." },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true, channel: "telegram" });
}
