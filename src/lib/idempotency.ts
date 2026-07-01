// Ідемпотентність для мутуючих POST-роутів (declare, confirm, invoice, заявки).
// Захищає від подвійного списання/дублів при ретраях мережі, подвійних кліках і
// повторних submit: однаковий ключ → той самий результат, без повторного виклику
// Ukasko/Telegram. Паралельні дублі дедуплікуються (повертаємо той самий проміс).
//
// Обмеження (як і rate-limit): стан у пам'яті процесу. На serverless кожен інстанс
// має власний кеш — це best-effort. Для жорстких гарантій потрібен спільний стор
// (Redis). Помилки НЕ кешуємо — після збою клієнт може повторити з тим же ключем.

export interface IdempotentResult {
  status: number;
  body: unknown;
}

interface Entry {
  promise: Promise<IdempotentResult>;
  createdAt: number;
}

const store = new Map<string, Entry>();
const TTL_MS = 10 * 60 * 1000;

let lastCleanup = Date.now();
function maybeCleanup() {
  const now = Date.now();
  if (now - lastCleanup < TTL_MS) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now - entry.createdAt >= TTL_MS) store.delete(key);
  }
}

/**
 * Виконує producer не більше одного разу на ключ (у межах TTL). Повторні виклики
 * з тим же ключем повертають кешований результат. Якщо key порожній — ідемпотентність
 * вимкнена (звичайна обробка).
 */
export function withIdempotency(
  key: string | null | undefined,
  producer: () => Promise<IdempotentResult>
): Promise<IdempotentResult> {
  if (!key) return producer();

  maybeCleanup();
  const existing = store.get(key);
  if (existing && Date.now() - existing.createdAt < TTL_MS) {
    return existing.promise;
  }

  const promise = producer();
  store.set(key, { promise, createdAt: Date.now() });
  // Збій не кешуємо — прибираємо запис, щоб повтор спрацював.
  promise.catch(() => {
    if (store.get(key)?.promise === promise) store.delete(key);
  });
  return promise;
}
