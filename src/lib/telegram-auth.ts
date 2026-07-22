import { createHash, createHmac, timingSafeEqual } from "crypto";

// Перевірка підпису даних Telegram Login Widget.
// https://core.telegram.org/widgets/login#checking-authorization
// data-check-string = усі поля (крім hash), відсортовані, "key=value" через \n.
// secret = SHA256(bot_token); очікуваний hash = HMAC-SHA256(data-check-string, secret).

export type TelegramAuthData = Record<string, string | undefined> & {
  id?: string;
  hash?: string;
  auth_date?: string;
};

export function verifyTelegramAuth(data: TelegramAuthData, botToken: string): boolean {
  const { hash } = data;
  if (!hash || !botToken || !data.id) return false;

  const dataCheckString = Object.keys(data)
    .filter((k) => k !== "hash" && data[k] !== undefined && data[k] !== "")
    .sort()
    .map((k) => `${k}=${data[k]}`)
    .join("\n");

  const secret = createHash("sha256").update(botToken).digest();
  const expected = createHmac("sha256", secret).update(dataCheckString).digest("hex");

  // Порівняння сталого часу.
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(hash, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

  // Захист від повторного використання старих даних (макс. 24 год).
  const authDate = Number(data.auth_date);
  if (!authDate || Math.floor(Date.now() / 1000) - authDate > 86400) return false;

  return true;
}
