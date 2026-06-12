import { NextResponse } from "next/server";

const isDev = process.env.UKASKO_ENV === "dev";
const AUTH_URL = isDev ? "https://devconnect.ukasko.ua/api" : "https://connect.ukasko.ua/api";
const BASE_URL = isDev ? "https://devconnect.ukasko.ua/api/test" : "https://connect.ukasko.ua/api/prod";

export async function GET() {
  // Діагностичний ендпоінт — лише для локальної розробки.
  // У продакшні розкриває конфіг і робить живий логін, тому повертаємо 404.
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Not found", { status: 404 });
  }

  const log: Record<string, unknown> = {
    config: {
      UKASKO_ENV: process.env.UKASKO_ENV ?? "(not set → production)",
      AUTH_URL,
      BASE_URL,
      email: process.env.UKASKO_EMAIL
        ? `${process.env.UKASKO_EMAIL.slice(0, 3)}***`
        : "❌ MISSING",
      password: process.env.UKASKO_PASSWORD ? "***set***" : "❌ MISSING",
    },
  };

  const email = process.env.UKASKO_EMAIL ?? "";
  const password = process.env.UKASKO_PASSWORD ?? "";
  const body = new URLSearchParams({ email, password }).toString();

  // --- AUTH (with redirect: "manual") ---
  let token: string | null = null;
  try {
    let target = `${AUTH_URL}/auth/login`;
    for (let i = 0; i < 5; i++) {
      const res = await fetch(target, {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/x-www-form-urlencoded",
        },
        body,
        redirect: "manual",
        cache: "no-store",
      });

      log[`auth_attempt_${i + 1}`] = {
        url: target,
        status: res.status,
        ok: res.ok,
        type: res.type,
        location: res.headers.get("location"),
      };

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        if (!location) { log["auth_error"] = "Redirect with no Location header"; break; }
        target = location.startsWith("http") ? location : new URL(location, target).href;
        continue;
      }

      const text = await res.text().catch(() => "");
      log[`auth_attempt_${i + 1}_body`] = text.slice(0, 400);

      if (res.ok) {
        try {
          const json = JSON.parse(text) as { token?: string };
          token = json.token ?? null;
          log["auth_result"] = token ? "✅ token obtained" : "❌ no token in response";
        } catch {
          log["auth_result"] = "❌ JSON parse error";
        }
      } else {
        log["auth_result"] = `❌ status ${res.status}`;
      }
      break;
    }
  } catch (e) {
    log["auth_exception"] = String(e);
  }

  // --- CAR LOOKUP (only if auth worked) ---
  if (token) {
    try {
      const url = `${BASE_URL}/directories/car/AA1234BB`;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        redirect: "follow",
        cache: "no-store",
      });

      const text = await res.text().catch(() => "");
      log["car_lookup"] = {
        url,
        status: res.status,
        ok: res.ok,
        body: text.slice(0, 400),
      };
    } catch (e) {
      log["car_lookup_error"] = String(e);
    }
  }

  return NextResponse.json(log, { status: 200 });
}
