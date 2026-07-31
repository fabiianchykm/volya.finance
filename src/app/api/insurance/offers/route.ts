import { NextRequest, NextResponse } from "next/server";
import { ukaskoService } from "@/services/ukasko";
import { guardRequest } from "@/lib/api-guard";
import type { CalculatorParams } from "@/types/api";

// Калькулятор Ukasko рахує 18+ страхових ~7с. Кешуємо успішні результати по
// точних параметрах на кілька хвилин: повернення назад, TTL-переоновлення та
// поширені комбінації (у різних клієнтів) віддаються миттєво. Ціна на checkout
// усе одно перевіряється наново, тож короткий кеш безпечний.
const OFFERS_CACHE_TTL_MS = 3 * 60 * 1000;
const offersCache = new Map<string, { data: unknown; expires: number }>();

export async function GET(req: NextRequest) {
  try {
    const blocked = guardRequest(req, { name: "offers", limit: 30, windowMs: 10 * 60 * 1000 });
    if (blocked) return blocked;

    const { searchParams } = new URL(req.url);

    const params: CalculatorParams = {
      autoCategoryType: searchParams.get("autoCategoryType") ?? "B1",
      isTaxi: 0,
      franchise: 0,
      isEuroCar: 0,
      customerType: Number(searchParams.get("customerType") ?? 1),
      registrationPlaceId: Number(searchParams.get("registrationPlaceId") ?? 1),
      zone: Number(searchParams.get("zone") ?? 1),
      withoutOtk: 1,
      startDate: searchParams.get("startDate") ?? new Date().toISOString().slice(0, 10).split("-").reverse().join("."),
      customerPrivilege: Number(searchParams.get("customerPrivilege") ?? 1),
      registrationType: Number(searchParams.get("registrationType") ?? 1),
      period_id: Number(searchParams.get("period_id") ?? 12),
      "car[year]": Number(searchParams.get("carYear") ?? 2015),
      "customer[dateBirth]": searchParams.get("carBirthdayAt") ?? "01.01.1990",
      "car[birthdayAt]": searchParams.get("carBirthdayAt") ?? "01.01.1990",
    };

    const cacheKey = JSON.stringify(params);
    const now = Date.now();
    const hit = offersCache.get(cacheKey);
    if (hit && hit.expires > now) {
      return NextResponse.json({ success: true, data: hit.data, cached: true });
    }

    const data = await ukaskoService.getOffers(params);
    offersCache.set(cacheKey, { data, expires: now + OFFERS_CACHE_TTL_MS });
    // Періодичне прибирання протухлих записів, щоб мапа не росла безмежно.
    if (offersCache.size > 200) {
      for (const [k, v] of offersCache) if (v.expires <= now) offersCache.delete(k);
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const raw = error instanceof Error ? error.message : "Unknown error";
    console.error("[offers/route] error →", raw);
    // 502/503/504 від Ukasko/Cloudflare — тимчасове перевантаження. Віддаємо
    // зрозуміле повідомлення замість сирого HTML/JSON помилки.
    const transient = /\b50[234]\b|gateway time-?out|timeout/i.test(raw);
    const message = transient
      ? "Сервіс страхових тимчасово перевантажений. Спробуйте ще раз за хвилину."
      : "Не вдалося завантажити пропозиції. Спробуйте ще раз.";
    return NextResponse.json({ success: false, error: message }, { status: transient ? 503 : 500 });
  }
}
