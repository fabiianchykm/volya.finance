// Блог + новини. Дописи зберігаються тут (простий контент-масив — без CMS/БД).
// Додати допис = дописати обʼєкт у POSTS. Контент — абзаци (порожній рядок = новий
// абзац); рядок, що починається з "## " — підзаголовок; "- " — пункт списку.

export type PostCategory = "blog" | "news";

export interface Post {
  slug: string;
  title: string;
  excerpt: string;
  date: string;            // "YYYY-MM-DD"
  category: PostCategory;
  readingMinutes?: number;
  content: string;
}

export const CATEGORY_LABEL: Record<PostCategory, string> = {
  blog: "Стаття",
  news: "Новина",
};

// Поки порожньо. Щоб додати допис — дописати обʼєкт за прикладом:
//   { slug, title, excerpt, date: "YYYY-MM-DD", category: "blog" | "news",
//     readingMinutes?, content } (у content: порожній рядок = абзац, "## " =
//     підзаголовок, "- " = пункт списку).
const POSTS: Post[] = [];

export function getPosts(category?: PostCategory): Post[] {
  // Найновіші зверху; опційно фільтр за категорією (blog | news).
  return [...POSTS]
    .filter((p) => !category || p.category === category)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPost(slug: string): Post | null {
  return POSTS.find((p) => p.slug === slug) ?? null;
}

export function formatPostDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return date;
  const months = ["січня", "лютого", "березня", "квітня", "травня", "червня", "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"];
  return `${d} ${months[m - 1]} ${y}`;
}
