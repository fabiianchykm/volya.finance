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

// Дозволені хости беремо з конфігу сервера, а НЕ із заголовка Host — він
// контролюється клієнтом, тож порівняння Origin===Host було тавтологією
// (зловмисник ставив Origin і Host на свій домен і проходив перевірку).
// Розширити можна через ALLOWED_ORIGINS (домени через кому, напр. preview-деплої).
function buildAllowedHosts(): Set<string> {
  const hosts = new Set<string>();
  const add = (val?: string | null) => {
    if (!val) return;
    try { hosts.add(new URL(val).host); }
    catch { hosts.add(val.trim().replace(/^https?:\/\//, "").split("/")[0]); }
  };
  add(process.env.NEXT_PUBLIC_APP_URL);
  add(process.env.AUTH_URL);
  for (const o of (process.env.ALLOWED_ORIGINS ?? "").split(",")) add(o);
  if (process.env.NODE_ENV !== "production") {
    hosts.add("localhost:3000");
    hosts.add("127.0.0.1:3000");
  }
  return hosts;
}

const ALLOWED_HOSTS = buildAllowedHosts();

function hostAllowed(rawUrl: string): boolean {
  try { return ALLOWED_HOSTS.has(new URL(rawUrl).host); }
  catch { return false; }
}

/**
 * true — запит виглядає як прийшлий з нашого сайту, false — ззовні/прямий тул.
 *
 * УВАГА: усі ці заголовки клієнт може підробити, тож це бар'єр від cross-site/CSRF
 * та наївного скрапінгу, а НЕ повноцінний захист від цілеспрямованих скриптів.
 * Для дій, що тригерять SMS, справжній захист — rate-limit (краще у спільному
 * сторі) + CAPTCHA. Див. otp/route.ts.
 */
function isSameOrigin(req: NextRequest): boolean {
  // Головний бар'єр: якщо є Origin/Referer — їх хост має бути у нашому allowlist.
  // Браузери шлють Origin для cross-origin і для будь-яких POST, тож для
  // чутливих POST-роутів цей заголовок присутній і реально перевіряється.
  const source = req.headers.get("origin") ?? req.headers.get("referer");
  if (source) return hostAllowed(source);

  // Без Origin/Referer (буває для same-origin GET) — додатковий сигнал браузера.
  const secFetchSite = req.headers.get("sec-fetch-site");
  if (secFetchSite) return secFetchSite === "same-origin" || secFetchSite === "same-site";

  // Жодних сигналів походження — відхиляємо.
  return false;
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
