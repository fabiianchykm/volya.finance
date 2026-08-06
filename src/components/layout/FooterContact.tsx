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
      <path d="M12.19 21.5h-.04c-2.7-.02-4.77-.9-6.16-2.63C4.75 17.34 4.11 15.13 4.08 12.51v-.02-.02c.03-2.62.67-4.83 1.91-6.36C7.38 4.4 9.45 3.52 12.15 3.5h.04c2.07.01 3.8.55 5.14 1.6 1.26.98 2.15 2.38 2.64 4.15l-1.83.51c-.83-2.98-2.94-4.5-5.96-4.52-1.99.02-3.5.65-4.48 1.87-.92 1.14-1.39 2.79-1.42 4.9.03 2.11.5 3.76 1.42 4.9.98 1.22 2.49 1.85 4.48 1.87 1.79-.01 2.98-.43 3.97-1.42.72-.72 1.19-1.68 1.4-2.86-.79-.42-1.75-.66-2.83-.66-.9 0-1.62.19-2.13.55-.42.3-.62.7-.6 1.19.02.6.53.98 1.32.98.31 0 .62-.07.9-.21l.68 1.69c-.5.28-1.07.42-1.66.42-1.75 0-3.03-1.13-3.11-2.75-.05-1.06.37-2.02 1.19-2.7.79-.66 1.9-1.02 3.21-1.03 1.09 0 2.1.19 3 .55.02-.28.03-.56.03-.85 0-.53-.14-.92-.42-1.18-.3-.29-.79-.44-1.44-.44-.87 0-1.51.35-1.86.75l-1.5-1.02c.71-.99 1.9-1.55 3.35-1.55 1.15 0 2.11.34 2.78.98.68.65 1.02 1.58 1.02 2.74v.06c1.13.68 1.79 1.72 1.79 3.02 0 1.87-.87 3.42-2.34 4.4-1.15.77-2.62 1.14-4.28 1.15z" />
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
  const social =
    "flex h-11 w-11 items-center justify-center rounded-xl bg-white text-zinc-500 ring-1 ring-zinc-200 shadow-sm transition-colors hover:bg-zinc-900 hover:text-white hover:ring-zinc-900";

  return (
    <>
      <div className="flex flex-wrap gap-x-14 gap-y-8">
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
            {SOCIALS.map(({ label, href, Icon }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label} className={social}>
                <Icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>
      </div>

      <LeadModal mode={mode} source="Футер" onClose={() => setMode(null)} />
    </>
  );
}
