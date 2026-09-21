"use client";

import { LifeBuoy } from "lucide-react";
import { useI18n } from "@/lib/i18n";

// Виводимо біля повідомлень про помилку в оформленні: даємо клієнту одразу вихід
// на сторінку підтримки /support (Telegram, Viber, замовити дзвінок). Відкриваємо в
// НОВІЙ вкладці — щоб клієнт не втратив поточну сторінку з уже заповненою формою. Плаваюча кнопка
// підтримки на /checkout прихована, тож цей CTA — єдиний канал у момент помилки.
export function SupportCTA({ className = "" }: { className?: string }) {
  const { t } = useI18n();
  return (
    <div className={`mt-3 flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-xs text-zinc-600 dark:text-zinc-300">
        {t({ uk: "Не виходить оформити? Ми допоможемо:", en: "Trouble completing it? We'll help:" })}
      </span>
      <a
        href="/support"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-700"
      >
        <LifeBuoy className="h-3.5 w-3.5" /> {t({ uk: "Звернутись у підтримку", en: "Contact support" })}
      </a>
    </div>
  );
}
