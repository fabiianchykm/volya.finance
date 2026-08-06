"use client";

import { useState } from "react";
import { Phone, Mail } from "lucide-react";
import { LeadModal, type LeadMode } from "./LeadModal";

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
    </svg>
  );
}

function ThreadsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.9 13.9 0 013.02.142c-.126-.742-.375-1.332-.744-1.757-.505-.58-1.288-.875-2.328-.882h-.032c-.836 0-1.972.23-2.697 1.316l-1.799-1.216c.973-1.457 2.554-2.259 4.489-2.259h.048c3.235.02 5.163 2.01 5.353 5.472.108.046.216.094.32.145 1.472.692 2.548 1.74 3.11 3.03.783 1.795.856 4.721-1.523 7.05-1.816 1.781-4.017 2.581-7.146 2.604Zm1.03-13.492c-.324 0-.66.01-.985.03-1.83.103-2.968.94-2.903 2.13.07 1.242 1.437 1.82 2.755 1.75 1.213-.065 2.72-.539 2.973-3.294a10.5 10.5 0 00-1.84-.11Z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 01-1.38-.9c-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.31-1.46.72-2.12 1.38C1.36 2.67.95 3.34.63 4.14.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.31.8.72 1.47 1.38 2.13.66.66 1.33 1.07 2.12 1.38.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56.8-.31 1.47-.72 2.13-1.38.66-.66 1.07-1.33 1.38-2.13.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.88 5.88 0 00-1.38-2.12A5.88 5.88 0 0019.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 100 12.32 6.16 6.16 0 000-12.32zm0 10.16a4 4 0 110-8 4 4 0 010 8zm6.4-10.4a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0z" />
    </svg>
  );
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 00.5 6.19C0 8.08 0 12 0 12s0 3.92.5 5.81a3.02 3.02 0 002.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 002.12-2.14C24 15.92 24 12 24 12s0-3.92-.5-5.81zM9.6 15.6V8.4l6.24 3.6L9.6 15.6z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.6l5.24 6.93 6.06-6.93zm-1.29 19.5h2.04L6.48 3.24H4.29L17.61 20.65z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 6.02 4.39 11.01 10.13 11.93v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8v8.44C19.61 23.08 24 18.09 24 12.07z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M16.6 5.82a4.28 4.28 0 01-1.06-2.82h-3.3v13.05a2.59 2.59 0 01-2.59 2.59 2.59 2.59 0 01-2.59-2.59 2.59 2.59 0 012.59-2.59c.27 0 .53.04.78.12v-3.35a5.95 5.95 0 00-.78-.05A5.94 5.94 0 003.71 16.1a5.94 5.94 0 005.94 5.94 5.94 5.94 0 005.94-5.94V9.4a7.56 7.56 0 004.41 1.41V7.5a4.28 4.28 0 01-3.4-1.68z" />
    </svg>
  );
}

// Контактні кнопки у футері: телефон, Telegram, email — способи звʼязку (спільний
// LeadModal / чат менеджера). Поруч — блок соцмереж (просто посилання на профілі).

const TELEGRAM_URL = "https://t.me/volya_finance_bot";

// TODO: замінити на реальні профілі, коли будуть.
const SOCIALS = [
  { label: "Threads", href: "https://www.threads.net/@volya.finance", Icon: ThreadsIcon },
  { label: "Telegram", href: TELEGRAM_URL, Icon: TelegramIcon },
  { label: "Instagram", href: "https://www.instagram.com/volya.finance", Icon: InstagramIcon },
  { label: "Facebook", href: "https://www.facebook.com/volya.finance", Icon: FacebookIcon },
  { label: "TikTok", href: "https://www.tiktok.com/@volya.finance", Icon: TikTokIcon },
  { label: "YouTube", href: "https://www.youtube.com/@volya.finance", Icon: YouTubeIcon },
  { label: "X", href: "https://x.com/volya_finance", Icon: XIcon },
];

export function FooterContact() {
  const [mode, setMode] = useState<LeadMode>(null);

  const btn =
    "flex h-11 w-11 items-center justify-center rounded-xl bg-white text-indigo-600 ring-1 ring-zinc-200 shadow-sm transition-colors hover:bg-indigo-600 hover:text-white hover:ring-indigo-500";
  // Соцмережі поки «заморожені» (профілів ще немає) — показуємо іконки, але нікуди
  // не ведемо: статичні span-и, курсор default, без hover-стану.
  const social =
    "flex h-11 w-11 cursor-default items-center justify-center rounded-xl bg-white text-zinc-400 ring-1 ring-zinc-200 shadow-sm";

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-x-14 gap-y-8">
        {/* Підтримка — способи звʼязку */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
            Підтримка
          </p>
          <div className="flex items-center gap-3">
            <button type="button" aria-label="Замовити дзвінок" title="Замовити дзвінок" className={btn} onClick={() => setMode("phone")}>
              <Phone className="h-5 w-5" />
            </button>
            <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label="Написати в Telegram" title="Написати в Telegram" className={btn}>
              <TelegramIcon className="h-5 w-5" />
            </a>
            <a href="mailto:volya.finance.team@gmail.com" aria-label="Написати на email" title="Написати на email" className={btn}>
              <Mail className="h-5 w-5" />
            </a>
          </div>
        </div>

        {/* Соцмережі — паралельно від підтримки */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
            Соцмережі
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {SOCIALS.map(({ label, Icon }) => (
              <span key={label} aria-label={label} title={label} role="img" className={social}>
                <Icon className="h-5 w-5" />
              </span>
            ))}
          </div>
        </div>
      </div>

      <LeadModal mode={mode} source="Футер" onClose={() => setMode(null)} />
    </>
  );
}
