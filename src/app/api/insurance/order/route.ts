import { NextRequest, NextResponse } from "next/server";
import { normalizeVin, isValidVin } from "@/lib/vin";
import { normalizeUaName, isUaName } from "@/lib/ua-name";
import { humanizeV2FieldErrors } from "@/lib/ukasko-field-labels";
import { withJourney } from "@/lib/journey";
import { ukaskoService } from "@/services/ukasko";
import { guardRequest } from "@/lib/api-guard";
import { withIdempotency } from "@/lib/idempotency";
import { notifyDevError } from "@/lib/telegram";
import { normalizePlate } from "@/lib/plate";
import { splitDocSerialNumber } from "@/lib/doc-number";
import { getBonusAvailability, holdBonusRedemption } from "@/lib/bonus-redemption";
import { getSessionIdentity } from "@/lib/session-identity";
import { lookupOfferPrice } from "@/lib/offer-price-cache";
import { checkPromoCode, holdPromoUse, normalizePromoCode } from "@/lib/promo";
import type { OsagoV2Insurer, OsagoV2OrderRequest, OsagoV2Vehicle } from "@/types/api";

// Заявлення ОСЦПВ — Ukasko API v2 (/v2/insurance/oscpv/order/create): один виклик
// створює заявку, декларує її в СК (номер МТСБУ) і надсилає OTP на email. Тарифні
// дані (ціна, СК, категорія, зона, пільга) сервер бере зі збереженого офера за offerId —
// клієнт передає лише страхувальника, авто та обрані варіанти ДЦВ/автоюриста.
// Флоу далі: /api/insurance/otp (v2) → оплата (/api/insurance/payment, checkout v2) →
// /api/insurance/contract confirm → download.

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const str = (v: unknown, max = 200): string => (typeof v === "string" ? v.trim().slice(0, max) : "");
const optStr = (v: unknown, max = 200): string | undefined => (str(v, max) ? str(v, max) : undefined);
const num = (v: unknown): number | undefined => {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v) : NaN;
  return Number.isFinite(n) ? n : undefined;
};
const DATE_RE = /^\d{1,2}\.\d{1,2}\.\d{4}$/;
const date = (v: unknown): string | undefined => (typeof v === "string" && DATE_RE.test(v.trim()) ? v.trim() : undefined);

// Санітизуємо вхід з клієнта у суворий v2-payload: лише відомі поля, коректні типи.
function buildPayload(body: Record<string, unknown>): OsagoV2OrderRequest {
  const offerId = str(body.offerId, 64);
  if (!offerId) throw new Error("Не вказано пропозицію (offerId).");
  if (!isObj(body.insurer) || !isObj(body.vehicle)) throw new Error("Бракує даних страхувальника або авто.");
  const i = body.insurer;
  const v = body.vehicle;

  const docRaw = isObj(i.document) ? i.document : null;
  const docTypeRaw = num(docRaw?.type);
  const docType: 1 | 2 | 3 | 4 | undefined = docTypeRaw === 1 || docTypeRaw === 2 || docTypeRaw === 3 || docTypeRaw === 4 ? docTypeRaw : undefined;
  // Серія і номер — окремими полями (клієнт міг ввести «СН123456» в номер).
  // Для ID-картки (type 3) серії нема: там number — 9 цифр, УНЗР іде в insurer.unzr.
  const docSplit = docRaw && docType && docType !== 3 ? splitDocSerialNumber(docRaw.serial, docRaw.number) : null;
  const document = docRaw && docType
    ? {
        type: docType,
        ...(docSplit && optStr(docSplit.serial, 20) ? { serial: optStr(docSplit.serial, 20) } : {}),
        number: docSplit ? str(docSplit.number, 30) : str(docRaw.number, 30),
        dateOfIssue: date(docRaw.dateOfIssue) ?? "",
        ...(date(docRaw.endDateOfIssue) ? { endDateOfIssue: date(docRaw.endDateOfIssue) } : {}),
        ...(optStr(docRaw.issuedBy, 200) ? { issuedBy: optStr(docRaw.issuedBy, 200) } : {}),
      }
    : undefined;
  if (!document || !document.number || !document.dateOfIssue) throw new Error("Заповніть документ страхувальника (номер і дату видачі).");

  const privRaw = isObj(i.privilegeDocument) ? i.privilegeDocument : null;
  const privType = num(privRaw?.type);
  const privSplit = privRaw ? splitDocSerialNumber(privRaw.serial, privRaw.number) : null;
  const privilegeDocument = privRaw && privSplit && privType && privType >= 2 && privType <= 10
    ? {
        type: privType,
        ...(optStr(privSplit.serial, 20) ? { serial: optStr(privSplit.serial, 20) } : {}),
        number: str(privSplit.number, 30),
        dateOfIssue: date(privRaw.dateOfIssue) ?? "",
        ...(optStr(privRaw.issuedBy, 200) ? { issuedBy: optStr(privRaw.issuedBy, 200) } : {}),
      }
    : undefined;

  const ipn = str(i.identificationCode, 10).replace(/\D/g, "");
  const cityId = num(i.cityId);
  if (!cityId) throw new Error("Оберіть місто проживання страхувальника.");
  // ПІБ лише кирилицею (Ukasko: «має хибний формат» на латиницю/цифри/крапку);
  // «-» замість по батькові → поле не передаємо.
  const nameUa = normalizeUaName(str(i.name, 100));
  const surnameUa = normalizeUaName(str(i.surname, 100));
  const patronymicUa = normalizeUaName(str(i.patronymic, 100));
  if (!nameUa || !surnameUa) throw new Error("Вкажіть прізвище та імʼя страхувальника.");
  for (const [label, v] of [["Прізвище", surnameUa], ["Імʼя", nameUa], ["По батькові", patronymicUa]] as const) {
    if (!isUaName(v)) throw new Error(`${label}: введіть українською (кирилицею), без латинських літер, цифр і крапок.`);
  }
  const insurer: OsagoV2Insurer = {
    name: nameUa,
    surname: surnameUa,
    ...(patronymicUa ? { patronymic: patronymicUa } : {}),
    dateBirth: date(i.dateBirth) ?? "",
    ...(ipn.length === 10 ? { identificationCode: ipn } : { withoutIdentificationCode: true }),
    ...(docType === 3 && optStr(i.unzr, 20) ? { unzr: optStr(i.unzr, 20) } : {}),
    phone: str(i.phone, 20),
    email: str(i.email, 120),
    cityId,
    street: str(i.street, 200),
    house: str(i.house, 30),
    ...(optStr(i.apartment, 20) ? { apartment: optStr(i.apartment, 20) } : {}),
    isVehicleOwner: i.isVehicleOwner !== false,
    document,
    ...(privilegeDocument ? { privilegeDocument } : {}),
  };
  if (!insurer.name || !insurer.surname || !insurer.dateBirth) throw new Error("Заповніть ПІБ і дату народження страхувальника.");
  if (!/^\S+@\S+\.\S+$/.test(insurer.email)) throw new Error("Вкажіть коректний email.");
  if (!insurer.phone || !insurer.street || !insurer.house) throw new Error("Заповніть телефон і адресу страхувальника.");

  const number = normalizePlate(str(v.number, 20));
  const year = num(v.year);
  // VIN: кирилиця-двійники → латиниця, без пробілів/дефісів; МТСБУ приймає лише A–Z/0–9.
  const vinRaw = str(v.vin, 40);
  const vin = normalizeVin(vinRaw);
  if (vinRaw && !isValidVin(vin)) throw new Error("VIN-код: лише латинські літери A–Z і цифри (до 17 символів), без пробілів і дефісів.");
  const vehicle: OsagoV2Vehicle = {
    brand: str(v.brand, 100),
    model: str(v.model, 100),
    number,
    ...(vin ? { vin, withoutVin: false } : { withoutVin: true }),
    year: year ?? 0,
    ...(num(v.cityId) ? { cityId: num(v.cityId) } : {}),
    ...(date(v.ownerBirthDate) ? { ownerBirthDate: date(v.ownerBirthDate) } : {}),
    ...(date(v.driverBirthDate) ? { driverBirthDate: date(v.driverBirthDate) } : {}),
    ...(num(v.kilometers) !== undefined ? { kilometers: num(v.kilometers) } : {}),
    ...(num(v.engineSize) ? { engineSize: num(v.engineSize) } : {}),
    ...(num(v.kvt) ? { kvt: num(v.kvt) } : {}),
    ...(num(v.ownWeight) ? { ownWeight: num(v.ownWeight) } : {}),
    ...(num(v.totalWeight) ? { totalWeight: num(v.totalWeight) } : {}),
    ...(num(v.nSeating) ? { nSeating: num(v.nSeating) } : {}),
  };
  if (!vehicle.brand || !vehicle.model || number.length < 4 || !vehicle.year) throw new Error("Заповніть марку, модель, рік і держномер авто.");

  return {
    offerId,
    ...(optStr(body.dgoId, 64) ? { dgoId: optStr(body.dgoId, 64) } : {}),
    ...(optStr(body.autolawyerId, 64) ? { autolawyerId: optStr(body.autolawyerId, 64) } : {}),
    insurer,
    vehicle,
    isSendPhoneMessage: body.isSendPhoneMessage === true,
  };
}

// Знижка на заявку = промокод + списані бонуси → один discountPercent від ціни
// пропозиції (Ukasko v2, знижка коштом нашої комісії зі стелею maxDiscount).
// Бонуси обмежені доступним залишком людини (з урахуванням резервів), усе разом —
// стелею пропозиції й самою ціною. Ціну беремо з серверного кешу пропозицій; при
// промаху — з тіла запиту, але фактичну знижку з відповіді Ukasko потім звіряємо.
interface DiscountPlan {
  percent: number;            // 0 — без знижки
  price: number;
  email: string | null;
  bonusRequested: number;
  bonusCap: number;           // скільки бонусів закладено у відсоток
  bonusAvailable: number;
  bonusReason?: string;
  promoCode: string | null;
  promoDiscount: number;      // скільки грн дає промокод (до стелі СК)
  promoError?: string;
}
async function resolveDiscount(body: Record<string, unknown>, offerId: string): Promise<DiscountPlan> {
  const bonusRequested = Math.floor(num(body.bonusAmount) ?? 0);
  const promoCode = normalizePromoCode(str(body.promoCode, 40)) || null;
  const plan: DiscountPlan = { percent: 0, price: 0, email: null, bonusRequested, bonusCap: 0, bonusAvailable: 0, promoCode, promoDiscount: 0 };
  if (!(bonusRequested > 0) && !promoCode) return plan;

  const cached = lookupOfferPrice(offerId);
  const price = cached?.price ?? num(body.offerPrice) ?? 0;
  plan.price = price;
  if (!(price > 0)) { plan.bonusReason = "no-price"; plan.promoError = "Не вдалося визначити ціну пропозиції."; return plan; }
  const ceiling = Math.min(price, cached?.maxDiscount ?? Infinity);

  if (promoCode) {
    const r = await checkPromoCode(promoCode, "osago", price).catch(() => null);
    if (r?.ok) plan.promoDiscount = Math.min(r.discount, ceiling);
    else plan.promoError = r ? r.message : "Не вдалося перевірити промокод.";
  }

  if (bonusRequested > 0) {
    // Ключ рахунку для резерву: email Google-входу або phone:+380… для входу за номером.
    const who = await getSessionIdentity();
    const bonusKey = who.email ?? (who.phone ? `phone:${who.phone}` : null);
    if (!bonusKey) plan.bonusReason = "not-logged-in";
    else {
      plan.email = bonusKey;
      const avail = await getBonusAvailability(who);
      plan.bonusAvailable = avail.available;
      const room = Math.max(0, ceiling - plan.promoDiscount);
      plan.bonusCap = Math.floor(Math.min(bonusRequested, avail.available, room));
      if (plan.bonusCap < 1) { plan.bonusCap = 0; plan.bonusReason = avail.available < 1 ? "no-balance" : "capped-to-zero"; }
    }
  }

  const total = Math.floor(Math.min(price, plan.promoDiscount + plan.bonusCap));
  if (total >= 1) {
    // Округлюємо ВНИЗ до 0.01 %, щоб знижка ніколи не перевищила заплановану суму.
    plan.percent = Math.max(0.01, Math.min(100, Math.floor((total / price) * 10000) / 100));
  }
  return plan;
}

async function handlePost(req: NextRequest) {
  try {
    // Заявлення декларує поліс у СК і запускає email/SMS — обмежуємо жорсткіше.
    const blocked = guardRequest(req, { name: "order", limit: 15, windowMs: 10 * 60 * 1000 });
    if (blocked) return blocked;

    const body = await req.json();
    const { action } = body ?? {};
    const idemHeader = req.headers.get("idempotency-key");

    if (action === "create") {
      let payload: OsagoV2OrderRequest;
      try {
        payload = buildPayload(body);
      } catch (e) {
        return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Невірні дані" }, { status: 400 });
      }
      // Дедуплікуємо за клієнтським ключем спроби (Idempotency-Key): повторний submit /
      // мережевий ретрай не створює другу декларацію в СК.
      const plan = await resolveDiscount(body, payload.offerId);
      if (plan.percent > 0) payload.discountPercent = plan.percent;
      const { status, body: resBody } = await withIdempotency(
        idemHeader ? `create:${idemHeader}` : null,
        async () => {
          let result: Awaited<ReturnType<typeof ukaskoService.createOsagoOrderV2>>;
          let discountRejected: string | null = null;
          try {
            result = await ukaskoService.createOsagoOrderV2(payload);
          } catch (e) {
            // Акаунту не дозволено discountPercent (422 від Ukasko) — не валимо покупку:
            // повторюємо БЕЗ знижки (422 не створює заявку, дубля декларації не буде).
            const msg = e instanceof Error ? e.message : String(e);
            if (!(payload.discountPercent && /discount|знижк/i.test(msg))) throw e;
            discountRejected = msg;
            console.error("[order v2] discountPercent rejected, retrying without discount:", msg.slice(0, 300));
            await notifyDevError("discountPercent rejected by Ukasko", e);
            delete payload.discountPercent;
            plan.percent = 0;
            result = await ukaskoService.createOsagoOrderV2(payload);
          }
          // Фактична знижка — з відповіді Ukasko (стеля могла урізати запит). Спершу
          // «закриваємо» промокод, решта — бонуси (їх резервуємо на рахунку).
          const discountFromPrice = result.discountPrice && result.discountPrice > 0 ? Math.max(0, result.price - result.discountPrice) : 0;
          const applied = plan.percent > 0 ? Math.max(0, Math.round(Number(result.discountAmount) || discountFromPrice)) : 0;
          const promoApplied = Math.min(plan.promoDiscount, applied);
          const bonusApplied = Math.max(0, applied - promoApplied);
          if (promoApplied > 0 && plan.promoCode) {
            await holdPromoUse({ orderId: result.id, code: plan.promoCode, email: plan.email ?? payload.insurer.email, product: "osago", amount: promoApplied }).catch((e) => notifyDevError("promo hold", e));
          }
          if (bonusApplied > 0 && plan.email) {
            await holdBonusRedemption({ orderId: result.id, email: plan.email, product: "osago", amount: bonusApplied }).catch((e) => notifyDevError("bonus hold", e));
            if (bonusApplied > plan.bonusAvailable + 1) await notifyDevError("bonus over-applied", new Error(`order ${result.id}: bonusApplied=${bonusApplied} available=${plan.bonusAvailable} percent=${plan.percent} price=${plan.price}`));
          }
          if (plan.bonusRequested > 0) result.bonus = { requested: plan.bonusRequested, applied: bonusApplied, reason: discountRejected ? "rejected" : plan.bonusReason };
          if (plan.promoCode) result.promo = { code: plan.promoCode, requested: plan.promoDiscount, applied: promoApplied, error: discountRejected ? "Страхова не прийняла знижку на цю заявку." : plan.promoError };
          console.error(`[order v2] created id=${result.id} mtsbu=${result.mtsbuCode ?? "-"} price=${result.price} changed=${result.priceChanged} otpSent=${result.otpSent} otpLen=${result.otpLength ?? "-"} dgoOtp=${result.dgo?.otpRequired ?? "-"} promo=${plan.promoCode ?? "-"}/${promoApplied} bonus=${plan.bonusRequested}/${bonusApplied} pct=${plan.percent} discountPrice=${result.discountPrice ?? "-"} capped=${result.discountCapped ?? "-"}`);
          return { status: 200, body: { success: true, data: result } };
        }
      );
      return NextResponse.json(resBody, { status });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error) {
    const message = humanizeV2FieldErrors(error instanceof Error ? error.message : "Unknown error");
    // Очікувані, САМОВІДНОВЛЮВАНІ транзієнти (див. CheckoutClient.isRetryable):
    // протухла пропозиція (клієнт сам перераховує і повторює), порожня відповідь
    // модуля СК. Лишаємо їх у Cloud Logging, але НЕ пінгуємо оператора.
    const expectedTransient =
      /offer\s*id|offerid|пропозиці\w*\s+(застарі|не\s*знайден|не\s*дійсн)|не\s*коректн|порожн[яю]\s*відповід|empty|тимчасов[ао]\s*недоступн/i.test(message);
    if (expectedTransient) {
      console.error("[order] expected transient (client auto-retries):", message.slice(0, 300));
    } else {
      await notifyDevError("insurance order (v2)", error);
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export const POST = withJourney("insurance/order", handlePost);
