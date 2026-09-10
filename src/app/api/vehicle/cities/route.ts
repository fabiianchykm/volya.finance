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

    // РАНЖУВАННЯ, а не просто фільтр+обрізка. Раніше було `nameFull.includes(q)` +
    // `slice(0,10)` без сортування → на запит «ковель» усі села «Ковельського р-ну»
    // (їх повна назва містить «ковель») витісняли саме місто Ковель за топ-10. Тепер
    // збіг за НАЗВОЮ міста (name_ua) пріоритетніший за збіг у повній назві (район).
    const scored = citiesCache
      .map((c) => {
        const nameUa = c.name_ua?.toLowerCase() ?? "";
        const nameFull = c.name_full_name_ua?.toLowerCase() ?? "";
        let score = -1;
        if (nameUa === q) score = 0;              // точний збіг назви міста
        else if (nameUa.startsWith(q)) score = 1; // назва починається з запиту
        else if (nameFull.startsWith(q)) score = 2;
        else if (nameUa.includes(q)) score = 3;
        else if (nameFull.includes(q)) score = 4; // лише в повній назві (напр. район)
        return { c, score, nameUa };
      })
      .filter((x) => x.score >= 0)
      // За однакового score — коротша назва й алфавіт (місто «Ковель» вище за довші).
      .sort((a, b) => a.score - b.score || a.nameUa.length - b.nameUa.length || a.nameUa.localeCompare(b.nameUa))
      .slice(0, 10)
      // Прибираємо технічний суфікс "(зона N)" з довідника — користувач його бачити не має.
      .map(({ c }) => ({
        ...c,
        name_ua: stripZone(c.name_ua),
        name_full_name_ua: stripZone(c.name_full_name_ua),
      }));

    return NextResponse.json({ success: true, data: scored });
  } catch (e) {
    citiesCache = null;
    console.error("[cities] ERROR:", e instanceof Error ? e.message : e);
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Error" }, { status: 500 });
  }
}
