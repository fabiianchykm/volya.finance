import type {
  AuthResponse,
  CarInfo,
  City,
  OffersResponse,
  CalculatorParams,
  GreenCardOffer,
  GreenCardParams,
  MiniKaskoOffer,
  MiniKaskoParams,
  HomeOffer,
  HomeParams,
  TourismOffer,
  TourismParams,
  PetsOffer,
  PetsParams,
} from "@/types/api";

const isDev = process.env.UKASKO_ENV === "dev";

// Чи це dev-середовище. Використовується фронтендом (через API), щоб дозволити
// підтвердження поліса БЕЗ оплати ЛИШЕ в тесті. На проді такого шляху бути не
// повинно — інакше видаються реальні поліси безкоштовно.
export const UKASKO_IS_DEV = isDev;

const BASE_URL = isDev
  ? "https://devconnect.ukasko.ua/api/test"
  : "https://uconnect.com.ua/api/prod";

const AUTH_URL = isDev
  ? "https://devconnect.ukasko.ua/api"
  : "https://uconnect.com.ua/api";

// Міні-КАСКО НЕ має {test/prod}-префікса — ендпоінти живуть просто під /api.
const MINI_BASE = `${AUTH_URL}/insurance/mini-kasko`;
// Страхування житла — з префіксом {mode} (як ОСЦПВ): /api/prod|test/insurance/home.
const HOME_BASE = `${BASE_URL}/insurance/home`;

// Модулі страхових Зеленої карти (прод): 9 УСГ, 10 ВУСО, 11 ТАС, 17 УТІКО,
// 18 ОРАНТА, 29 ІНГО, 31 АРКС. Використовуються лише для деградованого fallback
// getGreenCardOffers, коли повний батч калькулятора падає через один модуль.
const GC_MODULE_IDS = [9, 10, 11, 17, 18, 29, 31];

// Прод-API (uconnect.com.ua) стоїть за Cloudflare, який блокує запити без
// браузерного User-Agent (403). Шлемо реалістичний UA у кожному запиті.
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

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
async function withRetry<T>(fn: () => Promise<T>, attempts = 3, baseDelayMs = 700, retry500 = false): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      // 502/503/504 — завжди тимчасові. 500 ретраїмо лише для калькуляторів
      // (retry500): деякі модулі страхових, напр. INGO у Зеленій карті, час від
      // часу падають 500-кою й зносять УВесь список пропозицій — повтор рятує.
      const status = e instanceof HttpError ? e.status : 0;
      // Мережеві скиди зʼєднання з апстрімом (ECONNRESET, socket hang up, fetch
      // failed, таймаути) — теж тимчасові: fetch кидає TypeError без HttpError.
      const netMsg = e instanceof Error ? e.message : String(e);
      const networkTransient = status === 0 && /ECONNRESET|ECONNREFUSED|ETIMEDOUT|EAI_AGAIN|socket hang up|fetch failed|network|timeout/i.test(netMsg);
      const transient = status === 502 || status === 503 || status === 504 || (retry500 && status === 500) || networkTransient;
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
    "user-agent": UA,
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
    "user-agent": UA,
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
      "user-agent": UA,
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
      headers: { accept: "application/json", "user-agent": UA },
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

  // Калькулятор «Зелена карта»: POST з JSON-параметрами → масив пропозицій.
  // Проблема: калькулятор рахує всі страхові одним батчем, і якщо ОДИН модуль
  // падає 500-кою (регулярно — АТ «СК «ІНГО», moduleId 29), Ukasko віддає 500 на
  // ВЕСЬ запит — зникають усі пропозиції. retry500 рятує від коротких флапів, а
  // якщо не допомогло — деградований fallback: опитуємо кожну страхову окремо
  // (moduleId обмежує розрахунок однією СК) і зливаємо ті, що відповіли.
  async getGreenCardOffers(params: GreenCardParams): Promise<GreenCardOffer[]> {
    const url = `${BASE_URL}/insurance/greencard/calculator`;
    // Per-module fallback: коли повний батч падає 500 (регулярно INGO) АБО віддає
    // 200-порожньо (один страховик валить видачу тихо) — рахуємо кожну СК окремо
    // (moduleId) і зливаємо ті, що відповіли.
    const perModule = async (reason: string): Promise<GreenCardOffer[]> => {
      console.error(`[greencard] full batch ${reason} → per-module fallback`);
      const results = await Promise.allSettled(
        GC_MODULE_IDS.map((moduleId) =>
          withRetry(() => this.withAuth((token) => postJson(url, { ...params, moduleId }, token)), 2, 500)
        )
      );
      const byId = new Map<string, GreenCardOffer>();
      for (const r of results) {
        if (r.status !== "fulfilled") continue;
        const d = (r.value as Record<string, unknown>).data;
        if (Array.isArray(d)) for (const o of d as GreenCardOffer[]) if (o?.offerId) byId.set(o.offerId, o);
      }
      const offers = [...byId.values()];
      const ok = results.filter((r) => r.status === "fulfilled").length;
      console.error(`[greencard] fallback recovered ${offers.length} offers from ${ok}/${GC_MODULE_IDS.length} insurers`);
      return offers;
    };

    try {
      const raw = await withRetry(
        () => this.withAuth((token) => postJson(url, params, token)),
        3, 700, true
      ) as Record<string, unknown>;
      const data = raw.data;
      const offers = Array.isArray(data) ? (data as GreenCardOffer[]) : [];
      if (offers.length > 0) return offers;
      // 200, але порожньо — теж пробуємо по-модульно.
      return await perModule("empty");
    } catch (e) {
      const offers = await perModule("failed");
      if (offers.length === 0) throw e; // геть усе впало — віддаємо оригінальну помилку
      return offers;
    }
  }

  // Доступні тарифи комісії агента для тварин (earnings). Напр. [15, 40].
  async getPetsTariffs(): Promise<number[]> {
    const raw = await withRetry(() =>
      this.withAuth((token) => getJson(`${BASE_URL}/insurance/pets/tariffs`, token))
    ) as Record<string, unknown>;
    const data = raw.data;
    if (!Array.isArray(data)) return [];
    return (data as Array<{ value?: number }>).map((t) => Number(t.value)).filter((v) => !Number.isNaN(v));
  }

  // Калькулятор страхування тварин → масив пропозицій (startFrom/insurancePeriod/earnings).
  async getPetsOffers(params: PetsParams): Promise<PetsOffer[]> {
    const raw = await withRetry(() =>
      this.withAuth((token) => postJson(`${BASE_URL}/insurance/pets/calculator`, params, token))
    ) as Record<string, unknown>;
    const data = raw.data;
    return Array.isArray(data) ? (data as PetsOffer[]) : [];
  }

  // Заявлення страхування тварин (order/create statusId:5 → повне) → orderId.
  async declarePetsOrder(orderData: Record<string, unknown>): Promise<{ id: string; status?: string }> {
    const raw = await this.withAuth((token) => postJson(
      `${BASE_URL}/insurance/pets/order/create`, { ...orderData, statusId: 5, orderId: orderData.orderId ?? null }, token
    )) as Record<string, unknown>;
    const status = raw.status as string | undefined;
    const msg = raw.message as string | undefined;
    if (status === "error" || status === "validation" || (msg && msg.includes('"result":false'))) {
      console.error("[pets declare] rejected. raw:", JSON.stringify(raw).slice(0, 800));
      let clean = "";
      if (raw.data && typeof raw.data === "object" && !Array.isArray(raw.data)) {
        clean = Object.values(raw.data as Record<string, unknown>).flat().map(String).join("; ");
      }
      throw new Error(clean || `Страхова відхилила заявку: ${(msg ?? "").slice(0, 200)}`);
    }
    const first = (raw as { data?: Array<{ id: string; status?: string }> }).data?.[0];
    if (!first?.id) throw new Error("Порожня відповідь від сервера. Спробуйте іншу пропозицію.");
    return first;
  }

  async confirmPetsOrder(orderId: string): Promise<{ contractId: string; status?: string }> {
    const data = await this.withAuth((token) => postJson(
      `${BASE_URL}/insurance/pets/contract/confirm`, { orderId }, token
    )) as { data: [{ contractId: string; status?: string }] };
    return data.data[0];
  }

  async takePetsContract(contractId: string): Promise<{ contract?: string; mtsbuLink?: string; mtsbuCode?: string }> {
    const data = await this.withAuth((token) => postForm(
      `${BASE_URL}/insurance/pets/contract/take`, { contractId }, token
    )) as { data: { contract?: string; mtsbuCode?: string } };
    return { contract: data.data?.contract, mtsbuCode: data.data?.mtsbuCode };
  }

  // Калькулятор туристичного страхування → масив пропозицій.
  async getTourismOffers(params: TourismParams): Promise<TourismOffer[]> {
    const url = `${BASE_URL}/insurance/calculator/tourism`;
    const once = async (): Promise<TourismOffer[]> => {
      const raw = await withRetry(() => this.withAuth((token) => postJson(url, params, token))) as Record<string, unknown>;
      const data = raw.data;
      return Array.isArray(data) ? (data as TourismOffer[]) : [];
    };
    // Туристичне не має per-module fallback; при 200-порожньо (транзієнтний флап
    // страховика) — одна повторна спроба, перш ніж показати «нічого не знайдено».
    let offers = await once();
    if (offers.length === 0) {
      console.error("[tourism] empty result → one retry");
      offers = await once();
    }
    return offers;
  }

  // ── Туристичне: заявлення (save) → orderId; фіналізація (nextFinal) → contractId;
  //    завантаження полісу (tourism/contract/take). OTP та оплата — спільні по orderId.
  private tourismErr(raw: Record<string, unknown>, ctx: string): void {
    const status = raw.status as string | undefined;
    const msg = raw.message as string | undefined;
    const isErr = status === "error" || status === "validation" || (msg && msg.includes('"result":false'));
    if (!isErr) return;
    console.error(`[tourism ${ctx}] rejected. raw:`, JSON.stringify(raw).slice(0, 800));
    if (/undefined (index|offset|array key)|server error/i.test(msg ?? JSON.stringify(raw))) {
      throw new Error("Ця страхова компанія тимчасово недоступна для оформлення. Оберіть іншу пропозицію.");
    }
    // Витягуємо людський текст із errorMessage/валідації.
    let clean = "";
    try {
      const inner = JSON.parse(msg ?? "{}") as { result?: { errorMessage?: string } };
      clean = inner.result?.errorMessage ?? "";
    } catch { /* not json */ }
    if (!clean && raw.data && typeof raw.data === "object" && !Array.isArray(raw.data)) {
      clean = Object.values(raw.data as Record<string, unknown>).flat().map(String).join("; ");
    }
    throw new Error(clean || `Страхова відхилила заявку: ${(msg ?? "").slice(0, 200)}`);
  }

  async declareTourismOrder(orderData: Record<string, unknown>): Promise<{ id: string; status?: string }> {
    const payload = { ...orderData, params: { type: "save", statusId: 1 } };
    const raw = await this.withAuth((token) => postJson(
      `${BASE_URL}/insurance/tourism/order/create`, payload, token
    )) as Record<string, unknown>;
    this.tourismErr(raw, "declare");
    const first = (raw as { data?: Array<{ id: string; status?: string }> }).data?.[0];
    if (!first?.id) throw new Error("Порожня відповідь від сервера. Спробуйте іншу пропозицію.");
    return first;
  }

  async confirmTourismOrder(orderData: Record<string, unknown>): Promise<{ contractId: string; status?: string }> {
    const payload = { ...orderData, params: { type: "nextFinal", statusId: 2 } };
    const raw = await this.withAuth((token) => postJson(
      `${BASE_URL}/insurance/tourism/order/create`, payload, token
    )) as Record<string, unknown>;
    this.tourismErr(raw, "confirm");
    const first = (raw as { data?: Array<{ contract?: { id: string; status?: string } }> }).data?.[0];
    const contractId = first?.contract?.id;
    if (!contractId) throw new Error("Договір не сформувався. Зверніться до підтримки.");
    return { contractId, status: first?.contract?.status };
  }

  async takeTourismContract(contractId: string): Promise<{ contract?: string; mtsbuLink?: string; mtsbuCode?: string }> {
    const data = await this.withAuth((token) => postForm(
      `${BASE_URL}/insurance/tourism/contract/take`, { contractId }, token
    )) as { data: { contract?: string; mtsbuCode?: string } };
    return { contract: data.data?.contract, mtsbuCode: data.data?.mtsbuCode };
  }

  // Заявлення «Зелена карта» (POST greencard/order/create) → orderId. Далі —
  // спільні OTP та оплата по orderId (як в ОСЦПВ), потім contract/confirm.
  async createGreenCardOrder(orderData: Record<string, unknown>): Promise<{ id: string; status?: string; mtsbuLink?: string }> {
    // params ОБОВʼЯЗКОВИЙ (як у туристичному): без нього бекенд читає params['statusId']
    // з null і падає 500 "array offset on null" (OrderGreenCardRequest.php:283).
    // type:"declare" — ЛИШЕ заявити замовлення й отримати orderId (реальна видача —
    // пізніше через contract/confirm після оплати). type:"save" ТУТ помилковий: він
    // одразу запускає лістенер збереження транзакції договору (SaveTransactionContract),
    // а обʼєкта договору ще нема → 500 "Trying to get property 'discount_price' of
    // non-object" (перевірено на dev: save падає, declare/draft повертають id).
    // statusId:-1 = крок 1, чернетка (за схемою). type — обовʼязковий (без нього
    // "Undefined index: type"). isDP — прапорець модуля ТАС (без нього "Undefined index: isDP").
    const payload = { ...orderData, isDP: false, params: { type: "declare", statusId: -1 } };
    const raw = await this.withAuth((token) => postJson(
      `${BASE_URL}/insurance/greencard/order/create`,
      payload,
      token
    )) as Record<string, unknown>;
    const msg = raw.message as string | undefined;
    if (raw.status === "error" || raw.status === "validation" || (msg && msg.includes('"result":false'))) {
      const errText = JSON.stringify(raw.data ?? raw).slice(0, 300);
      console.error("[greencard order] rejected. raw:", JSON.stringify(raw).slice(0, 800));
      // Інфраструктурні збої модуля страховика на боці Ukasko (не валідація наших
      // даних): парсер відповіді падає PHP-нотісом. Напр. модуль UTICO у
      // TakeGreenCardContractResponse читає відсутній contractFile. Клієнту немає
      // сенсу показувати трейс — просимо обрати іншу пропозицію.
      const blob = `${msg ?? ""} ${errText}`;
      const insurerInfraError = /contractFile|discount_price|Undefined (index|offset)|ErrorException/i.test(blob);
      if (insurerInfraError) {
        throw new Error("На жаль, ця страхова компанія тимчасово недоступна для оформлення. Будь ласка, оберіть іншу пропозицію.");
      }
      throw new Error(`Страхова відхилила заявку: ${errText}`);
    }
    const data = raw as { data?: Array<{ id: string; status?: string; mtsbuLink?: string }> };
    const first = data.data?.[0];
    if (!first?.id) throw new Error("Порожня відповідь від сервера. Спробуйте іншу пропозицію.");
    return first;
  }

  // Оформлення (укладення) договору ЗК після оплати → contractId.
  async confirmGreenCard(orderId: string): Promise<{ contractId: string; status?: string }> {
    const data = await this.withAuth((token) => postJson(
      `${BASE_URL}/insurance/greencard/contract/confirm`,
      { orderId },
      token
    )) as { data: [{ contractId: string; status?: string }] };
    return data.data[0];
  }

  // Завантаження полісу ЗК.
  async downloadGreenCardContract(contractId: string): Promise<{ mtsbuLink?: string; contract?: string }> {
    const data = await this.withAuth((token) => postForm(
      `${BASE_URL}/insurance/greencard/contract/take`,
      { contractId },
      token
    )) as { data: { mtsbuLink?: string; contract?: string } };
    return data.data;
  }

  // ── Міні-КАСКО ────────────────────────────────────────────────────────────
  // Калькулятор: {start_date, city_id} → ГОЛИЙ масив груп по СК. Сплющуємо у
  // список офферів, додаючи дані компанії до кожного.
  async getMiniKaskoOffers(params: MiniKaskoParams): Promise<MiniKaskoOffer[]> {
    const raw = await withRetry(
      () => this.withAuth((t) => postJson(`${MINI_BASE}/calculate`, params, t)),
      3, 700, true
    ) as unknown;
    const groups = (Array.isArray(raw) ? raw : (raw as { data?: unknown[] })?.data ?? []) as Array<{
      company?: { id?: string; companyName?: string; publicName?: string; logo?: string | null };
      offers?: Array<{ offerId: number; title?: string | null; price: number; coverage: number }>;
    }>;
    const offers: MiniKaskoOffer[] = [];
    for (const g of groups) {
      const c = g.company ?? {};
      for (const o of g.offers ?? []) {
        if (!o?.offerId || !(o.price > 0)) continue;
        offers.push({
          offerId: o.offerId, price: o.price, coverage: o.coverage, title: o.title ?? null,
          companyId: String(c.id ?? ""), companyName: c.companyName ?? "",
          companyNamePublic: c.publicName ?? c.companyName ?? "", logo: c.logo ?? null,
        });
      }
    }
    return offers;
  }

  // Комбіноване замовлення (чернетка + заявлення страховику) → orderId (statusId 5).
  async createMiniKaskoOrder(orderData: Record<string, unknown>): Promise<{ id: string; statusId?: number; policyNumber?: string }> {
    const raw = await this.withAuth((t) => postJson(`${MINI_BASE}/orders`, orderData, t)) as Record<string, unknown>;
    if (raw.status === "error") {
      const msg = (raw.message as string) || JSON.stringify(raw).slice(0, 300);
      console.error("[minikasko order] rejected. raw:", JSON.stringify(raw).slice(0, 800));
      // Транзієнт на боці Ukasko/страховика: не достукались до API страховика
      // (ECONNRESET / Unable to connect) або PHP-нотіс парсера — дружнє повідомлення.
      if (/ECONNRESET|ECONNREFUSED|ETIMEDOUT|Unable to connect|socket hang up|timeout|Undefined (index|offset)|ErrorException|discount_price|contractFile/i.test(msg)) {
        throw new Error("Страхова тимчасово недоступна. Спробуйте ще раз за хвилину або оберіть іншу пропозицію.");
      }
      throw new Error(msg);
    }
    const id = raw.id as string | undefined;
    if (!id) throw new Error("Порожня відповідь від сервера. Спробуйте іншу пропозицію.");
    return { id, statusId: raw.statusId as number | undefined, policyNumber: raw.policyNumber as string | undefined };
  }

  // OTP підпису поліса (власний флоу міні-КАСКО, не спільний платіжний).
  async sendMiniKaskoOtp(orderId: string, channel: "email" | "viber_sms" = "email"): Promise<void> {
    await this.withAuth((t) => postJson(`${MINI_BASE}/orders/${orderId}/send-otp`, { channel }, t));
  }

  async verifyMiniKaskoOtp(orderId: string, otp: string): Promise<boolean> {
    try {
      const raw = await this.withAuth((t) => postJson(`${MINI_BASE}/orders/${orderId}/verify-otp`, { otp }, t)) as Record<string, unknown>;
      return raw.status === "success";
    } catch {
      return false; // невірний OTP → 422
    }
  }

  // Фінальне підтвердження договору (потребує заявлення + оплату + підтверджений OTP).
  async confirmMiniKasko(orderId: string, otp?: string): Promise<{ contractId: string; statusId?: number }> {
    const raw = await this.withAuth((t) => postJson(`${MINI_BASE}/orders/${orderId}/confirm`, otp ? { otp } : {}, t)) as Record<string, unknown>;
    if (raw.status === "error") throw new Error((raw.message as string) || "Не вдалося підтвердити договір");
    return { contractId: (raw.id as string) ?? orderId, statusId: raw.statusId as number | undefined };
  }

  // Бінарний PDF поліса (неавторизований ендпоінт — за orderId). Повертаємо байти.
  async downloadMiniKaskoPdf(orderId: string, draft = false): Promise<{ buffer: ArrayBuffer; contentType: string }> {
    const url = `${MINI_BASE}/orders/${orderId}/${draft ? "download-draft" : "download"}`;
    const res = await fetch(url, { headers: { "user-agent": UA }, redirect: "follow", cache: "no-store" });
    if (!res.ok) throw new HttpError(res.status, `[GET ${url}] ${res.status}`);
    const contentType = res.headers.get("content-type") || "application/pdf";
    return { buffer: await res.arrayBuffer(), contentType };
  }

  // ── Страхування житла (Home) ──────────────────────────────────────────────
  // Доступні значення комісії агента (earnings). Порожньо, якщо продукт не активний.
  async getHomeTariffs(): Promise<number[]> {
    try {
      const raw = await this.withAuth((t) => getJson(`${HOME_BASE}/tariffs`, t)) as { data?: Array<{ value: number }> };
      return Array.isArray(raw?.data) ? raw.data.map((x) => Number(x.value)).filter((n) => Number.isFinite(n)) : [];
    } catch {
      return [];
    }
  }

  async getHomeOffers(params: HomeParams): Promise<HomeOffer[]> {
    const raw = await withRetry(
      () => this.withAuth((t) => postJson(`${HOME_BASE}/calculator`, params, t)),
      3, 700, true
    ) as { data?: HomeOffer[] };
    const list = Array.isArray(raw?.data) ? raw.data : [];
    return list.filter((o) => o?.offerId && o.price > 0);
  }

  // Внутрішні баги модуля страховика (ІНГО для житла: getCommission / 'module' of
  // non-object / порожня відповідь тощо) — усе це помилки НА БОЦІ Ukasko, які ми не
  // можемо виправити з клієнта. Показуємо одне чесне повідомлення.
  private static readonly HOME_INSURER_BUG =
    /ECONNRESET|Unable to connect|timeout|Undefined (index|offset)|ErrorException|discount_price|contractFile|getCommission|must be of the type|Argument \d+ passed to|of non-object|Trying to get property|'module'/i;

  // Один виклик order/create → розпарсений {id,status}. Класифікує серверні баги
  // модуля страховика (HttpError 500 / status:error / 200-без-id) у дружнє повідомлення.
  private async postHomeOrder(payload: Record<string, unknown>): Promise<{ id: string; status?: string }> {
    const FRIENDLY =
      "На жаль, оформлення поліса житла зараз тимчасово недоступне з боку страхової компанії. Ми вже розбираємось — спробуйте, будь ласка, трохи згодом.";
    let raw: Record<string, unknown>;
    try {
      raw = await this.withAuth((t) => postJson(`${HOME_BASE}/order/create`, payload, t)) as Record<string, unknown>;
    } catch (e) {
      // Ukasko віддає HTTP 500 з PHP-виключенням при внутрішніх багах модуля —
      // postJson кидає HttpError ще до парсингу. Ловимо й показуємо дружнє.
      const body = e instanceof Error ? e.message : String(e);
      console.error("[home order] http error:", body.slice(0, 800));
      if (UkaskoService.HOME_INSURER_BUG.test(body)) throw new Error(FRIENDLY);
      throw e;
    }
    const status = raw.status as string | undefined;
    const msg = raw.message as string | undefined;
    if (status === "error" || status === "validation" || (msg && msg.includes('"result":false'))) {
      const errText = JSON.stringify(raw.data ?? raw).slice(0, 400);
      console.error("[home order] rejected. raw:", JSON.stringify(raw).slice(0, 800));
      if (UkaskoService.HOME_INSURER_BUG.test(`${msg ?? ""} ${errText}`)) throw new Error(FRIENDLY);
      throw new Error(`Страхова відхилила заявку: ${errText}`);
    }
    const first = (raw as { data?: Array<{ id: string; status?: string }> }).data?.[0];
    if (!first?.id) {
      // 200-успіх, але data порожня. Часто це ЗМІСТОВНА валідація страховика в message
      // (напр. дата початку) — показуємо її клієнту, а не загальне «тимчасово недоступне».
      console.error("[home order] empty data. raw:", JSON.stringify(raw).slice(0, 800));
      const m = typeof msg === "string" ? msg.trim() : "";
      if (m && !/^(ok|success)$/i.test(m) && !UkaskoService.HOME_INSURER_BUG.test(m)) {
        // Спец-кейс: дата початку надто рання (ІНГО вимагає ≥ +9 днів).
        if (/start\s*from|дат[аиуіа].*(не раніше|раніше)|не раніше \d{4}-\d{2}-\d{2}/i.test(m)) {
          const iso = m.match(/(\d{4})-(\d{2})-(\d{2})/);
          const human = iso ? `${iso[3]}.${iso[2]}.${iso[1]}` : null;
          throw new Error(human
            ? `Оберіть пізнішу дату початку — ця страхова приймає поліси з датою не раніше ${human}.`
            : "Оберіть пізнішу дату початку — обрана дата надто рання для цієї страхової.");
        }
        throw new Error(m); // інша змістовна валідація — показуємо як є
      }
      throw new Error(FRIENDLY);
    }
    return first;
  }

  // Створення замовлення житла — ДВОКРОКОВЕ (ІНГО падає на одноетапному declare):
  //   1) чернетка (params.statusId=-1, orderId=null) → orderId;
  //   2) повне замовлення (params.statusId=null) з цим orderId → status "declared".
  // Далі спільні OTP/оплата, потім confirm.
  async createHomeOrder(orderData: Record<string, unknown>): Promise<{ id: string; status?: string }> {
    const params = (orderData.params as Record<string, unknown> | undefined) ?? {};
    const draft = await this.postHomeOrder({ ...orderData, params: { ...params, statusId: -1 }, orderId: null });
    const full = await this.postHomeOrder({ ...orderData, params: { ...params, statusId: null }, orderId: draft.id });
    return full;
  }

  async confirmHome(orderId: string): Promise<{ contractId: string; status?: string }> {
    const data = await this.withAuth((t) => postJson(`${HOME_BASE}/contract/confirm`, { orderId }, t)) as { data: [{ contractId: string; status?: string }] };
    return data.data[0];
  }

  // Файли поліса — прямі URL (не base64). Якщо contract === null — ще генерується.
  async takeHomeContract(contractId: string): Promise<{ contract?: string | null; contractDraft_path?: string | null }> {
    const data = await this.withAuth((t) => postJson(`${HOME_BASE}/contract/take`, { contractId }, t)) as { data: { contract?: string | null; contractDraft_path?: string | null } };
    return data.data;
  }

  // Довідник міст ЖИТЛА (окремий від загального).
  async findHomeCities(q: string): Promise<Array<{ id: number; name: string; name_full_name_ua?: string }>> {
    const raw = await this.withAuth((t) => getJson(`${AUTH_URL}/directories/home/cities/find?city=${encodeURIComponent(q)}`, t)) as { data?: Array<{ id: number; name: string; name_full_name_ua?: string }> };
    return Array.isArray(raw?.data) ? raw.data : [];
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
    let raw: Record<string, unknown>;
    try {
      raw = await this.withAuth((token) => postJson(
        `${BASE_URL}/insurance/order/osago`,
        payload,
        token
      )) as Record<string, unknown>;
    } catch (e) {
      // Деякі модулі страхових (напр. ІНТЕР-ПОЛІС) при невалідних даних падають
      // 500-кою з PHP-помилкою ("Undefined offset", "Server Error") замість чистої
      // валідації. Показуємо дружнє повідомлення замість технічного сміття.
      const m = e instanceof Error ? e.message : String(e);
      if (/undefined offset|server error|undefined (index|array key)/i.test(m)) {
        throw new Error("Ця страхова компанія тимчасово недоступна для оформлення. Будь ласка, оберіть іншу пропозицію.");
      }
      throw e;
    }

    // Ukasko може повернути помилку валідації в кількох формах: status:"error",
    // message з "result":false, або просто текст повідомлення. Розбираємо всі.
    const status = raw.status as string | undefined;
    const msg = raw.message as string | undefined;

    // Витягує людський текст помилки з довільної структури Ukasko-відповіді.
    const extractError = (source: string): string | null => {
      try {
        const p = JSON.parse(source) as Record<string, unknown>;
        const errorsObj = p.errors as Record<string, unknown> | undefined;
        const fromErrors = errorsObj
          ? Object.values(errorsObj).flat().map(String).join("; ")
          : "";
        const candidate =
          (p.error as string) || (p.message as string) || (p.msg as string) ||
          (p.text as string) || fromErrors || "";
        return candidate.trim() || null;
      } catch {
        return null;
      }
    };

    if ((msg && msg.includes('"result":false')) || status === "error") {
      const rawText = msg ?? JSON.stringify(raw);
      // Логуємо СИРУ відповідь — щоб бачити реальну причину відмови в Cloud Logging.
      console.error("[ukasko declare] rejected. raw:", rawText.slice(0, 800));
      if (/undefined offset|server error/i.test(rawText)) {
        throw new Error("Ця страхова компанія тимчасово недоступна для оформлення. Будь ласка, оберіть іншу пропозицію.");
      }
      const clean = extractError(rawText) || (msg && !msg.startsWith("{") ? msg : null);
      throw new Error(clean || `Страхова відхилила заявку: ${rawText.slice(0, 200)}`);
    }

    const data = raw as { data: [{ id: string; status: string; mtsbuLink?: string }] };
    if (!data.data?.[0]) {
      console.error("[ukasko declare] empty data. raw:", JSON.stringify(raw).slice(0, 800));
      throw new Error("Порожня відповідь від сервера. Спробуйте іншу пропозицію.");
    }
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
    // Ukasko: метод для get-invoice — POST. Обовʼязковий параметр paidBy визначає,
    // хто платить комісію еквайрингу: "client" (клієнт) або "agent" (агент).
    // У нас комісію платить клієнт. GET лишаємо як запасні спроби.
    const paidBy = "client";
    const qs = `result_url=${encodeURIComponent(resultUrl)}&paidBy=${paidBy}`;
    const attempts = [
      { method: "POST" as const, url: `${AUTH_URL}/orders/${orderId}/get-invoice` },
      { method: "POST" as const, url: `${BASE_URL}/orders/${orderId}/get-invoice` },
      { method: "GET" as const, url: `${AUTH_URL}/orders/${orderId}/get-invoice?${qs}` },
      { method: "GET" as const, url: `${BASE_URL}/orders/${orderId}/get-invoice?${qs}` },
    ];

    return this.withAuth(async (token) => {
      for (const { method, url } of attempts) {
        try {
          const raw = method === "GET"
            ? await getJson(url, token) as Record<string, unknown>
            : await postForm(url, { result_url: resultUrl, paidBy }, token) as Record<string, unknown>;

          const d = (raw.data ?? raw) as Record<string, unknown>;
          if (d.invoiceLink) {
            return d as unknown as { invoiceLink: string; qrCode: string };
          }
          // Ендпоінт відповів, але без invoiceLink — логуємо, що саме прийшло,
          // щоб зрозуміти, чому на проді не генерується рахунок LiqPay.
          console.error(`[ukasko get-invoice] ${method} ${url} — no invoiceLink. raw:`, JSON.stringify(raw).slice(0, 500));
        } catch (e) {
          // Протухлий токен пробрасуємо нагору — withAuth перевипустить і повторить.
          if (e instanceof HttpError && e.status === 401) throw e;
          console.error(`[ukasko get-invoice] ${method} ${url} — error:`, e instanceof Error ? e.message.slice(0, 300) : String(e));
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

  async checkInvoice(orderId: string): Promise<{ status_id: number; payed_at: string | null }> {
    // Статус оплати. Різні продукти Ukasko віддають його по-різному, а старий
    // виклик `/payments/{orderId}/check-invoice` на проді падає 500 (orderId у шляху —
    // некоректно). Тож пробуємо кілька коректних варіантів: GET /orders/{id}/get-invoice
    // (уже перевірений — його ж юзає getOrderInfo) + /payments/check-invoice?invoice=.
    // Статус читаємо з кількох можливих полів. НІКОЛИ не кидаємо — щоб опитування
    // тривало (інакше 500 → «обробляється» назавжди). Логуємо сиру відповідь.
    const urls = [
      `${AUTH_URL}/orders/${orderId}/get-invoice`,
      `${BASE_URL}/orders/${orderId}/get-invoice`,
      `${AUTH_URL}/payments/check-invoice?invoice=${encodeURIComponent(orderId)}`,
      `${BASE_URL}/payments/check-invoice?invoice=${encodeURIComponent(orderId)}`,
      `${AUTH_URL}/payments/${orderId}/check-invoice`,
    ];
    return this.withAuth(async (token) => {
      for (const url of urls) {
        try {
          const raw = await getJson(url, token) as Record<string, unknown>;
          const d = (raw.data ?? raw) as Record<string, unknown>;
          const inv = (d.invoice ?? d) as Record<string, unknown>;
          const statusId = Number(inv.status_id ?? d.status_id ?? 0) || 0;
          const payedAt = (inv.payed_at ?? d.payed_at ?? null) as string | null;
          console.error(`[ukasko check-invoice] ${url} → status_id=${statusId} payed_at=${payedAt} raw=${JSON.stringify(raw).slice(0, 300)}`);
          // Знайшли підтвердження оплати — повертаємо одразу.
          if (statusId === 2 || payedAt) return { status_id: 2, payed_at: payedAt };
        } catch (e) {
          if (e instanceof HttpError && e.status === 401) throw e; // токен протух — withAuth перевипустить
          console.error(`[ukasko check-invoice] ${url} — error:`, e instanceof Error ? e.message.slice(0, 200) : String(e));
        }
      }
      // Ніде не побачили оплату — вважаємо «ще не оплачено» (клієнт опитає ще раз).
      return { status_id: 0, payed_at: null };
    });
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
