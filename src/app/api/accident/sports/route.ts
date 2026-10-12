import { NextRequest, NextResponse } from "next/server";
import { guardRequest } from "@/lib/api-guard";
import { ukaskoService } from "@/services/ukasko";

// Автокомпліт видів спорту для калькулятора НВ (довідник Ukasko, ~175 позицій).
export async function GET(req: NextRequest) {
  const blocked = guardRequest(req, { name: "accident-sports", limit: 60, windowMs: 10 * 60 * 1000 });
  if (blocked) return blocked;
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 60);
  try {
    const data = await ukaskoService.getAccidentSports(q);
    return NextResponse.json({ success: true, data: data.map((s) => ({ code: s.code, name: s.name })) });
  } catch (e) {
    console.error("[accident sports] error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ success: false, error: "Довідник тимчасово недоступний" }, { status: 500 });
  }
}
