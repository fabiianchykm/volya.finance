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
  phone: string | null;
  customerName: string | null;
  customer: Record<string, unknown>;
  contractId: string | null;
  orderId: string | null;
  company: string | null;
  vehicle: PolicyVehicle;
  price: number | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  /** 'issued' — оформлений у нас; 'manual' — доданий клієнтом вручну. */
  source: string;
  /** Вид страхування (osago/kasko/greencard/tourism) — переважно для manual. */
  product: string | null;
  /** Номер полісу (для manual). */
  policyNumber: string | null;
}

export interface SavePolicyInput {
  /** Унікальний ключ полісу (contractId, або orderId якщо контракту ще нема). */
  id: string;
  email: string;
  phone?: string | null;
  customerName?: string | null;
  /** Повний об'єкт клієнта (ПІБ, ІПН, документ, адреса…) — зберігаємо як є. */
  customer?: Record<string, unknown> | null;
  contractId?: string | null;
  orderId?: string | null;
  company?: string | null;
  vehicle?: PolicyVehicle;
  price?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  source?: string | null;
  product?: string | null;
  policyNumber?: string | null;
}

// Приводить телефон до "+380XXXXXXXXX" (щоб збігалося зі входом за номером).
function normPhone(p?: string | null): string | null {
  if (!p) return null;
  let d = p.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("380")) d = d.slice(3);
  else if (d.length === 11 && d.startsWith("80")) d = d.slice(2);
  else if (d.length === 10 && d.startsWith("0")) d = d.slice(1);
  return d.length === 9 ? `+380${d}` : null;
}

const json = (v: unknown) => sql!.json(JSON.parse(JSON.stringify(v ?? {})));

export async function savePolicy(p: SavePolicyInput): Promise<void> {
  if (!sql) return; // БД не налаштована — тихо пропускаємо
  await ensureSchema();
  const email = p.email.trim().toLowerCase();
  const phone = normPhone(p.phone);
  await sql`
    INSERT INTO policies (id, email, phone, customer_name, customer, contract_id, order_id, company, vehicle, price, start_date, end_date, source, product, policy_number)
    VALUES (
      ${p.id}, ${email}, ${phone}, ${p.customerName ?? null}, ${json(p.customer)},
      ${p.contractId ?? null}, ${p.orderId ?? null}, ${p.company ?? null},
      ${json(p.vehicle)}, ${p.price ?? null}, ${p.startDate ?? null}, ${p.endDate ?? null},
      ${p.source ?? "issued"}, ${p.product ?? null}, ${p.policyNumber ?? null}
    )
    ON CONFLICT (id) DO UPDATE SET
      phone         = EXCLUDED.phone,
      customer_name = EXCLUDED.customer_name,
      customer      = EXCLUDED.customer,
      contract_id   = EXCLUDED.contract_id,
      company       = EXCLUDED.company,
      vehicle       = EXCLUDED.vehicle,
      price         = EXCLUDED.price,
      start_date    = EXCLUDED.start_date,
      end_date      = EXCLUDED.end_date,
      source        = EXCLUDED.source,
      product       = EXCLUDED.product,
      policy_number = EXCLUDED.policy_number
  `;
}

// Видалення полісу (лише manual) з перевіркою власника за email АБО phone.
export async function deletePolicy(id: string, owner: { email?: string | null; phone?: string | null }): Promise<boolean> {
  if (!sql) return false;
  await ensureSchema();
  const email = owner.email ? owner.email.trim().toLowerCase() : null;
  const phone = normPhone(owner.phone);
  if (!email && !phone) return false;
  const rows = await sql`
    DELETE FROM policies
    WHERE id = ${id} AND source = 'manual'
      AND (${email}::text IS NOT NULL AND lower(email) = ${email} OR ${phone}::text IS NOT NULL AND phone = ${phone})
    RETURNING id
  `;
  return rows.length > 0;
}

interface PolicyRow {
  id: string;
  email: string;
  phone: string | null;
  customer_name: string | null;
  customer: Record<string, unknown> | null;
  contract_id: string | null;
  order_id: string | null;
  company: string | null;
  vehicle: PolicyVehicle | null;
  price: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: Date;
  source: string | null;
  product: string | null;
  policy_number: string | null;
}

function mapRow(r: PolicyRow): PolicyRecord {
  return {
    id: r.id,
    email: r.email,
    phone: r.phone,
    customerName: r.customer_name,
    customer: r.customer ?? {},
    contractId: r.contract_id,
    orderId: r.order_id,
    company: r.company,
    vehicle: r.vehicle ?? {},
    price: r.price !== null ? Number(r.price) : null,
    startDate: r.start_date,
    endDate: r.end_date,
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
    source: r.source ?? "issued",
    product: r.product,
    policyNumber: r.policy_number,
  };
}

const SELECT_COLS = `id, email, phone, customer_name, customer, contract_id, order_id, company, vehicle, price, start_date, end_date, created_at, source, product, policy_number`;

export async function getPoliciesByEmail(email: string): Promise<PolicyRecord[]> {
  if (!sql) return [];
  await ensureSchema();
  const e = email.trim().toLowerCase();
  const rows = await sql<PolicyRow[]>`
    SELECT ${sql.unsafe(SELECT_COLS)} FROM policies WHERE lower(email) = ${e} ORDER BY created_at DESC
  `;
  return rows.map(mapRow);
}

export async function getPoliciesByPhone(phone: string): Promise<PolicyRecord[]> {
  if (!sql) return [];
  await ensureSchema();
  const p = normPhone(phone);
  if (!p) return [];
  const rows = await sql<PolicyRow[]>`
    SELECT ${sql.unsafe(SELECT_COLS)} FROM policies WHERE phone = ${p} ORDER BY created_at DESC
  `;
  return rows.map(mapRow);
}
