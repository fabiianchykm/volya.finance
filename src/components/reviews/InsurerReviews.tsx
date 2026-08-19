"use client";

import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n";

// Можливість залишати відгуки: false → активна (форма для клієнтів, що купили поліс).
const REVIEWS_FROZEN = false;

interface Review {
  id: number;
  authorName: string | null;
  rating: number;
  text: string;
  product: string | null;
  createdAt: string;
}

function Stars({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const { t } = useI18n();
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={onChange ? "transition-transform hover:scale-110" : "cursor-default"}
          aria-label={t({ uk: `${n} з 5`, en: `${n} of 5` })}
        >
          <Star className={`h-5 w-5 ${n <= value ? "fill-amber-400 text-amber-400" : "text-zinc-300"}`} />
        </button>
      ))}
    </span>
  );
}

export function InsurerReviews({ slug, name }: { slug: string; name: string }) {
  const { status } = useSession();
  const { t } = useI18n();
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
    if (rating < 1) { setError(t({ uk: "Оберіть оцінку (зірки)", en: "Choose a rating (stars)" })); return; }
    if (text.trim().length < 10) { setError(t({ uk: "Відгук замалий (мін. 10 символів)", en: "Review is too short (min. 10 characters)" })); return; }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ insurer: slug, rating, text: text.trim() }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? t({ uk: "Помилка", en: "Error" }));
      setDone(true);
      setText(""); setRating(0);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t({ uk: "Помилка", en: "Error" }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Підсумок */}
      <div className="mb-5 flex items-center gap-3">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{t({ uk: "Відгуки", en: "Reviews" })}</h2>
        {count > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 px-3 py-1 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {average} <span className="font-normal text-zinc-500 dark:text-zinc-400">· {count}</span>
          </span>
        )}
      </div>

      {/* Форма */}
      <div className="mb-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
        {REVIEWS_FROZEN ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-zinc-600 dark:text-zinc-300">{t({ uk: "Можливість залишати відгуки скоро зʼявиться.", en: "The ability to leave reviews will be available soon." })}</p>
            <Button variant="primary" size="md" disabled className="cursor-not-allowed opacity-60">
              {t({ uk: "Залишити відгук", en: "Leave a review" })}
            </Button>
          </div>
        ) : done ? (
          <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{t({ uk: "Дякуємо! Ваш відгук опубліковано.", en: "Thank you! Your review has been published." })}</p>
        ) : status !== "authenticated" ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-zinc-600 dark:text-zinc-300">{t({ uk: "Залишити відгук може клієнт, який оформив поліс", en: "A review can be left by a client who bought a" })} {name} {t({ uk: "у нас.", en: "policy from us." })}</p>
            <Button variant="primary" size="md" onClick={() => signIn("google")}>{t({ uk: "Увійти, щоб залишити відгук", en: "Sign in to leave a review" })}</Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-zinc-600 dark:text-zinc-300">{t({ uk: "Ваша оцінка:", en: "Your rating:" })}</span>
              <Stars value={rating} onChange={setRating} />
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              aria-label={t({ uk: "Ваш відгук", en: "Your review" })}
              placeholder={t({ uk: `Поділіться досвідом зі страховою ${name}…`, en: `Share your experience with ${name}…` })}
              rows={4}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" variant="primary" size="md" loading={submitting}>{t({ uk: "Опублікувати відгук", en: "Publish review" })}</Button>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">{t({ uk: "Відгук доступний лише якщо ви купили поліс цієї страхової на нашому сайті.", en: "Reviews are available only if you bought a policy from this insurer on our site." })}</p>
          </form>
        )}
      </div>

      {/* Список */}
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-zinc-400 dark:text-zinc-500"><Loader2 className="h-4 w-4 animate-spin" /> {t({ uk: "Завантаження…", en: "Loading…" })}</div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{t({ uk: "Ще немає відгуків. Будьте першим!", en: "No reviews yet. Be the first!" })}</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{r.authorName || t({ uk: "Клієнт", en: "Client" })}</span>
                <Stars value={r.rating} />
              </div>
              <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">{r.text}</p>
              {r.product && <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">{t({ uk: "Продукт:", en: "Product:" })} {r.product}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
