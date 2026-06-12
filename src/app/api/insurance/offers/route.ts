import { NextRequest, NextResponse } from "next/server";
import { ukaskoService } from "@/services/ukasko";
import type { CalculatorParams } from "@/types/api";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const params: CalculatorParams = {
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
      "customer[dateBirth]": searchParams.get("carBirthdayAt") ?? "01.01.1990",
      "car[birthdayAt]": searchParams.get("carBirthdayAt") ?? "01.01.1990",
    };

    console.log("[offers/route] params →", JSON.stringify(params));

    const data = await ukaskoService.getOffers(params);
    console.log("[offers/route] response → status=%s count=%s errorInfo=%s",
      data.status, data.count, JSON.stringify(data.errorInfo).slice(0, 200));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[offers/route] error →", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
