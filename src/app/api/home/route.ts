import { NextRequest, NextResponse } from "next/server";
import { ukaskoService } from "@/services/ukasko";
import { guardRequest } from "@/lib/api-guard";
import { notifyDevError } from "@/lib/telegram";

// Комісія агента для розрахунку житла (значення value з /insurance/home/tariffs).
const HOME_EARNINGS = 15;

// Калькулятор страхування житла: {homeType, insuranceAmount, insurancePeriod, startFrom}.
export async function POST(req: NextRequest) {
  try {
    const blocked = guardRequest(req, { name: "home", limit: 30, windowMs: 10 * 60 * 1000 });
    if (blocked) return blocked;

    const body = await req.json();
    const homeType = body?.homeType === "house" ? "house" : "flat";
    const insuranceAmount = Number(body?.insuranceAmount);
    const insurancePeriod = String(body?.insurancePeriod ?? "");
    const startFrom = String(body?.startFrom ?? "");
    if (!insuranceAmount || !/^\d+m$/.test(insurancePeriod) || !/^\d{4}-\d{2}-\d{2}$/.test(startFrom)) {
      return NextResponse.json({ success: false, error: "Заповніть усі поля" }, { status: 400 });
    }

    const offers = await ukaskoService.getHomeOffers({ homeType, insuranceAmount, insurancePeriod, earnings: HOME_EARNINGS, startFrom });
    return NextResponse.json({ success: true, offers });
  } catch (e) {
    console.error("[home] error →", e instanceof Error ? e.message : e);
    await notifyDevError("home calculator", e);
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Помилка розрахунку" }, { status: 500 });
  }
}
