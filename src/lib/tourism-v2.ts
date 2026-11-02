// Туризм, Ukasko API v2 (/v2/insurance/tourism/*). Мапінг нашого «повного» order-payload
// (той самий, що зберігається в pending_orders і колись ішов у v1 order/create) у
// TourismV2OrderRequest: сервер v2 сам бере ціну/тариф/СК зі збереженого офера, тож
// передаємо лише offerId + страхувальника + туристів. order/create v2 ОДРАЗУ шле
// OTP-код на email (otpSent/otpLength у відповіді) — окремого send-otp немає.
//
// Чому v2: з 21.10.2026 v1 POST /orders/send-otp/{id} віддає 500 «Сталася помилка
// перевірки коду ОТП» для будь-якої туристичної заявки (клієнти не отримували код),
// а v2 create/verify-otp/checkout/confirm на проді працюють.
import { splitDocSerialNumber } from "./doc-number";
import type { TourismV2OrderRequest, TourismV2Tourist } from "@/types/api";

type Rec = Record<string, unknown>;
const isRec = (v: unknown): v is Rec => !!v && typeof v === "object" && !Array.isArray(v);
const str = (v: unknown, max = 200): string => (typeof v === "string" ? v.trim().slice(0, max) : typeof v === "number" ? String(v) : "");
const DATE_RE = /^\d{2}\.\d{2}\.\d{4}$/;

// ІПН (РНОКПП): спершу прибираємо все, крім цифр (клієнт міг ввести з пробілами
// «1234 567 890»), і лише тоді перевіряємо довжину. Раніше рядок обрізався до 10
// символів ДО очищення — «1234 567 890» → «12345678» → поліс мовчки йшов як
// withoutIdentificationCode:true, а СК відмовляла «Отсутствует ИНН».
// Порожньо → {without:true}; 10 цифр → код; інакше — зрозуміла помилка клієнту.
function ipnFields(v: unknown, who: string): { identificationCode: string; withoutIdentificationCode: false } | { withoutIdentificationCode: true } {
  const digits = str(v, 40).replace(/\D/g, "");
  if (!digits) return { withoutIdentificationCode: true };
  if (digits.length !== 10) throw new Error(`${who}: ідентифікаційний код має містити рівно 10 цифр.`);
  return { identificationCode: digits, withoutIdentificationCode: false };
}

const PURPOSES = new Set(["travel", "teaching", "activeTravel", "extrim", "professionalSports", "sport", "work", "business_travel"]);

// Unix-секунди (так v1-payload зберігає дати документа) → d.m.Y за Києвом.
const kyivDmy = new Intl.DateTimeFormat("uk-UA", { timeZone: "Europe/Kyiv", day: "2-digit", month: "2-digit", year: "numeric" });
function unixToDmy(v: unknown): string {
  const n = typeof v === "number" ? v : typeof v === "string" && /^\d+$/.test(v) ? Number(v) : NaN;
  if (!Number.isFinite(n) || n <= 0) return "";
  return kyivDmy.format(new Date(n * 1000)); // "09.02.2024"
}
const dmy = (v: unknown): string => (typeof v === "string" && DATE_RE.test(v.trim()) ? v.trim() : unixToDmy(v));

export function buildTourismV2Payload(order: Rec): TourismV2OrderRequest {
  const offerId = str(order.offerId, 64);
  if (!offerId) throw new Error("Не вказано пропозицію (offerId).");
  const info = isRec(order.info) ? order.info : null;
  if (!info) throw new Error("Бракує даних страхувальника.");
  const list = Array.isArray(order.touristsListInfo) ? order.touristsListInfo.filter(isRec) : [];
  if (list.length === 0) throw new Error("Не вказано жодного туриста.");

  const city = isRec(info.city) ? info.city : null;
  const cityId = Number(city?.id ?? info.cityId ?? 0);
  if (!Number.isInteger(cityId) || cityId <= 0) throw new Error("Оберіть місто проживання страхувальника.");
  const street = str(info.street, 200);
  const house = str(info.house, 20);
  const apartment = str(info.apartment, 20);

  const tourists: TourismV2Tourist[] = list.map((t, i) => {
    const { serial, number } = splitDocSerialNumber(t.passportSerial, t.passportNumber);
    const passportDate = dmy(t.passportDate);
    const passportEndDate = dmy(t.passportEndDate);
    if (!serial || !number || !passportDate) throw new Error(`Турист №${i + 1}: вкажіть серію, номер і дату видачі закордонного паспорта.`);
    return {
      name: str(t.name, 100),
      surname: str(t.surname, 100),
      dateBirth: dmy(t.dateBirth),
      ...ipnFields(t.identificationCode, `Турист №${i + 1}`),
      documentType: Number(t.documentType) || 2,
      passportSerial: serial,
      passportNumber: number,
      passportDate,
      ...(passportEndDate ? { passportEndDate } : {}),
      ...(str(t.passportIssuedBy, 200) ? { passportIssuedBy: str(t.passportIssuedBy, 200) } : {}),
      cityId, street, house, ...(apartment ? { apartment } : {}),
    };
  });

  // Документ страхувальника = закордонний паспорт туриста №1 (так і в v1-payload:
  // info.documentation type=2). Дати беремо з рядків d.m.Y туриста, бо в documentation
  // вони unix і зсуваються на день при конвертації.
  const docRaw = isRec(info.documentation) ? info.documentation : {};
  const docType = Number(docRaw.type) || 2;
  const doc = splitDocSerialNumber(docRaw.serial, docRaw.number);
  const main = tourists[0];
  const document = {
    type: docType,
    ...(docType !== 3 && (doc.serial || main.passportSerial) ? { serial: doc.serial || main.passportSerial } : {}),
    number: doc.number || main.passportNumber,
    dateOfIssue: (docType === 2 ? main.passportDate : "") || dmy(docRaw.dateOfIssue) || main.passportDate,
    ...((docType === 2 ? main.passportEndDate : "") || dmy(docRaw.endDateOfIssue) ? { endDateOfIssue: (docType === 2 ? main.passportEndDate : "") || dmy(docRaw.endDateOfIssue) } : {}),
    ...(str(docRaw.issuedBy, 200) ? { issuedBy: str(docRaw.issuedBy, 200) } : {}),
  };
  if (!document.number || !document.dateOfIssue) throw new Error("Заповніть документ страхувальника (номер і дату видачі).");

  // Страхувальник: СК (напр. «Респект») не створюють контрагента без ІПН — v2 create
  // падає 500 «Нельзя создавать контрагента с признаком "Отсутствует ИНН"». Тому для
  // страхувальника ІПН обовʼязковий уже тут (форма теж вимагає; мобільний застосунок
  // отримує зрозумілу помилку замість «страхова тимчасово недоступна»).
  const insurerIpn = ipnFields(info.identificationCode, "Страхувальник");
  if (insurerIpn.withoutIdentificationCode) throw new Error("Вкажіть ідентифікаційний код страхувальника (10 цифр) — страхові компанії не оформлюють туристичний поліс без нього.");
  const email = str(info.mail ?? info.email, 200);
  const phone = str(info.phone, 20);
  if (!email || !phone) throw new Error("Вкажіть email і телефон страхувальника.");

  const offerInfo = isRec(order.offerInfo) ? order.offerInfo : {};
  const purposeRaw = str(order.purposeOfTrip ?? offerInfo.purposeOfTrip, 40);

  return {
    offerId,
    purposeOfTrip: PURPOSES.has(purposeRaw) ? purposeRaw : "travel",
    insurer: {
      name: str(info.name, 100),
      surname: str(info.surname, 100),
      dateBirth: dmy(info.dateBirth),
      ...insurerIpn,
      phone, email, cityId, street, house, ...(apartment ? { apartment } : {}),
      document,
    },
    tourists,
    isSendPhoneMessage: false,
  };
}
