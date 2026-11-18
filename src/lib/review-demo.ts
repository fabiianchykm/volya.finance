import { savePolicy, getPoliciesByPhone } from "./policies";
import { normalizePhone } from "./phone-login";

// Демо-акаунт для App Review (Apple, Google): рев'юер не отримає код у Telegram,
// тому для одного службового номера код фіксований і задається в env
// (REVIEW_DEMO_PHONE / REVIEW_DEMO_CODE). Без обох змінних режим вимкнений.
// Кабінет демо-акаунта наповнюємо тестовими полісами (is_test), щоб було що показати.

export const REVIEW_DEMO_EMAIL = "review@volya.finance";

export function reviewDemoPhone(): string | null {
  const raw = process.env.REVIEW_DEMO_PHONE?.trim();
  if (!raw || !process.env.REVIEW_DEMO_CODE?.trim()) return null;
  return normalizePhone(raw);
}

export function isReviewDemoPhone(phone: string | null | undefined): boolean {
  const demo = reviewDemoPhone();
  return !!demo && !!phone && demo === phone;
}

/** Код демо-акаунта збігся (порівняння сталої довжини, без таймінг-витоку). */
export function verifyReviewDemoCode(phone: string, code: string): boolean {
  if (!isReviewDemoPhone(phone)) return false;
  const expected = String(process.env.REVIEW_DEMO_CODE ?? "").trim();
  if (!expected || expected.length !== code.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ code.charCodeAt(i);
  return diff === 0;
}

const pad = (n: number) => String(n).padStart(2, "0");
const ua = (d: Date) => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;

/** Тестові поліси демо-акаунта (ідемпотентно: upsert за фіксованими id). */
export async function ensureReviewDemoPolicies(phone: string): Promise<void> {
  if (!isReviewDemoPhone(phone)) return;
  try {
    const existing = await getPoliciesByPhone(phone);
    if (existing.some((p) => p.id.startsWith("review-demo-"))) return;
    const today = new Date();
    const plusDays = (n: number) => new Date(today.getTime() + n * 86_400_000);
    const minusDays = (n: number) => new Date(today.getTime() - n * 86_400_000);
    const base = { email: REVIEW_DEMO_EMAIL, phone, customerName: "Демо Клієнт", source: "manual", isTest: true, customer: {} };
    await savePolicy({
      ...base,
      id: "review-demo-osago",
      product: "osago",
      company: "ПрАТ «СК «ПЗУ УКРАЇНА»",
      policyNumber: "EP 000000001",
      vehicle: { plate: "АА0000АА", mark: "Toyota", model: "Corolla", year: 2019 } as never,
      price: 1850,
      startDate: ua(minusDays(30)),
      endDate: ua(plusDays(335)),
    });
    await savePolicy({
      ...base,
      id: "review-demo-tourism",
      product: "tourism",
      company: "АТ «СК «АРКС»",
      policyNumber: "TR 000000002",
      vehicle: {} as never,
      price: 640,
      startDate: ua(minusDays(400)),
      endDate: ua(minusDays(385)),
    });
  } catch (e) {
    console.error("[review-demo] seed failed:", e instanceof Error ? e.message : e);
  }
}
