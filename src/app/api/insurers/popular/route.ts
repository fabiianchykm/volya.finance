import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { assertSameOrigin } from "@/lib/api-guard";
import { insurerSlug, type InsurerPopularity } from "@/lib/offer-ranking";

// Популярність страхових серед клієнтів volya.finance: скільки полісів кожної СК
// оформлено за останні 12 місяців (усі продукти — це сигнал довіри до бренду, бо
// по новому продукту полісів ще може не бути). Жодних персональних даних — лише
// лічильники за slug СК. Кеш у процесі 10 хв + CDN s-maxage.

let memo: { at: number; counts: InsurerPopularity; total: number } | null = null;
const TTL_MS = 10 * 60 * 1000;

export async function GET(req: NextRequest) {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;

  if (!memo || Date.now() - memo.at > TTL_MS) {
    const counts: InsurerPopularity = {};
    let total = 0;
    if (sql) {
      try {
        const rows = await sql<{ company: string | null; n: number }[]>`
          SELECT company, COUNT(*)::int AS n FROM policies
          WHERE company IS NOT NULL AND created_at > now() - interval '365 days'
          GROUP BY company
        `;
        for (const r of rows) {
          const slug = insurerSlug(r.company);
          if (!slug) continue;
          counts[slug] = (counts[slug] ?? 0) + Number(r.n);
          total += Number(r.n);
        }
      } catch (e) {
        console.error("[insurers/popular]", e instanceof Error ? e.message : e);
      }
    }
    memo = { at: Date.now(), counts, total };
  }
  return NextResponse.json({ counts: memo.counts, total: memo.total }, { headers: { "Cache-Control": "public, max-age=300, s-maxage=600" } });
}
