"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Star, MessageSquarePlus, Check, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useLogin } from "@/components/auth/LoginProvider";
import { useI18n } from "@/lib/i18n";
import { SERVICE_REVIEW_SLUG } from "@/lib/insurers";

// «Залишити відгук про сервіс» у секції відгуків: кнопка → інлайн-форма (зірки +
// текст). Гість — спершу вхід. Відгук може лишити клієнт із хоча б одним полісом
// (перевіряє сервер). Після публікації батько підвантажує список заново.

function Stars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const { t } = useI18n();
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} className="transition-transform hover:scale-110" aria-label={t({ uk: `${n} з 5`, en: `${n} of 5` })}>
          <Star className={`h-6 w-6 ${n <= value ? "fill-amber-400 text-amber-400" : "text-zinc-300 dark:text-zinc-600"}`} />
        </button>
      ))}
    </span>
  );
}

export function ServiceReviewForm({ onPublished }: { onPublished?: () => void }) {
  const { t } = useI18n();
  const { status } = useSession();
  const { open: openLogin } = useLogin();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const start = () => {
    if (status !== "authenticated") { openLogin(); return; }
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (rating < 1) { setError(t({ uk: "Оберіть оцінку", en: "Choose a rating" })); return; }
    if (text.trim().length < 10) { setError(t({ uk: "Відгук замалий (мін. 10 символів)", en: "Review is too short (min. 10 characters)" })); return; }
    setBusy(true); setError(null);
    try {
      const r = await fetch("/api/reviews", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ insurer: SERVICE_REVIEW_SLUG, rating, text: text.trim() }) });
      const json = await r.json().catch(() => ({}));
      if (!json?.success) throw new Error(json?.error ?? t({ uk: "Помилка", en: "Error" }));
      setDone(true); setOpen(false); setText(""); setRating(0);
      onPublished?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : t({ uk: "Помилка", en: "Error" }));
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
        <Check className="h-4 w-4" />{t({ uk: "Дякуємо! Ваш відгук опубліковано.", en: "Thank you! Your review is published." })}
      </span>
    );
  }

  if (!open) {
    return (
      <Button variant="outline" size="md" className="flex items-center gap-2" onClick={start}>
        <MessageSquarePlus className="h-4 w-4" />{t({ uk: "Залишити відгук", en: "Leave a review" })}
      </Button>
    );
  }

  return (
    <form onSubmit={submit} className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-5 text-left shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{t({ uk: "Відгук про volya.finance", en: "Review of volya.finance" })}</p>
        <button type="button" onClick={() => setOpen(false)} aria-label={t({ uk: "Закрити", en: "Close" })} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"><X className="h-4 w-4" /></button>
      </div>
      <div className="mb-3 flex items-center gap-3">
        <span className="text-sm text-zinc-600 dark:text-zinc-300">{t({ uk: "Ваша оцінка:", en: "Your rating:" })}</span>
        <Stars value={rating} onChange={setRating} />
      </div>
      <textarea
        value={text} onChange={(e) => setText(e.target.value)} rows={4} maxLength={2000}
        aria-label={t({ uk: "Ваш відгук", en: "Your review" })}
        placeholder={t({ uk: "Як пройшло оформлення, оплата, чи допомогла підтримка…", en: "How did the checkout, payment and support go…" })}
        className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button type="submit" variant="primary" size="md" loading={busy}>{t({ uk: "Опублікувати", en: "Publish" })}</Button>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">{t({ uk: "Відгук може лишити клієнт, який оформив у нас хоча б один поліс.", en: "Reviews can be left by clients who bought at least one policy from us." })}</p>
      </div>
    </form>
  );
}
