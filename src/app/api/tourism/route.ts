import { NextRequest, NextResponse } from "next/server";
import { guardRequest } from "@/lib/api-guard";
import { ukaskoService } from "@/services/ukasko";
import { notifyDevError } from "@/lib/telegram";
import { getCachedOffers, setCachedOffers } from "@/lib/offer-cache";
import type { TourismParams, TourismOffer } from "@/types/api";

// Калькулятор туристичного страхування: параметри подорожі → реальні пропозиції.
//
// Калькулятор Ukasko рахує всіх страховиків і буває ДУЖЕ повільним (20–34с на
// «холодний» виклик). Кешуємо успішні результати за точними параметрами на двох
// рівнях: (1) in-memory — миттєвий, але лише в межах одного інстансу; (2) спільний
// у Postgres — щоб важка калькуляція платилася РАЗ глобально, а всі інстанси й
// користувачі отримували результат миттєво (повтор, уточнення дат, «назад»,
// популярні напрямки в інших). Перший унікальний запит усе одно платить ~34с — це
// стеля самого Ukasko.
const TOURISM_MEM_TTL_MS = 5 * 60 * 1000;       // памʼять інстансу
const TOURISM_DB_TTL_MS = 15 * 60 * 1000;       // спільний кеш (довший — ціни стабільні в межах хвилин)
const tourismCache = new Map<string, { offers: unknown[]; expires: number }>();

export async function POST(req: NextRequest) {
  const blocked = guardRequest(req, { name: "tourism", limit: 30, windowMs: 10 * 60 * 1000 });
  if (blocked) return blocked;

  let params: TourismParams;
  try {
    const body = await req.json();
    params = {
      birthDates: Array.isArray(body?.birthDates) ? body.birthDates.map(String) : [],
      country: { id: Number(body?.country?.id), name: String(body?.country?.name ?? "") },
      date: String(body?.date ?? ""),      // d.m.Y
      days: Number(body?.days),
      multiVisa: !!body?.multiVisa,
      tourists: Number(body?.tourists),
    };
  } catch {
    return NextResponse.json({ success: false, error: "Некоректний запит" }, { status: 400 });
  }

  if (!params.country.id || !params.days || !params.tourists || !params.birthDates.length || !/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(params.date)) {
    return NextResponse.json({ success: false, error: "Заповніть усі поля" }, { status: 400 });
  }

  // Ключ кешу — нормалізовані параметри (дати народження сортуємо, щоб порядок
  // туристів не плодив різні ключі на однаковий кошик).
  const cacheKey = JSON.stringify({
    c: params.country.id, d: params.date, days: params.days,
    m: params.multiVisa, t: params.tourists, b: [...params.birthDates].sort(),
  });
  const now = Date.now();
  const memHit = tourismCache.get(cacheKey);
  if (memHit && memHit.expires > now) {
    return NextResponse.json({ success: true, offers: memHit.offers, cached: "mem" });
  }

  // Спільний кеш у Postgres — важка калькуляція платиться раз глобально.
  const dbKey = `tourism:${cacheKey}`;
  const dbHit = await getCachedOffers<TourismOffer>(dbKey);
  if (dbHit && dbHit.length > 0) {
    // Прогріваємо памʼять цього інстансу, щоб наступні його запити були миттєві.
    tourismCache.set(cacheKey, { offers: dbHit, expires: now + TOURISM_MEM_TTL_MS });
    return NextResponse.json({ success: true, offers: dbHit, cached: "db" });
  }

  try {
    const offers = await ukaskoService.getTourismOffers(params);
    // Кешуємо лише НЕпорожній результат — щоб транзієнтна порожня видача не
    // «застрягла» в кеші й не блокувала повторні спроби. Пишемо в обидва рівні.
    if (Array.isArray(offers) && offers.length > 0) {
      tourismCache.set(cacheKey, { offers, expires: now + TOURISM_MEM_TTL_MS });
      if (tourismCache.size > 200) {
        for (const [k, v] of tourismCache) if (v.expires <= now) tourismCache.delete(k);
      }
      // Спільний кеш — best-effort, не блокує відповідь навіть якщо БД лягла.
      void setCachedOffers(dbKey, offers, TOURISM_DB_TTL_MS);
    }
    return NextResponse.json({ success: true, offers });
  } catch (e) {
    console.error("[tourism] calc error:", e instanceof Error ? e.message : e);
    await notifyDevError("tourism calculator", e);
    return NextResponse.json({ success: false, error: "Не вдалося отримати пропозиції. Спробуйте пізніше." }, { status: 500 });
  }
}
