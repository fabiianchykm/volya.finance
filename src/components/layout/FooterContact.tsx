"use client";

import { useState } from "react";
import { Phone, Mail } from "lucide-react";

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
    </svg>
  );
}
import { LeadModal, type LeadMode } from "./LeadModal";

// Контактні кнопки у футері: телефон, email, Telegram — в один ряд, із підписами,
// щоб було очевидно, що це способи звʼязку. Телефон/email відкривають віконце
// заявки (спільний LeadModal); Telegram веде в чат менеджера.

const TELEGRAM_URL = "https://t.me/volya_finance_bot";

export function FooterContact() {
  const [mode, setMode] = useState<LeadMode>(null);

  const btn =
    "flex h-11 w-11 items-center justify-center rounded-xl bg-white text-indigo-600 ring-1 ring-zinc-200 shadow-sm transition-colors hover:bg-indigo-600 hover:text-white hover:ring-indigo-500";

  return (
    <>
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

      <LeadModal mode={mode} source="Футер" onClose={() => setMode(null)} />
    </>
  );
}
