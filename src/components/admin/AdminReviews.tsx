"use client";

import { useEffect, useState } from "react";
import { Star, Trash2, Loader2 } from "lucide-react";
import { getInsurer } from "@/lib/insurers";

interface AdminReview {
  id: number;
  insurer: string;
  email: string;
  authorName: string | null;
  rating: number;
  text: string;
  product: string | null;
  createdAt: string;
}

export function AdminReviews() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/reviews");
        const json = await res.json();
        if (json.success) setReviews(json.reviews);
        else setError(json.error ?? "Помилка");
      } catch {
        setError("Помилка завантаження");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const remove = async (id: number) => {
    if (!confirm("Видалити цей відгук?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/reviews?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) setReviews((rs) => rs.filter((r) => r.id !== id));
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return <div className="flex items-center gap-2 text-sm text-zinc-400"><Loader2 className="h-4 w-4 animate-spin" /> Завантаження…</div>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (reviews.length === 0) return <p className="text-sm text-zinc-500">Відгуків ще немає.</p>;

  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-500">Усього відгуків: {reviews.length}</p>
      {reviews.map((r) => (
        <div key={r.id} className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                {getInsurer(r.insurer)?.name ?? r.insurer}
              </span>
              <span className="inline-flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className={`h-3.5 w-3.5 ${n <= r.rating ? "fill-amber-400 text-amber-400" : "text-zinc-300"}`} />
                ))}
              </span>
            </div>
            <button
              type="button"
              onClick={() => remove(r.id)}
              disabled={deleting === r.id}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
            >
              {deleting === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              Видалити
            </button>
          </div>
          <p className="text-sm leading-relaxed text-zinc-700">{r.text}</p>
          <p className="mt-2 text-xs text-zinc-400">
            {r.authorName || "—"} · {r.email}
            {r.product ? ` · ${r.product}` : ""} · {new Date(r.createdAt).toLocaleString("uk-UA")}
          </p>
        </div>
      ))}
    </div>
  );
}
