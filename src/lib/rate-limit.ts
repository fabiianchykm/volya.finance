// Простий in-memory rate limiter (fixed window).
//
// Обмеження: стан живе в пам'яті процесу. На одному інстансі (локально,
// один Node-сервер) працює надійно. На serverless/багатоінстансному деплої
// (Vercel) кожен інстанс має власний лічильник — для жорстких гарантій
// потрібен спільний стор (Redis / Upstash). Для захисту від SMS-бомбінгу
// та брутфорсу OTP цього рівня достатньо як першого бар'єру.

type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

export interface RateLimitResult {
  /** true — запит дозволено; false — ліміт вичерпано */
  allowed: boolean;
  /** скільки запитів ще залишилось у поточному вікні */
  remaining: number;
  /** скільки секунд чекати до скидання ліміту */
  retryAfter: number;
}

/**
 * Перевіряє і реєструє звернення за ключем.
 * @param key      унікальний ключ (напр. `otp-send:<ip>:<orderId>`)
 * @param limit    максимум звернень за вікно
 * @param windowMs тривалість вікна в мілісекундах
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || now >= bucket.resetAt) {
    // Нове вікно
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfter: 0 };
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count += 1;
  return {
    allowed: true,
    remaining: limit - bucket.count,
    retryAfter: 0,
  };
}

// Періодичне прибирання застарілих бакетів, щоб Map не ріс безмежно.
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

export function maybeCleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, bucket] of store) {
    if (now >= bucket.resetAt) store.delete(key);
  }
}
