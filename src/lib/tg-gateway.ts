// Клієнт Telegram Gateway API (gateway.telegram.org) — доставка кодів підтвердження
// на номер телефону через Telegram. https://core.telegram.org/gateway/api

const TOKEN = process.env.TELEGRAM_GATEWAY_TOKEN;
const BASE = "https://gatewayapi.telegram.org";

async function gw(method: string, body: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  if (!TOKEN) return null;
  try {
    const res = await fetch(`${BASE}/${method}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${TOKEN}`, "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    return (await res.json().catch(() => null)) as Record<string, unknown> | null;
  } catch {
    return null;
  }
}

/**
 * Чи можна доставити код у Telegram на цей номер (безкоштовна перевірка).
 * requestId переиспользуємо у sendVerificationMessage, щоб не платити двічі.
 * Якщо номера немає в Telegram → deliverable=false → фолбек на SMS.
 */
export async function checkTelegramDeliverable(phone: string): Promise<{ deliverable: boolean; requestId?: string }> {
  const j = await gw("checkSendAbility", { phone_number: phone });
  const result = j?.ok ? (j.result as { request_id?: string } | undefined) : undefined;
  if (result?.request_id) return { deliverable: true, requestId: result.request_id };
  return { deliverable: false };
}

/** Надсилає наш 6-значний код через Telegram. true — прийнято до відправки. */
export async function sendTelegramCode(phone: string, code: string, requestId?: string): Promise<boolean> {
  const body: Record<string, unknown> = { phone_number: phone, code, ttl: 300 };
  if (requestId) body.request_id = requestId;
  const j = await gw("sendVerificationMessage", body);
  return !!j?.ok;
}
