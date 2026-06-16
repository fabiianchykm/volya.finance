import { NextRequest, NextResponse } from "next/server";
import { ukaskoService } from "@/services/ukasko";
import { guardRequest } from "@/lib/api-guard";

// Кешуємо міста в пам'яті процесу — один раз за сесію сервера
let citiesCache: Awaited<ReturnType<typeof ukaskoService.getCities>> | null = null;

export async function GET(req: NextRequest) {
  try {
    // Автокомпліт — викликається на кожне натискання, тож ліміт вищий.
    const blocked = guardRequest(req, { name: "cities", limit: 60, windowMs: 10 * 60 * 1000 });
    if (blocked) return blocked;

    const q = req.nextUrl.searchParams.get("q")?.toLowerCase().trim() ?? "";
    if (q.length < 2) return NextResponse.json({ success: true, data: [] });

    if (!citiesCache) {
      console.log("[cities] fetching from Ukasko...");
      citiesCache = await ukaskoService.getCities();
      console.log("[cities] cached", citiesCache.length, "cities");
    }

    const filtered = citiesCache
      .filter((c) => {
        const nameUa = c.name_ua?.toLowerCase() ?? "";
        const nameFull = c.name_full_name_ua?.toLowerCase() ?? "";
        return nameUa.startsWith(q) || nameFull.includes(q);
      })
      .slice(0, 10);

    return NextResponse.json({ success: true, data: filtered });
  } catch (e) {
    citiesCache = null;
    console.error("[cities] ERROR:", e instanceof Error ? e.message : e);
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Error" }, { status: 500 });
  }
}
