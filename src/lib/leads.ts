import { sql, ensureSchema } from "@/lib/db";

// Ліди воронки: клієнт заповнив дані й перейшов до підтвердження (OTP/оплата).
// Джерело правди для передзвону — показуються на /admin/leads, дублюються пінгом
// у sales-Telegram. Статус: new → called → converted → lost.

export type LeadStatus = "new" | "called" | "converted" | "lost";

export interface Lead {
  id: number;
  product: string | null;
  customerName: string | null;
  phone: string | null;
  email: string | null;
  company: string | null;
  price: number | null;
  car: string | null;
  stage: string | null;
  status: LeadStatus;
  createdAt: string;
}

export interface NewLead {
  product?: string | null;
  customerName?: string | null;
  phone?: string | null;
  email?: string | null;
  company?: string | null;
  price?: number | null;
  car?: string | null;
  stage?: string | null;
}

function mapRow(r: Record<string, unknown>): Lead {
  return {
    id: Number(r.id),
    product: (r.product as string) ?? null,
    customerName: (r.customer_name as string) ?? null,
    phone: (r.phone as string) ?? null,
    email: (r.email as string) ?? null,
    company: (r.company as string) ?? null,
    price: r.price != null ? Number(r.price) : null,
    car: (r.car as string) ?? null,
    stage: (r.stage as string) ?? null,
    status: ((r.status as string) ?? "new") as LeadStatus,
    createdAt: (r.created_at as Date)?.toISOString?.() ?? String(r.created_at),
  };
}

/** Зберегти лід. Повертає id (або null, якщо БД не сконфігурована). */
export async function saveLead(l: NewLead): Promise<number | null> {
  if (!sql) return null;
  await ensureSchema();
  const [row] = await sql<{ id: number }[]>`
    INSERT INTO leads (product, customer_name, phone, email, company, price, car, stage)
    VALUES (${l.product ?? null}, ${l.customerName ?? null}, ${l.phone ?? null}, ${l.email ?? null},
            ${l.company ?? null}, ${l.price ?? null}, ${l.car ?? null}, ${l.stage ?? null})
    RETURNING id
  `;
  return row ? Number(row.id) : null;
}

/** Останні ліди (для адмінки). */
export async function getLeads(limit = 200): Promise<Lead[]> {
  if (!sql) return [];
  await ensureSchema();
  const rows = await sql`SELECT * FROM leads ORDER BY created_at DESC LIMIT ${limit}`;
  return rows.map((r) => mapRow(r as Record<string, unknown>));
}

export async function updateLeadStatus(id: number, status: LeadStatus): Promise<void> {
  if (!sql) return;
  await ensureSchema();
  await sql`UPDATE leads SET status = ${status} WHERE id = ${id}`;
}

export async function deleteLead(id: number): Promise<void> {
  if (!sql) return;
  await ensureSchema();
  await sql`DELETE FROM leads WHERE id = ${id}`;
}
