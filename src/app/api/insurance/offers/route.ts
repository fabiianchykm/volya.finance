import { NextRequest, NextResponse } from "next/server";
import { ukaskoService } from "@/services/ukasko";
import { guardRequest } from "@/lib/api-guard";
import { osagoDobForCompany } from "@/lib/osago-age-basis";
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

const companyMatchName = (o: InsuranceOffer) =>
  [o.companyNamePublic, o.companyName].filter(Boolean).join(" ");

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

    // Розрахунок під КОЖНУ унікальну (непорожню) дату — паралельно. Часто клієнт
    // вводить одну особу на всі ролі → лишається один запит (як раніше). Дефолт —
    // на випадок, коли жодної дати нема (авто не в реєстрі + порожні поля).
    const uniqueDobs = [...new Set([ownerDob, policyholderDob, youngestDob].filter(Boolean))];
    if (uniqueDobs.length === 0) uniqueDobs.push(DEFAULT_DOB);

    const runs = await Promise.all(uniqueDobs.map((d) => offersForDob(base, d)));
    const byDob = new Map<string, unknown>();
    uniqueDobs.forEach((d, i) => byDob.set(d, runs[i]));

    // Індекс offer-ів кожного прогону за companyId.
    const indexByDob = new Map<string, Map<string, InsuranceOffer>>();
    for (const d of uniqueDobs) {
      const arr = (byDob.get(d) as { data?: InsuranceOffer[] })?.data;
      const idx = new Map<string, InsuranceOffer>();
      if (Array.isArray(arr)) for (const o of arr) if (o?.companyId) idx.set(o.companyId, o);
      indexByDob.set(d, idx);
    }

    // Обʼєднання всіх компаній із будь-якого прогону, у порядку першої появи.
    const seen = new Set<string>();
    const merged: InsuranceOffer[] = [];
    for (const d of uniqueDobs) {
      const arr = (byDob.get(d) as { data?: InsuranceOffer[] })?.data;
      if (!Array.isArray(arr)) continue;
      for (const o of arr) {
        if (!o?.companyId || seen.has(o.companyId)) continue;
        seen.add(o.companyId);
        // ДН за основою саме цієї СК; фолбек — дефолт, якщо потрібної дати нема.
        const wantDob = osagoDobForCompany(companyMatchName(o), dobs) || DEFAULT_DOB;
        const pick =
          indexByDob.get(wantDob)?.get(o.companyId) ??
          // страхову порахували не в тому прогоні (напр. wantDob не серед унікальних) —
          // беремо з найближчого наявного (де вона взагалі зʼявилась).
          [...indexByDob.values()].map((m) => m.get(o.companyId)).find(Boolean) ??
          o;
        merged.push(pick);
      }
    }

    // Каркас відповіді беремо з першого непорожнього прогону, підміняємо data.
    const template = ((runs.find((r) => offerCount(r) > 0) ?? runs[0] ?? {}) as unknown) as Record<string, unknown>;
    const data = { ...template, data: merged };

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
