import { NextRequest, NextResponse } from "next/server";
import { withJourney } from "@/lib/journey";
import { ukaskoService } from "@/services/ukasko";
import { guardRequest } from "@/lib/api-guard";
import { withIdempotency } from "@/lib/idempotency";
import { notifyDevError } from "@/lib/telegram";
import { normalizePlate } from "@/lib/plate";
import { splitDocSerialNumber } from "@/lib/doc-number";
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
  const insurer: OsagoV2Insurer = {
    name: str(i.name, 100),
    surname: str(i.surname, 100),
    ...(optStr(i.patronymic, 100) ? { patronymic: optStr(i.patronymic, 100) } : {}),
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
  const vin = str(v.vin, 17).toUpperCase();
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
      const { status, body: resBody } = await withIdempotency(
        idemHeader ? `create:${idemHeader}` : null,
        async () => {
          const result = await ukaskoService.createOsagoOrderV2(payload);
          console.error(`[order v2] created id=${result.id} mtsbu=${result.mtsbuCode ?? "-"} price=${result.price} changed=${result.priceChanged} otpSent=${result.otpSent} otpLen=${result.otpLength ?? "-"} dgoOtp=${result.dgo?.otpRequired ?? "-"}`);
          return { status: 200, body: { success: true, data: result } };
        }
      );
      return NextResponse.json(resBody, { status });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
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
