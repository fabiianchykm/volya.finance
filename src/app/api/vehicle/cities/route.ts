import { NextRequest, NextResponse } from "next/server";
import { ukaskoService } from "@/services/ukasko";
import { guardRequest } from "@/lib/api-guard";

// Кешуємо міста в пам'яті процесу — один раз за сесію сервера
let citiesCache: Awaited<ReturnType<typeof ukaskoService.getCities>> | null = null;

// Прибирає технічний суфікс "(зона 5)" з назви міста (для показу користувачу).
const stripZone = (s?: string): string => (s ?? "").replace(/\s*\(зона\s*\d+\)\s*$/i, "").trim();

export async function GET(req: NextRequest) {
  try {
    // Автокомпліт — викликається на кожне натискання, тож ліміт вищий.
    const blocked = guardRequest(req, { name: "cities", limit: 60, windowMs: 10 * 60 * 1000 });
    if (blocked) return blocked;

    const q = req.nextUrl.searchParams.get("q")?.toLowerCase().trim() ?? "";
    if (q.length < 2) return NextResponse.json({ success: true, data: [] });

    if (!citiesCache) {
      citiesCache = await ukaskoService.getCities();
    }

    const filtered = citiesCache
      .filter((c) => {
        const nameUa = c.name_ua?.toLowerCase() ?? "";
        const nameFull = c.name_full_name_ua?.toLowerCase() ?? "";
        return nameUa.startsWith(q) || nameFull.includes(q);
      })
      .slice(0, 10)
      // Прибираємо технічний суфікс "(зона N)" з довідника — користувач його бачити не має.
      .map((c) => ({
        ...c,
        name_ua: stripZone(c.name_ua),
        name_full_name_ua: stripZone(c.name_full_name_ua),
      }));

    return NextResponse.json({ success: true, data: filtered });
  } catch (e) {
    citiesCache = null;
    console.error("[cities] ERROR:", e instanceof Error ? e.message : e);
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Error" }, { status: 500 });
  }
}
