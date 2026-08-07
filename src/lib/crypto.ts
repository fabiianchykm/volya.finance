import crypto from "crypto";

// Шифрування чутливих даних (профіль страхувальника: ІПН, паспорт, адреса) ПЕРЕД
// записом у БД. Алгоритм — AES-256-GCM (authenticated encryption: конфіденційність
// + захист від підміни через auth tag).
//
// Ключ береться з PROFILE_ENC_KEY (будь-який рядок-секрет). Ми пропускаємо його
// через SHA-256 → рівно 32 байти для AES-256, тож формат/довжина секрету не важливі.
// Якщо змінної нема — деградуємо тихо (пишемо відкритим текстом), як і решта дата-шару
// без DATABASE_URL, щоб не ламати сайт. У проді PROFILE_ENC_KEY має бути заданий.

const rawKey = process.env.PROFILE_ENC_KEY;
const KEY = rawKey ? crypto.createHash("sha256").update(rawKey).digest() : null;

export const isEncryptionConfigured = KEY !== null;

// Конверт зашифрованих даних (зберігається в jsonb-колонці як звичайний обʼєкт).
interface EncEnvelope {
  enc: 1;        // маркер версії/формату — щоб відрізняти від легасі-відкритих даних
  iv: string;    // base64, 12 байт (GCM nonce)
  tag: string;   // base64, auth tag
  ct: string;    // base64, шифротекст
}

function isEnvelope(v: unknown): v is EncEnvelope {
  return typeof v === "object" && v !== null && (v as EncEnvelope).enc === 1;
}

/** Шифрує довільний JSON. Без ключа повертає значення як є (відкритим текстом). */
export function encryptJson(value: unknown): EncEnvelope | unknown {
  if (!KEY) return value ?? {};
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
  const plaintext = Buffer.from(JSON.stringify(value ?? {}), "utf8");
  const ct = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { enc: 1, iv: iv.toString("base64"), tag: tag.toString("base64"), ct: ct.toString("base64") };
}

/** Розшифровує конверт назад у JSON. Легасі-відкриті дані повертає як є. */
export function decryptJson<T = unknown>(stored: unknown): T | null {
  if (stored == null) return null;
  if (!isEnvelope(stored)) return stored as T;   // старі записи, збережені відкрито
  if (!KEY) return null;                          // зашифровано, але ключа нема — не читаємо
  try {
    const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, Buffer.from(stored.iv, "base64"));
    decipher.setAuthTag(Buffer.from(stored.tag, "base64"));
    const pt = Buffer.concat([decipher.update(Buffer.from(stored.ct, "base64")), decipher.final()]);
    return JSON.parse(pt.toString("utf8")) as T;
  } catch {
    return null; // невірний ключ або пошкоджені дані
  }
}
