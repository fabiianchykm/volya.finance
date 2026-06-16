import { NextRequest, NextResponse } from "next/server";
import { rateLimit, maybeCleanup } from "@/lib/rate-limit";

// Спільний захист для публічних API-роутів, що проксують Ukasko серверними кредами.
// Два бар'єри: (1) запит має походити з нашого сайту, (2) ліміт звернень по IP.
//
// УВАГА: rate-limit тримається в пам'яті процесу — на serverless (Vercel) кожен
// інстанс має власний лічильник, тож це best-effort. Для жорстких гарантій —
// спільний стор (Upstash Redis). Перевірка походження від інстансів не залежить.

export function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/**
 * true — запит прийшов з нашого сайту (браузерний fetch), false — ззовні/прямий тул.
 */
function isSameOrigin(req: NextRequest): boolean {
  // Сучасні браузери завжди шлють Sec-Fetch-Site для fetch/XHR.
  const secFetchSite = req.headers.get("sec-fetch-site");
  if (secFetchSite) {
    return secFetchSite === "same-origin" || secFetchSite === "same-site";
  }
  // Запасний варіант для клієнтів без Sec-Fetch-Site — звіряємо host у Origin/Referer.
  const host = req.headers.get("host");
  const source = req.headers.get("origin") ?? req.headers.get("referer");
  if (!source || !host) return false;
  try {
    return new URL(source).host === host;
  } catch {
    return false;
  }
}

/**
 * Перевіряє лише походження запиту (без rate-limit).
 * Повертає NextResponse з 403, якщо запит не з нашого сайту, інакше null.
 */
export function assertSameOrigin(req: NextRequest): NextResponse | null {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ success: false, error: "Доступ заборонено" }, { status: 403 });
  }
  return null;
}

export interface GuardOptions {
  /** Унікальна назва роута для ключа rate-limit, напр. "vehicle". */
  name: string;
  /** Максимум звернень за вікно з одного IP. */
  limit: number;
  /** Тривалість вікна в мілісекундах. */
  windowMs: number;
}

/**
 * Перевіряє походження запиту і ліміт по IP.
 * Повертає NextResponse з помилкою, якщо запит відхилено, або null, якщо все гаразд.
 */
export function guardRequest(req: NextRequest, opts: GuardOptions): NextResponse | null {
  const originBlocked = assertSameOrigin(req);
  if (originBlocked) return originBlocked;

  maybeCleanup();
  const ip = getClientIp(req);
  const rl = rateLimit(`${opts.name}:${ip}`, opts.limit, opts.windowMs);
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: "Забагато запитів. Спробуйте трохи пізніше." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  return null;
}
