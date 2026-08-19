import { sql, ensureSchema } from "@/lib/db";

// Воронка: прорахунки (calc_leads) → почали оформлення (leads) → купили (policies).
// Різні таблиці зберігають продукт по-різному (calc_leads/policies — "osago";
// leads — "Автоцивілка"), тож зводимо до канонічного ключа.

export interface FunnelRow {
  product: string;      // канонічний ключ (osago, greencard…)
  label: string;        // людська назва
  calcRuns: number;     // прорахунки (сума повторів)
  calcVisitors: number; // унікальні відвідувачі, що рахували
  leads: number;        // почали оформлення (дійшли до OTP/оплати)
  policies: number;     // купили поліс
}

export interface FunnelTotals {
  calc: number;
  leads: number;
  policies: number;
}

const LABEL: Record<string, string> = {
  osago: "Автоцивілка", kasko: "КАСКО", "mini-kasko": "Міні-КАСКО",
  greencard: "Зелена карта", tourism: "Туристичне", pets: "Тварини", housing: "Житло",
};
// Зворотне зіставлення людських назв лідів → канонічний ключ.
const KEY_BY_LABEL: Record<string, string> = {
  "автоцивілка": "osago", "каско": "kasko", "міні-каско": "mini-kasko",
  "зелена карта": "greencard", "туристичне": "tourism", "тварини": "pets", "житло": "housing",
};
function leadKey(product: string | null): string {
  const p = (product ?? "").trim().toLowerCase();
  return KEY_BY_LABEL[p] ?? p;
}

export async function getFunnel(): Promise<{ rows: FunnelRow[]; totals: FunnelTotals }> {
  const empty = { rows: [], totals: { calc: 0, leads: 0, policies: 0 } };
  if (!sql) return empty;
  await ensureSchema();

  const [calc, leads, policies] = await Promise.all([
    sql<{ product: string; runs: string; visitors: string }[]>`
      SELECT product, COALESCE(SUM(count),0) AS runs, COUNT(DISTINCT NULLIF(visitor,'')) AS visitors
      FROM calc_leads GROUP BY product`,
    sql<{ product: string | null; n: string }[]>`
      SELECT product, COUNT(*) AS n FROM leads GROUP BY product`,
    sql<{ product: string | null; n: string }[]>`
      SELECT product, COUNT(*) AS n FROM policies GROUP BY product`,
  ]);

  const map = new Map<string, FunnelRow>();
  const row = (key: string): FunnelRow => {
    const k = key || "?";
    if (!map.has(k)) map.set(k, { product: k, label: LABEL[k] ?? k, calcRuns: 0, calcVisitors: 0, leads: 0, policies: 0 });
    return map.get(k)!;
  };

  for (const r of calc) { const x = row(r.product); x.calcRuns += Number(r.runs); x.calcVisitors += Number(r.visitors); }
  for (const r of leads) { row(leadKey(r.product)).leads += Number(r.n); }
  for (const r of policies) { row(r.product ?? "?").policies += Number(r.n); }

  const rows = [...map.values()].sort((a, b) => b.calcRuns - a.calcRuns || b.leads - a.leads);
  const totals: FunnelTotals = {
    calc: rows.reduce((s, r) => s + r.calcRuns, 0),
    leads: rows.reduce((s, r) => s + r.leads, 0),
    policies: rows.reduce((s, r) => s + r.policies, 0),
  };
  return { rows, totals };
}
