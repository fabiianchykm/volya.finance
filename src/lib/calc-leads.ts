import { sql, ensureSchema } from "@/lib/db";

// Прорахунки на калькуляторі (лід-до-оформлення). Зберігаємо продукт + параметри
// (напр. номер авто для ОСЦПВ, країну/дати для туризму), щоб бачити реальний попит
// і мати за що «зачепитись» у ремаркетингу — навіть якщо людина не дійшла до оформлення.

export interface CalcLead {
  id: number;
  product: string;
  paramKey: string;
  params: Record<string, unknown> | null;
  visitor: string;
  count: number;
  createdAt: string;
  updatedAt: string;
}

const jsonOf = (v: unknown) => sql!.json(JSON.parse(JSON.stringify(v ?? {})));

// Стабільний ключ параметрів для дедуплікації (той самий прорахунок → та сама строка).
function paramKeyOf(params: Record<string, unknown>): string {
  try {
    return Object.keys(params).sort().map((k) => `${k}=${String(params[k])}`).join("&").slice(0, 500);
  } catch {
    return "";
  }
}

export async function saveCalcLead(input: {
  product: string;
  params: Record<string, unknown>;
  visitor?: string | null;
}): Promise<void> {
  if (!sql) return;
  await ensureSchema();
  const product = String(input.product || "").slice(0, 40);
  if (!product) return;
  const params = input.params ?? {};
  const key = paramKeyOf(params);
  const visitor = String(input.visitor ?? "").slice(0, 64);
  await sql`
    INSERT INTO calc_leads (product, param_key, params, visitor)
    VALUES (${product}, ${key}, ${jsonOf(params)}, ${visitor})
    ON CONFLICT (visitor, product, param_key) DO UPDATE SET
      count = calc_leads.count + 1,
      params = EXCLUDED.params,
      updated_at = now()
  `;
}

export async function getCalcLeads(limit = 300): Promise<CalcLead[]> {
  if (!sql) return [];
  await ensureSchema();
  const rows = await sql<{
    id: number; product: string; param_key: string; params: Record<string, unknown> | null;
    visitor: string; count: number; created_at: Date; updated_at: Date;
  }[]>`
    SELECT id, product, param_key, params, visitor, count, created_at, updated_at
    FROM calc_leads ORDER BY updated_at DESC LIMIT ${limit}
  `;
  return rows.map((r) => ({
    id: r.id,
    product: r.product,
    paramKey: r.param_key,
    params: r.params,
    visitor: r.visitor,
    count: r.count,
    createdAt: (r.created_at instanceof Date ? r.created_at : new Date(r.created_at)).toISOString(),
    updatedAt: (r.updated_at instanceof Date ? r.updated_at : new Date(r.updated_at)).toISOString(),
  }));
}

// Агрегація по продуктах — для короткого зведення зверху адмінки.
export async function getCalcStats(): Promise<{ product: string; runs: number; visitors: number }[]> {
  if (!sql) return [];
  await ensureSchema();
  const rows = await sql<{ product: string; runs: string; visitors: string }[]>`
    SELECT product, COALESCE(SUM(count),0) AS runs, COUNT(DISTINCT NULLIF(visitor,'')) AS visitors
    FROM calc_leads GROUP BY product ORDER BY runs DESC
  `;
  return rows.map((r) => ({ product: r.product, runs: Number(r.runs), visitors: Number(r.visitors) }));
}
