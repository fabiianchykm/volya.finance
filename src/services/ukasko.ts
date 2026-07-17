import type {
  AuthResponse,
  CarInfo,
  City,
  OffersResponse,
  CalculatorParams,
} from "@/types/api";

const isDev = process.env.UKASKO_ENV === "dev";

const BASE_URL = isDev
  ? "https://devconnect.ukasko.ua/api/test"
  : "https://uconnect.com.ua/api/prod";

const AUTH_URL = isDev
  ? "https://devconnect.ukasko.ua/api"
  : "https://uconnect.com.ua/api";

// Помилка HTTP зі збереженим статусом — щоб логіка вище могла відрізнити
// протухлий токен (401) від інших збоїв і перевипустити його.
class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "HttpError";
  }
}

// 502/503/504 від Ukasko/Cloudflare — зазвичай тимчасові (origin перевантажений
// або довго рахує). Кілька повторів зі зростаючою паузою помітно підвищують
// успішність важких запитів (калькулятор, пошук авто). ВИКОРИСТОВУВАТИ ЛИШЕ для
// ідемпотентних GET — мутуючі (draft/declare/confirm) ретраїти не можна (дублі).
async function withRetry<T>(fn: () => Promise<T>, attempts = 3, baseDelayMs = 700): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const transient = e instanceof HttpError && (e.status === 502 || e.status === 503 || e.status === 504);
      if (!transient || i === attempts - 1) throw e;
      await new Promise((r) => setTimeout(r, baseDelayMs * (i + 1)));
    }
  }
  throw lastErr;
}

// ─── POST helper (manually follows redirects so POST is never converted to GET) ───

async function postForm(
  url: string,
  formData: Record<string, string>,
  token?: string
): Promise<unknown> {
  const body = new URLSearchParams(formData).toString();
  const headers: Record<string, string> = {
    accept: "application/json",
    "content-type": "application/x-www-form-urlencoded",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  let target = url;
  for (let i = 0; i < 5; i++) {
    const res = await fetch(target, {
      method: "POST",
      headers,
      body,
      redirect: "manual",
      cache: "no-store",
    });

    // Manually follow redirects so POST is preserved (301/302 normally turn POST → GET)
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) throw new Error(`Redirect with no Location from ${target}`);
      target = location.startsWith("http") ? location : new URL(location, target).href;
      continue;
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new HttpError(res.status, `[POST ${target}] ${res.status}: ${text.slice(0, 400)}`);
    }

    return res.json();
  }

  throw new Error(`Too many redirects: ${url}`);
}

async function postJson(
  url: string,
  data: unknown,
  token: string
): Promise<unknown> {
  const headers: Record<string, string> = {
    accept: "application/json",
    "content-type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  let target = url;
  for (let i = 0; i < 5; i++) {
    const res = await fetch(target, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
      redirect: "manual",
      cache: "no-store",
    });

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) throw new Error(`Redirect with no Location from ${target}`);
      target = location.startsWith("http") ? location : new URL(location, target).href;
      continue;
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new HttpError(res.status, `[POST ${target}] ${res.status}: ${text.slice(0, 400)}`);
    }

    return res.json();
  }

  throw new Error(`Too many redirects: ${url}`);
}

// ─── GET helper ──────────────────────────────────────────────────────────────────

async function getJson(url: string, token: string): Promise<unknown> {
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

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new HttpError(res.status, `[GET ${url}] ${res.status}: ${text.slice(0, 400)}`);
  }

  return res.json();
}

// ─── Service class ────────────────────────────────────────────────────────────────

export class UkaskoService {
  private token: string | null = null;

  async authenticate(): Promise<string> {
    const email = process.env.UKASKO_EMAIL;
    const password = process.env.UKASKO_PASSWORD;

    if (!email || !password) {
      throw new Error("Не задані UKASKO_EMAIL / UKASKO_PASSWORD в .env.local");
    }

    const resp = await postForm(`${AUTH_URL}/auth/login`, { email, password }) as { data: AuthResponse } | AuthResponse;

    const token = (resp as { data: AuthResponse }).data?.token ?? (resp as AuthResponse).token;

    if (!token) {
      throw new Error(`Auth failed — відповідь: ${JSON.stringify(resp).slice(0, 200)}`);
    }

    this.token = token;
    return token;
  }

  private async getToken(): Promise<string> {
    if (!this.token) await this.authenticate();
    return this.token!;
  }

  invalidateToken() {
    this.token = null;
  }

  /**
   * Виконує авторизований запит. Якщо токен протух (401), перевипускає його
   * і повторює запит один раз. Інакше кешований токен жив би до рестарту процесу.
   */
  private async withAuth<T>(fn: (token: string) => Promise<T>): Promise<T> {
    const token = await this.getToken();
    try {
      return await fn(token);
    } catch (e) {
      if (e instanceof HttpError && e.status === 401) {
        this.invalidateToken();
        const fresh = await this.authenticate();
        return await fn(fresh);
      }
      throw e;
    }
  }

  async getCarByPlate(plate: string): Promise<CarInfo> {
    const cyrillicToLatin: Record<string, string> = {
      'А': 'A', 'В': 'B', 'С': 'C', 'Е': 'E', 'Н': 'H', 'І': 'I',
      'К': 'K', 'М': 'M', 'О': 'O', 'Р': 'P', 'Т': 'T', 'Х': 'X'
    };
    const normalized = plate
      .toUpperCase()
      .replace(/\s/g, "")
      .split("")
      .map(char => cyrillicToLatin[char] || char)
      .join("");
    const data = await withRetry(() => this.withAuth((token) => getJson(
      `${BASE_URL}/directories/car/${encodeURIComponent(normalized)}`,
      token
    ))) as { data: CarInfo[] | CarInfo };

    const carData = Array.isArray(data.data) ? data.data[0] : data.data;
    if (!carData) {
      throw new Error(`Авто з номером ${normalized} не знайдено`);
    }
    
    return carData;
  }

  async getCities(): Promise<City[]> {
    // Endpoint не потребує авторизації, використовуємо AUTH_URL (без /test або /prod)
    const res = await fetch(`${AUTH_URL}/directories/cities/all`, {
      method: "GET",
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`[GET cities] ${res.status}: ${text.slice(0, 200)}`);
    }
    const raw = await res.json() as Record<string, unknown>;
    return Array.isArray(raw.data) ? raw.data as City[] : [];
  }

  async getOffers(params: CalculatorParams): Promise<OffersResponse> {
    // Don't encode keys — PHP APIs expect literal car[year]=... not car%5Byear%5D=...
    const qs = Object.entries(params)
      .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
      .join("&");
    // Калькулятор важкий — Ukasko інколи віддає 504. Ретраїмо тимчасові 5xx.
    const raw = await withRetry(() =>
      this.withAuth((token) => getJson(`${BASE_URL}/insurance/calculator/osago?${qs}`, token))
    ) as Record<string, unknown>;

    // Ukasko wraps responses in { data: ... } consistently (same as getCarByPlate, getCities).
    // Detect: if raw.data is a non-array object → wrapped; if raw.data is an array → direct OffersResponse.
    const inner = raw.data;
    if (inner !== null && inner !== undefined && !Array.isArray(inner) && typeof inner === "object") {
      return inner as unknown as OffersResponse;
    }
    return raw as unknown as OffersResponse;
  }

  async createDraft(orderData: Record<string, unknown>): Promise<{ id: string; status: string }> {
    const data = await this.withAuth((token) => postJson(
      `${BASE_URL}/insurance/order/osago`,
      { ...orderData, statusId: 1 },
      token
    )) as { data: [{ id: string; status: string }] };
    return data.data[0];
  }

  async declarePolicy(
    orderData: Record<string, unknown>
  ): Promise<{ id: string; status: string; mtsbuLink?: string }> {
    const payload = { ...orderData, statusId: 2 } as Record<string, unknown>;
    const raw = await this.withAuth((token) => postJson(
      `${BASE_URL}/insurance/order/osago`,
      payload,
      token
    )) as Record<string, unknown>;

    // Якщо API повернув помилку валідації всередині status:"success"
    const msg = raw.message as string | undefined;
    if (msg && msg.includes('"result":false')) {
      try {
        const parsed = JSON.parse(msg) as { error?: string; errors?: Record<string, string> };
        const errText =
          parsed.error ||
          Object.values(parsed.errors ?? {}).join("; ") ||
          "Помилка заявлення поліса";
        throw new Error(errText);
      } catch (parseErr) {
        if (parseErr instanceof Error && parseErr.message !== msg) throw parseErr;
        throw new Error(msg);
      }
    }

    const data = raw as { data: [{ id: string; status: string; mtsbuLink?: string }] };
    if (!data.data?.[0]) throw new Error("Порожня відповідь від сервера");
    return data.data[0];
  }

  async sendOtp(orderId: string, type: 1 | 2 = 1): Promise<void> {
    await this.withAuth((token) => postForm(`${AUTH_URL}/orders/send-otp/${orderId}`, { type: String(type) }, token));
  }

  async checkOtp(orderId: string, otp: string): Promise<boolean> {
    const data = await this.withAuth((token) => postForm(
      `${AUTH_URL}/orders/check-otp/${orderId}`,
      { otp },
      token
    )) as Record<string, unknown>;
    const d = data.data as string | undefined;
    return d === "OK";
  }

  async getInvoice(orderId: string, resultUrl: string) {
    const attempts = [
      { method: "GET" as const, url: `${AUTH_URL}/orders/${orderId}/get-invoice?result_url=${encodeURIComponent(resultUrl)}` },
      { method: "GET" as const, url: `${BASE_URL}/orders/${orderId}/get-invoice?result_url=${encodeURIComponent(resultUrl)}` },
      { method: "POST" as const, url: `${AUTH_URL}/orders/${orderId}/get-invoice` },
      { method: "POST" as const, url: `${BASE_URL}/orders/${orderId}/get-invoice` },
    ];

    return this.withAuth(async (token) => {
      for (const { method, url } of attempts) {
        try {
          const raw = method === "GET"
            ? await getJson(url, token) as Record<string, unknown>
            : await postForm(url, { result_url: resultUrl }, token) as Record<string, unknown>;

          const d = (raw.data ?? raw) as Record<string, unknown>;
          if (d.invoiceLink) {
            return d as unknown as { invoiceLink: string; qrCode: string };
          }
        } catch (e) {
          // Протухлий токен пробрасуємо нагору — withAuth перевипустить і повторить.
          if (e instanceof HttpError && e.status === 401) throw e;
          // Інші збої цієї спроби — пробуємо наступний ендпоінт.
        }
      }
      throw new Error("Не вдалось отримати посилання на оплату. Зверніться до підтримки.");
    });
  }

  async getOrderInfo(orderId: string) {
    const raw = await this.withAuth((token) => getJson(`${AUTH_URL}/orders/${orderId}/get-invoice`, token)) as Record<string, unknown>;
    const d = (raw.data ?? raw) as Record<string, unknown>;
    return {
      mtsbuLink: d.mtsbuLink as string | null ?? d.mtsbuCodeLink as string | null ?? null,
    };
  }

  async checkInvoice(orderId: string) {
    const data = await this.withAuth((token) => getJson(
      `${AUTH_URL}/payments/${orderId}/check-invoice`,
      token
    )) as { data: { status_id: number; payed_at: string | null } };
    return data.data;
  }

  async confirmPolicy(orderId: string) {
    const data = await this.withAuth((token) => postJson(
      `${BASE_URL}/insurance/contract/confirm`,
      { orderId },
      token
    )) as { data: [{ contractId: string; status: string }] };
    return data.data[0];
  }

  async downloadContract(contractId: string) {
    const data = await this.withAuth((token) => postForm(
      `${BASE_URL}/insurance/contract/take`,
      { contractId, orderType: "1" },
      token
    )) as { data: { mtsbuLink: string; contract: string } };
    return data.data;
  }
}

export const ukaskoService = new UkaskoService();
