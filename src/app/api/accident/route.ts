import { NextRequest, NextResponse } from "next/server";
import { guardRequest } from "@/lib/api-guard";
import { ukaskoService } from "@/services/ukasko";
import { notifyDevError } from "@/lib/telegram";
import type { AccidentParams } from "@/types/api";

// Калькулятор страхування від нещасних випадків (НВ): параметри застрахованої
// особи й покриття → реальні пропозиції страхових. Переліки з документації Ukasko.
const PERIODS = ["10_days", "15_days", "30_days", "3_month", "6_month", "9_month", "12_month"];
const PROTECTION = ["24_7", "study_work_hours", "sport_hours"];
const SUMS = [10000, 15000, 25000, 50000, 100000, 150000, 200000, 250000, 300000];
const FACTORS = ["warRisk", "sport", "profession"];
const PROFESSIONS = ["none", "builder", "electrician", "firefighter", "guard", "other"];
const DATE_RE = /^\d{2}\.\d{2}\.\d{4}$/;

export async function POST(req: NextRequest) {
  const blocked = guardRequest(req, { name: "accident", limit: 30, windowMs: 10 * 60 * 1000 });
  if (blocked) return blocked;

  let params: AccidentParams;
  try {
    const b = await req.json();
    const factor = String(b?.activeFactor ?? "");
    if (!DATE_RE.test(String(b?.startDate ?? ""))) return NextResponse.json({ success: false, error: "Вкажіть дату початку" }, { status: 400 });
    if (!DATE_RE.test(String(b?.birthDate ?? ""))) return NextResponse.json({ success: false, error: "Вкажіть дату народження" }, { status: 400 });
    if (!PERIODS.includes(String(b?.period))) return NextResponse.json({ success: false, error: "Некоректний строк" }, { status: 400 });
    if (!PROTECTION.includes(String(b?.protectionPeriod))) return NextResponse.json({ success: false, error: "Некоректний період захисту" }, { status: 400 });
    if (!SUMS.includes(Number(b?.sum))) return NextResponse.json({ success: false, error: "Некоректна страхова сума" }, { status: 400 });
    if (![1, 2].includes(Number(b?.countryId))) return NextResponse.json({ success: false, error: "Некоректна територія" }, { status: 400 });
    if (!FACTORS.includes(factor)) return NextResponse.json({ success: false, error: "Некоректний фактор ризику" }, { status: 400 });

    params = {
      startDate: String(b.startDate), birthDate: String(b.birthDate),
      period: b.period, protectionPeriod: b.protectionPeriod,
      sum: Number(b.sum), countryId: Number(b.countryId) as 1 | 2,
      activeFactor: factor as AccidentParams["activeFactor"],
    };
    if (factor === "warRisk") params.warRisk = true;
    if (factor === "sport") {
      if (!b?.sportType) return NextResponse.json({ success: false, error: "Оберіть вид спорту" }, { status: 400 });
      params.sportType = String(b.sportType);
      params.sportCategory = String(b.sportCategory ?? "10234940");
    }
    if (factor === "profession") {
      params.profession = PROFESSIONS.includes(String(b?.profession)) ? b.profession : "none";
    }
  } catch {
    return NextResponse.json({ success: false, error: "Некоректний запит" }, { status: 400 });
  }

  try {
    const offers = await ukaskoService.getAccidentOffers(params);
    return NextResponse.json({ success: true, offers });
  } catch (e) {
    console.error("[accident] calc error:", e instanceof Error ? e.message : e);
    await notifyDevError("accident calculator", e);
    return NextResponse.json({ success: false, error: "Не вдалося отримати пропозиції. Спробуйте пізніше." }, { status: 500 });
  }
}
