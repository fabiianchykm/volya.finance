import { NextRequest, NextResponse } from "next/server";
import { ukaskoService, UkaskoValidationError } from "@/services/ukasko";
import { guardRequest } from "@/lib/api-guard";
import { normalizePlate } from "@/lib/plate";
import { toInsuranceOffer } from "@/lib/osago-v2";
import type { OsagoV2CalcParams } from "@/types/api";

// Калькулятор ОСЦПВ — Ukasko API v2 (/v2/insurance/oscpv/calculate). Зона виводиться
// сервером з міста реєстрації (cityId), усі три дати народження передаються разом
// (кожна СК бере свою — ageSemantic у пропозиції), держномер обов'язковий.
// Калькулятор рахує 14+ страхових ~5–10с. Кешуємо успішні результати по точних
// параметрах на кілька хвилин: повернення назад, TTL-переоновлення та поширені
// комбінації віддаються миттєво. Ціна на checkout усе одно перевіряється наново.
const OFFERS_CACHE_TTL_MS = 3 * 60 * 1000;
const offersCache = new Map<string, { data: unknown; expires: number }>();

const AUTO_CATEGORIES = new Set(["A1", "A2", "B1", "B2", "B3", "B4", "B5", "C0", "C1", "C2", "D1", "D2", "E", "F"]);

const validDob = (v: string | null): string | undefined =>
  v && /^\d{1,2}\.\d{1,2}\.\d{4}$/.test(v) ? v : undefined;

const tomorrowUa = (): string => {
  const d = new Date(); d.setDate(d.getDate() + 1);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
};

export async function GET(req: NextRequest) {
  try {
    const blocked = guardRequest(req, { name: "offers", limit: 30, windowMs: 10 * 60 * 1000 });
    if (blocked) return blocked;

    const sp = new URL(req.url).searchParams;

    const autoCategoryType = (sp.get("autoCategoryType") ?? "B1").toUpperCase();
    if (!AUTO_CATEGORIES.has(autoCategoryType)) {
      return NextResponse.json({ success: false, error: "Невідома категорія транспортного засобу." }, { status: 400 });
    }
    // Місто реєстрації — обов'язкове: з нього Ukasko виводить зону тарифу.
    const cityId = Number(sp.get("cityId") ?? sp.get("registrationPlaceId") ?? 0);
    if (!Number.isInteger(cityId) || cityId <= 0) {
      return NextResponse.json({ success: false, error: "Оберіть місто реєстрації авто." }, { status: 400 });
    }
    // Держномер — з 2026 обов'язковий (окремі СК без нього не рахують).
    const carNumber = normalizePlate(sp.get("carNumber") ?? "");
    if (carNumber.length < 4 || carNumber.length > 20) {
      return NextResponse.json({ success: false, error: "Вкажіть державний номер авто." }, { status: 400 });
    }
    const periodId = Number(sp.get("period_id") ?? sp.get("periodId") ?? 12) === 6 ? 6 : 12;
    const privilege = Number(sp.get("customerPrivilege") ?? 1);
    const privilegeType = Number.isInteger(privilege) && privilege >= 1 && privilege <= 10 ? privilege : 1;
    const startDate = validDob(sp.get("startDate")) ?? tomorrowUa();
    const carYear = Number(sp.get("carYear"));
    const carBrand = (sp.get("carBrand") ?? "").trim().slice(0, 100);
    const ipn = (sp.get("identificationCode") ?? "").replace(/\D/g, "");

    // Три дати народження, за якими різні СК рахують ціну (ageSemantic пропозиції):
    //  owner — власника авто (з реєстру за номером, лише рік), policyholder —
    //  страхувальника (вводить на checkout), youngest — наймолодшого водія.
    const ownerDob = validDob(sp.get("ownerBirthday") ?? sp.get("carBirthdayAt"));
    const policyholderDob = validDob(sp.get("policyholderBirthday"));
    const youngestDob = validDob(sp.get("youngestBirthday"));

    const params: OsagoV2CalcParams = {
      autoCategoryType,
      cityId,
      userType: 1,
      privilegeType,
      startDate,
      periodId,
      registrationType: 1,
      carNumber,
      ...(carBrand ? { carBrand } : {}),
      ...(Number.isInteger(carYear) && carYear > 1900 ? { carYear } : {}),
      ...(youngestDob ? { driverBirthDate: youngestDob } : {}),
      ...(policyholderDob ? { insurerBirthDate: policyholderDob } : {}),
      ...(ownerDob ? { ownerBirthDate: ownerDob } : {}),
      // РНОКПП — персональний тариф окремих СК (ARX, Інтер-Поліс); передається з
      // checkout при перевірці ціни, у списку його ще немає.
      ...(ipn.length === 10 ? { identificationCode: ipn } : {}),
    };

    // nocache=1 — обхід кешу (перед оформленням: потрібен СВІЖИЙ offerId і ціна під
    // реальні дані страхувальника).
    const noCache = sp.get("nocache") === "1";
    const cacheKey = JSON.stringify(params);
    const now = Date.now();
    const hit = offersCache.get(cacheKey);
    if (!noCache && hit && hit.expires > now) {
      return NextResponse.json({ success: true, data: hit.data, cached: true });
    }

    // Одна повна калькуляція (з одним повтором на порожню видачу — інтермітентний збій,
    // коли один модуль СК валить усю видачу).
    let { offers, errorInfo } = await ukaskoService.getOsagoOffersV2(params);
    if (offers.length === 0) {
      const retry = await ukaskoService.getOsagoOffersV2(params);
      if (retry.offers.length > 0) ({ offers, errorInfo } = retry);
    }
    if (errorInfo.length > 0) {
      console.error(`[offers v2] errorInfo (${errorInfo.length} СК не порахували):`, JSON.stringify(errorInfo).slice(0, 600));
    }

    const data = { status: "success", message: "", data: offers.map(toInsuranceOffer), errorInfo: [] };

    // Кешуємо ЛИШЕ непорожній результат — щоб порожня видача під час збою не
    // «застрягала» в кеші на 3 хв і не блокувала повторні спроби.
    if (offers.length > 0) {
      offersCache.set(cacheKey, { data, expires: now + OFFERS_CACHE_TTL_MS });
      if (offersCache.size > 200) {
        for (const [k, v] of offersCache) if (v.expires <= now) offersCache.delete(k);
      }
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const raw = error instanceof Error ? error.message : "Unknown error";
    console.error("[offers/route] error →", raw.slice(0, 600));
    // 422 — валідація Ukasko (дата, категорія, місто без зони…): показуємо її текст.
    if (error instanceof UkaskoValidationError) {
      return NextResponse.json({ success: false, error: error.message || "Невірні параметри розрахунку." }, { status: 400 });
    }
    // 502/503/504 від Ukasko/Cloudflare — тимчасове перевантаження.
    const transient = /\b50[234]\b|gateway time-?out|timeout/i.test(raw);
    const message = transient
      ? "Сервіс страхових тимчасово перевантажений. Спробуйте ще раз за хвилину."
      : "Не вдалося завантажити пропозиції. Спробуйте ще раз.";
    return NextResponse.json({ success: false, error: message }, { status: transient ? 503 : 500 });
  }
}
