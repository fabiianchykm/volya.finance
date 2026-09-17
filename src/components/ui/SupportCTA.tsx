"use client";

import { Send } from "lucide-react";
import { useI18n } from "@/lib/i18n";

// Виводимо біля повідомлень про помилку в оформленні: даємо клієнту одразу вихід
// на підтримку в Telegram (телефон свідомо НЕ показуємо), щоб не втратити його на збої. Плаваюча кнопка
// підтримки на /checkout прихована, тож цей CTA — єдиний канал у момент помилки.
export function SupportCTA({ className = "" }: { className?: string }) {
  const { t } = useI18n();
  return (
    <div className={`mt-3 flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-xs text-zinc-600 dark:text-zinc-300">
        {t({ uk: "Не виходить оформити? Ми допоможемо:", en: "Trouble completing it? We'll help:" })}
      </span>
      <a
        href="https://t.me/volya_finance_bot"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-sky-600"
      >
        <Send className="h-3.5 w-3.5" /> Telegram
      </a>
    </div>
  );
}
