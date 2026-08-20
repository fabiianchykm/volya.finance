import { NextRequest, NextResponse } from "next/server";
import { ukaskoService } from "@/services/ukasko";
import { guardRequest } from "@/lib/api-guard";
import { osagoDobForBasis } from "@/lib/osago-age-basis";
import { OSAGO_MODULE_BASIS } from "@/lib/osago-modules";
import type { CalculatorParams, InsuranceOffer } from "@/types/api";

// Калькулятор Ukasko рахує 18+ страхових ~7с. Кешуємо успішні результати по
// точних параметрах на кілька хвилин: повернення назад, TTL-переоновлення та
// поширені комбінації (у різних клієнтів) віддаються миттєво. Ціна на checkout
// усе одно перевіряється наново, тож короткий кеш безпечний.
const OFFERS_CACHE_TTL_MS = 3 * 60 * 1000;
const offersCache = new Map<string, { data: unknown; expires: number }>();

const DEFAULT_DOB = "01.01.1990";
const validDob = (v: string | null): string =>
  v && /^\d{1,2}\.\d{1,2}\.\d{4}$/.test(v) ? v : "";

const offerCount = (d: unknown) => {
  const arr = (d as { data?: unknown })?.data;
  return Array.isArray(arr) ? arr.length : 0;
};

// Один розрахунок під конкретну ДН (з однією повторною спробою на порожню видачу —
// інтермітентний збій Ukasko, коли один страховик валить усю видачу).
async function offersForDob(base: CalculatorParams, dob: string) {
  const params: CalculatorParams = { ...base, "car[birthdayAt]": dob, "customer[dateBirth]": dob };
  let data = await ukaskoService.getOffers(params);
  if (offerCount(data) === 0) {
    const retry = await ukaskoService.getOffers(params);
    if (offerCount(retry) > 0) data = retry;
  }
  return data;
}

// Розрахунок ОДНІЄЇ СК (moduleId) під конкретну ДН — легкий (~2-4с) і паралелиться.
async function offersForModule(base: CalculatorParams, moduleId: number, dob: string): Promise<InsuranceOffer[]> {
  const params: CalculatorParams = { ...base, moduleId, "car[birthdayAt]": dob, "customer[dateBirth]": dob };
  const data = await ukaskoService.getOffers(params);
  const arr = (data as { data?: InsuranceOffer[] })?.data;
  return Array.isArray(arr) ? arr : [];
}

export async function GET(req: NextRequest) {
  try {
    const blocked = guardRequest(req, { name: "offers", limit: 30, windowMs: 10 * 60 * 1000 });
    if (blocked) return blocked;

    const { searchParams } = new URL(req.url);

    // Три дати народження, за якими різні СК рахують ціну (див. osago-age-basis):
    //  owner       — власника авто (з реєстру за номером)
    //  policyholder — страхувальника (вводить клієнт)
    //  youngest     — наймолодшого водія (вводить клієнт; за нього ж рахуємо «водія»)
    // Кожну СК прораховуємо за ЇЇ основою → точна ціна по кожній компанії.
    const ownerDob = validDob(searchParams.get("carBirthdayAt"));
    const policyholderDob = validDob(searchParams.get("policyholderBirthday"));
    const youngestDob = validDob(searchParams.get("youngestBirthday"));
    const dobs = { owner: ownerDob, policyholder: policyholderDob, youngest: youngestDob };

    const base: CalculatorParams = {
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
    };

    // nocache=1 — обхід кешу (напр. перед оформленням: потрібен СВІЖИЙ offerId, бо
    // застарілий Ukasko відхиляє з 422 «offer id не коректне»).
    const noCache = searchParams.get("nocache") === "1";
    const cacheKey = JSON.stringify({ base, dobs });
    const now = Date.now();
    const hit = offersCache.get(cacheKey);
    if (!noCache && hit && hit.expires > now) {
      return NextResponse.json({ success: true, data: hit.data, cached: true });
    }

    // ПО-МОДУЛЬНО: кожну СК тягнемо окремим легким запитом (moduleId) з ДН за ЇЇ
    // основою — усі паралельно. Швидше й надійніше за повний батч; падіння однієї
    // СК не валить решту (allSettled). Так само отримуємо точну ціну по кожній СК
    // за один прохід.
    const perModule = await Promise.allSettled(
      OSAGO_MODULE_BASIS.map(({ moduleId, basis }) =>
        offersForModule(base, moduleId, osagoDobForBasis(basis, dobs) || DEFAULT_DOB)
      )
    );

    const seen = new Set<string>();
    const merged: InsuranceOffer[] = [];
    for (const r of perModule) {
      if (r.status !== "fulfilled") continue;
      for (const o of r.value) {
        if (o?.companyId && !seen.has(o.companyId)) { seen.add(o.companyId); merged.push(o); }
      }
    }

    // Фолбек: якщо по-модульно нічого не прийшло (напр. Ukasko змінив набір модулів
    // або тимчасовий збій) — повний батч за страхувальником, щоб не показати порожньо.
    if (merged.length === 0) {
      const fb = await offersForDob(base, dobs.policyholder || dobs.owner || dobs.youngest || DEFAULT_DOB);
      const arr = (fb as { data?: InsuranceOffer[] })?.data;
      if (Array.isArray(arr)) for (const o of arr) if (o?.companyId && !seen.has(o.companyId)) { seen.add(o.companyId); merged.push(o); }
    }

    const data = { status: "success", message: "", data: merged, errorInfo: [] };

    // Кешуємо ЛИШЕ непорожній результат — щоб порожня видача під час збою не
    // «застрягала» в кеші на 3 хв і не блокувала повторні спроби.
    if (merged.length > 0) {
      offersCache.set(cacheKey, { data, expires: now + OFFERS_CACHE_TTL_MS });
      if (offersCache.size > 200) {
        for (const [k, v] of offersCache) if (v.expires <= now) offersCache.delete(k);
      }
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
