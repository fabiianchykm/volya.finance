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

// Чи вже лишав цей email відгук про цю СК (щоб один відгук на людину).
export async function hasReviewed(insurer: string, email: string): Promise<boolean> {
  if (!sql) return false;
  await ensureSchema();
  const rows = await sql`
    SELECT 1 FROM insurer_reviews WHERE insurer = ${insurer} AND email = ${email.trim().toLowerCase()} LIMIT 1
  `;
  return rows.length > 0;
}
