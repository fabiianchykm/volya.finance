import { NextRequest, NextResponse } from "next/server";
import { guardRequest } from "@/lib/api-guard";
import { ukaskoService } from "@/services/ukasko";
import { notifyDevError } from "@/lib/telegram";
import type { TourismParams } from "@/types/api";

// Калькулятор туристичного страхування: параметри подорожі → реальні пропозиції.
//
// Калькулятор Ukasko рахує всіх страховиків і буває ДУЖЕ повільним (20–34с на
// «холодний» виклик). Тож кешуємо успішні результати за точними параметрами на
// кілька хвилин: повтор пошуку, уточнення й кнопка «назад» віддаються миттєво.
const TOURISM_CACHE_TTL_MS = 5 * 60 * 1000;
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
  const hit = tourismCache.get(cacheKey);
  if (hit && hit.expires > now) {
    return NextResponse.json({ success: true, offers: hit.offers, cached: true });
  }

  try {
    const offers = await ukaskoService.getTourismOffers(params);
    // Кешуємо лише НЕпорожній результат — щоб транзієнтна порожня видача не
    // «застрягла» в кеші й не блокувала повторні спроби.
    if (Array.isArray(offers) && offers.length > 0) {
      tourismCache.set(cacheKey, { offers, expires: now + TOURISM_CACHE_TTL_MS });
      if (tourismCache.size > 200) {
        for (const [k, v] of tourismCache) if (v.expires <= now) tourismCache.delete(k);
      }
    }
    return NextResponse.json({ success: true, offers });
  } catch (e) {
    console.error("[tourism] calc error:", e instanceof Error ? e.message : e);
    await notifyDevError("tourism calculator", e);
    return NextResponse.json({ success: false, error: "Не вдалося отримати пропозиції. Спробуйте пізніше." }, { status: 500 });
  }
}
