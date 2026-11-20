import { sql, ensureSchema } from "@/lib/db";

export interface Review {
  id: number;
  insurer: string;
  authorName: string | null;
  rating: number;
  text: string;
  product: string | null;
  createdAt: string;
}

export interface ReviewsSummary {
  reviews: Review[];
  count: number;
  average: number; // 0 якщо відгуків нема
}

export async function getReviews(insurer: string): Promise<ReviewsSummary> {
  if (!sql) return { reviews: [], count: 0, average: 0 };
  await ensureSchema();
  const rows = await sql`
    SELECT id, insurer, author_name, rating, text, product, created_at
    FROM insurer_reviews WHERE insurer = ${insurer} ORDER BY created_at DESC LIMIT 100
  `;
  const reviews: Review[] = rows.map((r) => ({
    id: Number(r.id),
    insurer: r.insurer as string,
    authorName: (r.author_name as string) ?? null,
    rating: Number(r.rating),
    text: r.text as string,
    product: (r.product as string) ?? null,
    createdAt: (r.created_at as Date).toISOString?.() ?? String(r.created_at),
  }));
  const count = reviews.length;
  const average = count ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10 : 0;
  return { reviews, count, average };
}

export async function saveReview(r: {
  insurer: string; email: string; authorName: string | null; rating: number; text: string; product: string | null;
}): Promise<void> {
  if (!sql) return;
  await ensureSchema();
  await sql`
    INSERT INTO insurer_reviews (insurer, email, author_name, rating, text, product)
    VALUES (${r.insurer}, ${r.email.trim().toLowerCase()}, ${r.authorName}, ${r.rating}, ${r.text}, ${r.product})
  `;
}

// ── Адмінка ──────────────────────────────────────────────────────────────
export interface AdminReview extends Review {
  email: string;
}

export async function getAllReviews(limit = 300): Promise<AdminReview[]> {
  if (!sql) return [];
  await ensureSchema();
  const rows = await sql`
    SELECT id, insurer, email, author_name, rating, text, product, created_at
    FROM insurer_reviews ORDER BY created_at DESC LIMIT ${limit}
  `;
  return rows.map((r) => ({
    id: Number(r.id),
    insurer: r.insurer as string,
    email: r.email as string,
    authorName: (r.author_name as string) ?? null,
    rating: Number(r.rating),
    text: r.text as string,
    product: (r.product as string) ?? null,
    createdAt: (r.created_at as Date).toISOString?.() ?? String(r.created_at),
  }));
}

export async function deleteReview(id: number): Promise<boolean> {
  if (!sql) return false;
  await ensureSchema();
  const res = await sql`DELETE FROM insurer_reviews WHERE id = ${id}`;
  return (res.count ?? 0) > 0;
}

// Чи вже лишав цей email відгук про цю СК (щоб один відгук на людину).
export async function hasReviewed(insurer: string, email: string): Promise<boolean> {
  if (!sql) return false;
  await ensureSchema();
  const rows = await sql`
    SELECT 1 FROM insurer_reviews WHERE insurer = ${insurer} AND email = ${email.trim().toLowerCase()} LIMIT 1
  `;
  return rows.length > 0;
}

// ── Кабінет: власні відгуки ──────────────────────────────────────────────
// Відгук привʼязаний до канонічного ключа акаунта (email або phone:+380…); у
// кабінеті шукаємо по ВСІХ ключах звʼязаних ідентичностей, щоб вхід за номером
// бачив відгуки, лишені після входу через Google, і навпаки.
export async function getReviewsByKeys(keys: string[]): Promise<Review[]> {
  if (!sql || keys.length === 0) return [];
  await ensureSchema();
  const norm = keys.map((k) => k.trim().toLowerCase());
  const rows = await sql`
    SELECT id, insurer, author_name, rating, text, product, created_at
    FROM insurer_reviews WHERE email = ANY(${norm}) ORDER BY created_at DESC LIMIT 100
  `;
  return rows.map((r) => ({
    id: Number(r.id),
    insurer: r.insurer as string,
    authorName: (r.author_name as string) ?? null,
    rating: Number(r.rating),
    text: r.text as string,
    product: (r.product as string) ?? null,
    createdAt: (r.created_at as Date).toISOString?.() ?? String(r.created_at),
  }));
}

export async function updateOwnReview(id: number, keys: string[], rating: number, text: string): Promise<boolean> {
  if (!sql || keys.length === 0) return false;
  await ensureSchema();
  const norm = keys.map((k) => k.trim().toLowerCase());
  const res = await sql`
    UPDATE insurer_reviews SET rating = ${rating}, text = ${text}
    WHERE id = ${id} AND email = ANY(${norm})
  `;
  return (res.count ?? 0) > 0;
}

export async function deleteOwnReview(id: number, keys: string[]): Promise<boolean> {
  if (!sql || keys.length === 0) return false;
  await ensureSchema();
  const norm = keys.map((k) => k.trim().toLowerCase());
  const res = await sql`DELETE FROM insurer_reviews WHERE id = ${id} AND email = ANY(${norm})`;
  return (res.count ?? 0) > 0;
}

// ── Зведення рейтингів для карток пропозицій ─────────────────────────────
export type ReviewSummaryMap = Record<string, { average: number; count: number }>;

export async function getReviewSummaries(): Promise<ReviewSummaryMap> {
  if (!sql) return {};
  await ensureSchema();
  const rows = await sql<{ insurer: string; avg: string; cnt: string }[]>`
    SELECT insurer, AVG(rating) AS avg, COUNT(*) AS cnt FROM insurer_reviews GROUP BY insurer
  `;
  const out: ReviewSummaryMap = {};
  for (const r of rows) out[r.insurer] = { average: Math.round(Number(r.avg) * 10) / 10, count: Number(r.cnt) || 0 };
  return out;
}
