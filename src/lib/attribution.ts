import type { NextRequest } from "next/server";

// ДЖЕРЕЛО ТРАФІКУ (атрибуція). Клієнт при першому заході запамʼятовує utm_*/gclid/
// fbclid/referrer у cookie `volya_attr` (30 днів, перший дотик не перезаписується,
// щоб реклама не «губилась», коли людина повернулась напряму). Сервер читає cookie
// в кожному лід-/продаж-роуті й додає рядок «🔗 Джерело» у Telegram — без змін у
// клієнтських викликах.

export const ATTR_COOKIE = "volya_attr";

export interface Attribution {
  source?: string;   // google | instagram | facebook | tiktok | direct | <host>
  medium?: string;   // cpc | social | organic | referral | …
  campaign?: string;
  content?: string;
  referrer?: string; // host реферера
  landing?: string;  // перша сторінка (без query)
  at?: string;       // ISO часу першого дотику
}

/** Людський підпис джерела для Telegram. */
export function attributionLabel(a: Attribution | null | undefined): string {
  if (!a || (!a.source && !a.referrer)) return "невідомо (прямий захід або без міток)";
  const src = (a.source || "").toLowerCase();
  const med = (a.medium || "").toLowerCase();
  let head: string;
  if (src === "google" && (med === "cpc" || med === "golden-web" || med === "ppc" || a.campaign)) head = "Google Ads";
  else if (src === "google") head = "Google (органічний пошук)";
  else if (src === "ig" || src === "instagram") head = "Instagram";
  else if (src === "fb" || src === "facebook") head = "Facebook";
  else if (src === "tiktok") head = "TikTok";
  else if (src === "telegram" || src === "tg") head = "Telegram";
  else if (src === "threads") head = "Threads";
  else if (src === "direct") head = "прямий захід";
  else head = a.source || a.referrer || "невідомо";
  const tail = [a.campaign, a.content].filter(Boolean).join(" / ");
  const extra = tail ? ` · ${tail}` : (a.medium && !["cpc","social","organic","referral","(none)"].includes(med) ? ` · ${a.medium}` : "");
  return head + extra + (a.landing ? ` → ${a.landing}` : "");
}

/** Прочитати атрибуцію з cookie запиту (сервер). */
export function attributionFromReq(req: NextRequest): Attribution | null {
  try {
    const raw = req.cookies.get(ATTR_COOKIE)?.value;
    if (!raw) return null;
    const a = JSON.parse(decodeURIComponent(raw)) as Attribution;
    // Обрізаємо довжину — cookie може підробити клієнт.
    for (const k of Object.keys(a) as (keyof Attribution)[]) if (typeof a[k] === "string") a[k] = (a[k] as string).slice(0, 80);
    return a;
  } catch {
    return null;
  }
}

/** Рядок для Telegram (порожній, якщо нічого не знаємо — тоді пишемо «невідомо»). */
export function sourceLine(req: NextRequest): string {
  return `🔗 Джерело: ${attributionLabel(attributionFromReq(req))}`;
}
