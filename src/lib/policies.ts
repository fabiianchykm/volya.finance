import { sql, ensureSchema } from "./db";

// Поліс, привʼязаний до email клієнта. Звʼязок з акаунтом — за email: після входу
// через Google показуємо поліси, де email == email акаунта (навіть якщо купували гостем).

export interface PolicyVehicle {
  mark?: string;
  model?: string;
  year?: number;
  plate?: string;
}

export interface PolicyRecord {
  id: string;
  email: string;
  contractId: string | null;
  orderId: string | null;
  company: string | null;
  vehicle: PolicyVehicle;
  price: number | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

export interface SavePolicyInput {
  /** Унікальний ключ полісу (contractId, або orderId якщо контракту ще нема). */
  id: string;
  email: string;
  contractId?: string | null;
  orderId?: string | null;
  company?: string | null;
  vehicle?: PolicyVehicle;
  price?: number | null;
  startDate?: string | null;
  endDate?: string | null;
}

export async function savePolicy(p: SavePolicyInput): Promise<void> {
  if (!sql) return; // БД не налаштована — тихо пропускаємо
  await ensureSchema();
  const email = p.email.trim().toLowerCase();
  await sql`
    INSERT INTO policies (id, email, contract_id, order_id, company, vehicle, price, start_date, end_date)
    VALUES (
      ${p.id}, ${email}, ${p.contractId ?? null}, ${p.orderId ?? null}, ${p.company ?? null},
      ${sql.json(JSON.parse(JSON.stringify(p.vehicle ?? {})))}, ${p.price ?? null},
      ${p.startDate ?? null}, ${p.endDate ?? null}
    )
    ON CONFLICT (id) DO UPDATE SET
      contract_id = EXCLUDED.contract_id,
      company     = EXCLUDED.company,
      vehicle     = EXCLUDED.vehicle,
      price       = EXCLUDED.price,
      start_date  = EXCLUDED.start_date,
      end_date    = EXCLUDED.end_date
  `;
}

export async function getPoliciesByEmail(email: string): Promise<PolicyRecord[]> {
  if (!sql) return [];
  await ensureSchema();
  const e = email.trim().toLowerCase();
  const rows = await sql<Array<{
    id: string;
    email: string;
    contract_id: string | null;
    order_id: string | null;
    company: string | null;
    vehicle: PolicyVehicle | null;
    price: string | null;
    start_date: string | null;
    end_date: string | null;
    created_at: Date;
  }>>`
    SELECT id, email, contract_id, order_id, company, vehicle, price, start_date, end_date, created_at
    FROM policies
    WHERE lower(email) = ${e}
    ORDER BY created_at DESC
  `;
  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    contractId: r.contract_id,
    orderId: r.order_id,
    company: r.company,
    vehicle: r.vehicle ?? {},
    price: r.price !== null ? Number(r.price) : null,
    startDate: r.start_date,
    endDate: r.end_date,
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
  }));
}
