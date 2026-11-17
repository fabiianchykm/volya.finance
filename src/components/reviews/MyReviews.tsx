"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star, Pencil, Trash2, Loader2, Check, X, MessageSquareHeart, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useI18n, type Tr } from "@/lib/i18n";
import type { Review } from "@/lib/reviews";

// Вкладка кабінету «Відгуки». Зверху — страхові, про які клієнт ще не писав
// (форма одразу в картці), нижче — його відгуки з редагуванням і видаленням.
// Усі зміни йдуть у /api/reviews (POST/PATCH/DELETE), після них router.refresh().

export interface MyReview extends Review {
  insurerName: string;
  logo: string | null;
}
export interface PendingInsurer {
  slug: string;
  name: string;
  logo: string | null;
  product: string | null;
}

const PRODUCT_LABELS: Record<string, Tr> = {
  osago: { uk: "Автоцивілка", en: "Car insurance" },
  greencard: { uk: "Зелена карта", en: "Green Card" },
  tourism: { uk: "Туристичне", en: "Travel" },
  housing: { uk: "Житло", en: "Property" },
  pets: { uk: "Тварини", en: "Pets" },
  accident: { uk: "Нещасний випадок", en: "Accident" },
  "mini-kasko": { uk: "Міні-КАСКО", en: "Mini-CASCO" },
  kasko: { uk: "КАСКО", en: "CASCO" },
};

function productLabel(p: string | null, t: (tr: Tr) => string): string | null {
  if (!p) return null;
  const tr = PRODUCT_LABELS[p];
  return tr ? t(tr) : p;
}

function Stars({ value, onChange, size = "h-5 w-5" }: { value: number; onChange?: (v: number) => void; size?: string }) {
  const { t } = useI18n();
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" disabled={!onChange} onClick={() => onChange?.(n)}
          className={onChange ? "transition-transform hover:scale-110" : "cursor-default"} aria-label={t({ uk: `${n} з 5`, en: `${n} of 5` })}>
          <Star className={`${size} ${n <= value ? "fill-amber-400 text-amber-400" : "text-zinc-300 dark:text-zinc-600"}`} />
        </button>
      ))}
    </span>
  );
}

function InsurerBadge({ logo, name }: { logo: string | null; name: string }) {
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-700">
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt={name} className="h-full w-full object-contain" />
      ) : (
        <span className="text-sm font-bold text-indigo-600">{name.slice(0, 2).toUpperCase()}</span>
      )}
    </span>
  );
}

// Спільна форма: створення (slug) або редагування (id).
function ReviewForm({ initialRating = 0, initialText = "", name, submitLabel, onSubmit, onCancel }: {
  initialRating?: number; initialText?: string; name: string; submitLabel: string;
  onSubmit: (rating: number, text: string) => Promise<void>; onCancel?: () => void;
}) {
  const { t } = useI18n();
  const [rating, setRating] = useState(initialRating);
  const [text, setText] = useState(initialText);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (rating < 1) { setError(t({ uk: "Оберіть оцінку", en: "Choose a rating" })); return; }
    if (text.trim().length < 10) { setError(t({ uk: "Відгук замалий (мін. 10 символів)", en: "Review is too short (min. 10 characters)" })); return; }
    setBusy(true); setError(null);
    try { await onSubmit(rating, text.trim()); }
    catch (err) { setError(err instanceof Error ? err.message : t({ uk: "Помилка", en: "Error" })); }
    finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="mt-3 space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-sm text-zinc-600 dark:text-zinc-300">{t({ uk: "Ваша оцінка:", en: "Your rating:" })}</span>
        <Stars value={rating} onChange={setRating} size="h-6 w-6" />
      </div>
      <textarea
        value={text} onChange={(e) => setText(e.target.value)} rows={4} maxLength={2000}
        aria-label={t({ uk: "Ваш відгук", en: "Your review" })}
        placeholder={t({ uk: `Поділіться досвідом зі страховою ${name}: як оформлювали, як платили, чи була виплата…`, en: `Share your experience with ${name}: purchase, payment, claims…` })}
        className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" variant="primary" size="md" loading={busy}>{submitLabel}</Button>
        {onCancel && <Button type="button" variant="outline" size="md" onClick={onCancel}>{t({ uk: "Скасувати", en: "Cancel" })}</Button>}
      </div>
    </form>
  );
}

export function MyReviews({ reviews, pending }: { reviews: MyReview[]; pending: PendingInsurer[] }) {
  const { t } = useI18n();
  const router = useRouter();
  const [openSlug, setOpenSlug] = useState<string | null>(pending.length === 1 ? pending[0].slug : null);
  const [editId, setEditId] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const api = async (method: "POST" | "PATCH" | "DELETE", body: Record<string, unknown>) => {
    const r = await fetch("/api/reviews", { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const json = await r.json().catch(() => ({}));
    if (!json?.success) throw new Error(json?.error ?? t({ uk: "Помилка", en: "Error" }));
  };

  const create = (slug: string) => async (rating: number, text: string) => {
    await api("POST", { insurer: slug, rating, text });
    setOpenSlug(null);
    setNotice(t({ uk: "Дякуємо! Відгук опубліковано на сторінці страхової.", en: "Thank you! Your review is published on the insurer page." }));
    router.refresh();
  };
  const update = (id: number) => async (rating: number, text: string) => {
    await api("PATCH", { id, rating, text });
    setEditId(null);
    setNotice(t({ uk: "Зміни збережено.", en: "Changes saved." }));
    router.refresh();
  };
  const remove = async (id: number) => {
    setBusyId(id);
    try {
      await api("DELETE", { id });
      setConfirmId(null);
      setNotice(t({ uk: "Відгук видалено.", en: "Review deleted." }));
      router.refresh();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : t({ uk: "Не вдалося видалити", en: "Could not delete" }));
    } finally {
      setBusyId(null);
    }
  };

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="space-y-8">
      {notice && (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          <span className="flex items-center gap-2"><Check className="h-4 w-4" />{notice}</span>
          <button type="button" onClick={() => setNotice(null)} aria-label={t({ uk: "Закрити", en: "Close" })}><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Страхові, про які ще не писали */}
      <section>
        <h2 className="mb-1 text-base font-bold text-zinc-900 dark:text-zinc-100">{t({ uk: "Оцініть свою страхову", en: "Rate your insurer" })}</h2>
        <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">
          {t({ uk: "Відгук може лишити лише клієнт, який купив поліс цієї страхової у нас. Він зʼявиться на сторінці страхової і допоможе іншим обрати.", en: "Only clients who bought this insurer's policy from us can leave a review. It appears on the insurer page and helps others choose." })}
        </p>
        {pending.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-white px-5 py-6 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <MessageSquareHeart className="mx-auto mb-2 h-7 w-7 text-indigo-400" />
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              {reviews.length > 0
                ? t({ uk: "Ви вже оцінили всі страхові зі своїх полісів. Дякуємо!", en: "You have rated every insurer from your policies. Thank you!" })
                : t({ uk: "Тут зʼявляться страхові з ваших полісів, щойно ви оформите перший.", en: "Insurers from your policies will appear here once you buy your first one." })}
            </p>
            {reviews.length === 0 && (
              <Link href="/osago" className="mt-3 inline-block text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400">{t({ uk: "Розрахувати автоцивілку →", en: "Get a car insurance quote →" })}</Link>
            )}
          </div>
        ) : (
          <ul className="space-y-3">
            {pending.map((p) => {
              const open = openSlug === p.slug;
              const prod = productLabel(p.product, t);
              return (
                <li key={p.slug} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
                  <div className="flex items-center gap-3">
                    <InsurerBadge logo={p.logo} name={p.name} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{p.name}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{prod ? t({ uk: `Ваш поліс: ${prod}`, en: `Your policy: ${prod}` }) : t({ uk: "Поліс, куплений у нас", en: "Policy bought from us" })}</p>
                    </div>
                    {!open && (
                      <Button variant="primary" size="sm" className="flex items-center gap-1.5" onClick={() => setOpenSlug(p.slug)}>
                        <Star className="h-4 w-4" />{t({ uk: "Оцінити", en: "Rate" })}
                      </Button>
                    )}
                  </div>
                  {open && (
                    <ReviewForm name={p.name} submitLabel={t({ uk: "Опублікувати відгук", en: "Publish review" })} onSubmit={create(p.slug)} onCancel={() => setOpenSlug(null)} />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Власні відгуки */}
      <section>
        <h2 className="mb-1 text-base font-bold text-zinc-900 dark:text-zinc-100">{t({ uk: "Мої відгуки", en: "My reviews" })}</h2>
        <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">{t({ uk: "Опубліковані відгуки можна відредагувати або видалити будь-коли.", en: "Published reviews can be edited or deleted at any time." })}</p>
        {reviews.length === 0 ? (
          <p className="rounded-2xl border border-zinc-200 bg-white px-5 py-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
            {t({ uk: "Ви ще не лишали відгуків.", en: "You haven't left any reviews yet." })}
          </p>
        ) : (
          <ul className="space-y-3">
            {reviews.map((r) => {
              const editing = editId === r.id;
              const prod = productLabel(r.product, t);
              return (
                <li key={r.id} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
                  <div className="flex items-start gap-3">
                    <InsurerBadge logo={r.logo} name={r.insurerName} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                        <Link href={`/insurers/${r.insurer}`} className="inline-flex items-center gap-1 text-sm font-bold text-zinc-900 hover:text-indigo-600 dark:text-zinc-100 dark:hover:text-indigo-300">
                          {r.insurerName}<ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
                        </Link>
                        {!editing && <Stars value={r.rating} size="h-4 w-4" />}
                      </div>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">{fmtDate(r.createdAt)}{prod ? ` · ${prod}` : ""}</p>
                      {!editing && <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">{r.text}</p>}
                    </div>
                  </div>

                  {editing ? (
                    <ReviewForm initialRating={r.rating} initialText={r.text} name={r.insurerName} submitLabel={t({ uk: "Зберегти", en: "Save" })} onSubmit={update(r.id)} onCancel={() => setEditId(null)} />
                  ) : confirmId === r.id ? (
                    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
                      <span className="flex-1">{t({ uk: "Видалити цей відгук? Дію не можна скасувати.", en: "Delete this review? This cannot be undone." })}</span>
                      <button type="button" disabled={busyId === r.id} onClick={() => remove(r.id)} className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                        {busyId === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}{t({ uk: "Видалити", en: "Delete" })}
                      </button>
                      <button type="button" onClick={() => setConfirmId(null)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-white dark:text-zinc-300 dark:hover:bg-zinc-800">{t({ uk: "Залишити", en: "Keep" })}</button>
                    </div>
                  ) : (
                    <div className="mt-3 flex items-center gap-1 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                      <button type="button" onClick={() => { setEditId(r.id); setConfirmId(null); }} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 hover:text-indigo-600 dark:text-zinc-300 dark:hover:bg-zinc-800">
                        <Pencil className="h-3.5 w-3.5" />{t({ uk: "Редагувати", en: "Edit" })}
                      </button>
                      <button type="button" onClick={() => { setConfirmId(r.id); setEditId(null); }} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-950/30">
                        <Trash2 className="h-3.5 w-3.5" />{t({ uk: "Видалити", en: "Delete" })}
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
