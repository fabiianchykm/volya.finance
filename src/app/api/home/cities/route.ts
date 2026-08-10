import { NextRequest, NextResponse } from "next/server";
import { ukaskoService } from "@/services/ukasko";
import { guardRequest } from "@/lib/api-guard";

// Довідник міст ЖИТЛА (окремий від загального /api/vehicle/cities).
export async function GET(req: NextRequest) {
  try {
    const blocked = guardRequest(req, { name: "home-cities", limit: 60, windowMs: 10 * 60 * 1000 });
    if (blocked) return blocked;
    const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
    if (q.length < 2) return NextResponse.json({ success: true, data: [] });
    const data = await ukaskoService.findHomeCities(q);
    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error("[home-cities] error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ success: false, error: "Error" }, { status: 500 });
  }
}
