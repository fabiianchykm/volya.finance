"use client";

import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

// Можливість залишати відгуки ТИМЧАСОВО заморожена: кнопка неактивна, форма/логіка
// нижче збережені й активуються поверненням прапорця у false.
const REVIEWS_FROZEN = true;

interface Review {
  id: number;
  authorName: string | null;
  rating: number;
  text: string;
  product: string | null;
  createdAt: string;
}

function Stars({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={onChange ? "transition-transform hover:scale-110" : "cursor-default"}
          aria-label={`${n} з 5`}
        >
          <Star className={`h-5 w-5 ${n <= value ? "fill-amber-400 text-amber-400" : "text-zinc-300"}`} />
        </button>
      ))}
    </span>
  );
}

export function InsurerReviews({ slug, name }: { slug: string; name: string }) {
  const { status } = useSession();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [average, setAverage] = useState(0);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const load = async () => {
    try {
      const res = await fetch(`/api/reviews?insurer=${encodeURIComponent(slug)}`);
      const json = await res.json();
      if (json.success) { setReviews(json.reviews); setAverage(json.average); setCount(json.count); }
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (rating < 1) { setError("Оберіть оцінку (зірки)"); return; }
    if (text.trim().length < 10) { setError("Відгук замалий (мін. 10 символів)"); return; }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ insurer: slug, rating, text: text.trim() }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Помилка");
      setDone(true);
      setText(""); setRating(0);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Підсумок */}
      <div className="mb-5 flex items-center gap-3">
        <h2 className="text-xl font-bold text-zinc-900">Відгуки</h2>
        {count > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-zinc-800">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {average} <span className="font-normal text-zinc-500">· {count}</span>
          </span>
        )}
      </div>

      {/* Форма */}
      <div className="mb-6 rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
        {REVIEWS_FROZEN ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-zinc-600">Можливість залишати відгуки скоро зʼявиться.</p>
            <Button variant="primary" size="md" disabled className="cursor-not-allowed opacity-60">
              Залишити відгук
            </Button>
          </div>
        ) : done ? (
          <p className="text-sm font-medium text-emerald-600">Дякуємо! Ваш відгук опубліковано.</p>
        ) : status !== "authenticated" ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-zinc-600">Залишити відгук може клієнт, який оформив поліс {name} у нас.</p>
            <Button variant="primary" size="md" onClick={() => signIn("google")}>Увійти, щоб залишити відгук</Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-zinc-600">Ваша оцінка:</span>
              <Stars value={rating} onChange={setRating} />
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Поділіться досвідом зі страховою ${name}…`}
              rows={4}
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" variant="primary" size="md" loading={submitting}>Опублікувати відгук</Button>
            <p className="text-xs text-zinc-400">Відгук доступний лише якщо ви купили поліс цієї страхової на нашому сайті.</p>
          </form>
        )}
      </div>

      {/* Список */}
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-zinc-400"><Loader2 className="h-4 w-4 animate-spin" /> Завантаження…</div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-zinc-500">Ще немає відгуків. Будьте першим!</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-zinc-900">{r.authorName || "Клієнт"}</span>
                <Stars value={r.rating} />
              </div>
              <p className="text-sm leading-relaxed text-zinc-700">{r.text}</p>
              {r.product && <p className="mt-2 text-xs text-zinc-400">Продукт: {r.product}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
