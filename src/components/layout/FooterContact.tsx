"use client";

import { useState } from "react";
import { Phone, Mail, Send } from "lucide-react";
import { LeadModal, type LeadMode } from "./LeadModal";

// Контактні кнопки у футері: телефон, email, Telegram — в один ряд, із підписами,
// щоб було очевидно, що це способи звʼязку. Телефон/email відкривають віконце
// заявки (спільний LeadModal); Telegram веде в чат менеджера.

const TELEGRAM_URL = "https://t.me/volya_finance_bot";

export function FooterContact() {
  const [mode, setMode] = useState<LeadMode>(null);

  const btn =
    "flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.04] text-indigo-400 ring-1 ring-white/10 transition-colors hover:bg-indigo-600 hover:text-white hover:ring-indigo-500";
  const label = "text-[11px] font-medium text-zinc-400";

  return (
    <>
      <div className="mt-7">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
          Звʼяжіться з нами
        </p>
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center gap-1.5">
            <button type="button" aria-label="Замовити дзвінок" title="Замовити дзвінок" className={btn} onClick={() => setMode("phone")}>
              <Phone className="h-5 w-5" />
            </button>
            <span className={label}>Дзвінок</span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <a href="mailto:volya.finance.team@gmail.com" aria-label="Написати на email" title="Написати на email" className={btn}>
              <Mail className="h-5 w-5" />
            </a>
            <span className={label}>Email</span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label="Написати в Telegram" title="Написати в Telegram" className={btn}>
              <Send className="h-5 w-5" />
            </a>
            <span className={label}>Telegram</span>
          </div>
        </div>
      </div>

      <LeadModal mode={mode} source="Футер" onClose={() => setMode(null)} />
    </>
  );
}
