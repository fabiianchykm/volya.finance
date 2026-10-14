import { NextRequest, NextResponse } from "next/server";
import { guardRequest } from "@/lib/api-guard";
import { ukaskoService } from "@/services/ukasko";
import { notifyDevError } from "@/lib/telegram";
import type { AccidentFactor, AccidentPackage, AccidentParams, AccidentRisks, YN } from "@/types/api";

// Калькулятор страхування від нещасних випадків (НВ): параметри застрахованої
// особи, пакет ризиків і фактори → реальні пропозиції страхових. Переліки з
// документації Ukasko (оновлення 14.10.2026: пакети, набір ризиків з групами
// інвалідності, кілька факторів одночасно, категорія спорту рядком).
const PERIODS = ["10_days", "15_days", "30_days", "3_month", "6_month", "9_month", "12_month"];
const PROTECTION = ["24_7", "study_work_hours", "sport_hours"];
const SUMS = [10000, 15000, 25000, 50000, 100000, 150000, 200000, 250000, 300000];
const FACTORS: AccidentFactor[] = ["warRisk", "sport", "profession"];
const PROFESSIONS = ["none", "builder", "electrician", "firefighter", "guard", "other"];
const PACKAGES: AccidentPackage[] = ["adults", "sick_leave", "complex", "child"];
const SPORT_CATEGORIES = ["amateur", "professional", "10234940", "10236763", "10236764", "10236765", "10236766", "10236767", "10236768", "10236769", "10236770"];
const DATE_RE = /^\d{2}\.\d{2}\.\d{4}$/;
// ⚠️ кирилична «А» в RiskGroup…Аccident — так у Ukasko.
const RISK_KEYS: (keyof Omit<AccidentRisks, "RiskTemporaryDisability">)[] = [
  "RiskDeathAccident", "RiskGroupOneАccident", "RiskGroupTwoАccident", "RiskGroupThreeАccident", "RiskInjuriesAccident",
  "RiskDeathIllness", "RiskGroupOneIllness", "RiskGroupTwoIllness", "RiskGroupThreeIllness", "RiskDisabledChild",
];

const yn = (v: unknown): YN | undefined => (v === "Y" || v === true ? "Y" : v === "N" || v === false ? "N" : undefined);

function parseDate(s: string): Date | null {
  const m = DATE_RE.exec(s); if (!m) return null;
  const [d, mo, y] = s.split(".").map(Number);
  const dt = new Date(y, mo - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d ? dt : null;
}
function ageAt(birth: Date, at: Date): number {
  let a = at.getFullYear() - birth.getFullYear();
  if (at.getMonth() < birth.getMonth() || (at.getMonth() === birth.getMonth() && at.getDate() < birth.getDate())) a--;
  return a;
}

// Санітизація набору ризиків: лише відомі ключі зі значеннями Y/N.
function sanitizeRisks(raw: unknown): AccidentRisks | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;
  const out: AccidentRisks = {};
  for (const k of RISK_KEYS) { const v = yn(r[k]); if (v) out[k] = v; }
  const td = r.RiskTemporaryDisability;
  if (td && typeof td === "object") {
    const t = td as Record<string, unknown>;
    const o: NonNullable<AccidentRisks["RiskTemporaryDisability"]> = {};
    const a = yn(t.TemporaryDisability03P); if (a) o.TemporaryDisability03P = a;
    const b = yn(t.TemporaryDisability01P); if (b) o.TemporaryDisability01P = b;
    if (Object.keys(o).length) out.RiskTemporaryDisability = o;
  }
  // Смерть від НВ — базовий ризик, завжди Y.
  out.RiskDeathAccident = "Y";
  return out;
}

export async function POST(req: NextRequest) {
  const blocked = guardRequest(req, { name: "accident", limit: 30, windowMs: 10 * 60 * 1000 });
  if (blocked) return blocked;

  let params: AccidentParams;
  try {
    const b = await req.json();
    const start = parseDate(String(b?.startDate ?? ""));
    const birth = parseDate(String(b?.birthDate ?? ""));
    if (!start) return NextResponse.json({ success: false, error: "Вкажіть дату початку" }, { status: 400 });
    if (!birth) return NextResponse.json({ success: false, error: "Вкажіть дату народження" }, { status: 400 });
    if (!PERIODS.includes(String(b?.period))) return NextResponse.json({ success: false, error: "Некоректний строк" }, { status: 400 });
    if (!PROTECTION.includes(String(b?.protectionPeriod))) return NextResponse.json({ success: false, error: "Некоректний період захисту" }, { status: 400 });
    if (!SUMS.includes(Number(b?.sum))) return NextResponse.json({ success: false, error: "Некоректна страхова сума" }, { status: 400 });
    if (![1, 2].includes(Number(b?.countryId))) return NextResponse.json({ success: false, error: "Некоректна територія" }, { status: 400 });

    // Фактори: масив (кілька одночасно) або один activeFactor. Порожньо = «без
    // особливих ризиків» = profession:none (у API немає окремого «нічого»).
    const rawFactors: unknown[] = Array.isArray(b?.activeFactors) ? b.activeFactors : b?.activeFactor ? [b.activeFactor] : [];
    const factors = [...new Set(rawFactors.map(String))].filter((f): f is AccidentFactor => (FACTORS as string[]).includes(f));
    if (rawFactors.length && !factors.length) return NextResponse.json({ success: false, error: "Некоректний фактор ризику" }, { status: 400 });

    const isChild = ageAt(birth, start) < 18;
    params = {
      startDate: String(b.startDate), birthDate: String(b.birthDate),
      period: b.period, protectionPeriod: b.protectionPeriod,
      sum: Number(b.sum), countryId: Number(b.countryId) as 1 | 2,
      activeFactor: factors[0] ?? "profession",
    };
    if (factors.length > 1) params.activeFactors = factors;
    if (factors.includes("warRisk")) params.warRisk = true;
    if (factors.includes("sport")) {
      if (!b?.sportType) return NextResponse.json({ success: false, error: "Оберіть вид спорту" }, { status: 400 });
      params.sportType = String(b.sportType);
      const cat = b.sportCategory === "pro" ? "professional" : String(b.sportCategory ?? b.sportLevel ?? "amateur");
      params.sportCategory = SPORT_CATEGORIES.includes(cat) ? cat : "amateur";
    }
    if (factors.includes("profession")) {
      // Для дітей професія не застосовується — СК відхилить.
      params.profession = !isChild && PROFESSIONS.includes(String(b?.profession)) ? b.profession : "none";
    } else if (!factors.length) {
      params.profession = "none";
    }

    // Пакет: дітям (<18) лише child, дорослим — adults/sick_leave/complex (дефолт adults).
    const pkg = String(b?.selectedPackage ?? "");
    params.selectedPackage = isChild ? "child" : (PACKAGES.includes(pkg as AccidentPackage) && pkg !== "child" ? (pkg as AccidentPackage) : "adults");
    const risks = sanitizeRisks(b?.accidentRisks);
    if (risks) params.accidentRisks = risks;
  } catch {
    return NextResponse.json({ success: false, error: "Некоректний запит" }, { status: 400 });
  }

  try {
    const { offers, errorInfo } = await ukaskoService.getAccidentOffers(params);
    return NextResponse.json({ success: true, offers, errorInfo, params, hint: hintFromErrors(errorInfo) });
  } catch (e) {
    console.error("[accident] calc error:", e instanceof Error ? e.message : e);
    await notifyDevError("accident calculator", e);
    return NextResponse.json({ success: false, error: "Не вдалося отримати пропозиції. Спробуйте пізніше." }, { status: 500 });
  }
}

// Людська підказка з errorInfo СК (лише те, що клієнту корисно знати).
function hintFromErrors(errorInfo: unknown[]): string | null {
  const text = errorInfo.map((e) => String((e as { errorText?: string })?.errorText ?? "")).join(" ");
  if (/андерайтер/i.test(text)) return "Для цього виду спорту та рівня потрібне погодження страхової. Напишіть нам у підтримку — оформимо вручну.";
  if (/вік особи/i.test(text)) return "Для цього віку обраний пакет недоступний. Дітям до 18 років доступна дитяча програма.";
  if (/ризик недійсний|обов'язковий ризик|1-3 групи/i.test(text)) return "Така комбінація ризиків у страховій недоступна. Змініть набір ризиків або пакет.";
  return null;
}
