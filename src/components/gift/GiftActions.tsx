"use client";

import { useState } from "react";
import { Copy, Check, Printer, Send, Phone } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { PHONE } from "@/lib/seo";

// Кнопки на сторінці сертифіката: скопіювати код, написати менеджеру, подзвонити,
// роздрукувати (друк ховає навбар/футер через print:hidden).
export function GiftActions({ code }: { code: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* без clipboard — нічого */ }
  };
  const btn = "inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:border-indigo-300 hover:text-indigo-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:text-indigo-300";
  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <button type="button" onClick={copy} className={btn}>{copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}{copied ? t({ uk: "Скопійовано", en: "Copied" }) : t({ uk: "Скопіювати код", en: "Copy code" })}</button>
      <a href={`https://t.me/volya_finance_bot?start=gift_${code.replace(/-/g, "")}`} target="_blank" rel="noopener noreferrer" className={btn}><Send className="h-4 w-4" />{t({ uk: "Написати в Telegram", en: "Message on Telegram" })}</a>
      <a href={`tel:${PHONE}`} className={btn}><Phone className="h-4 w-4" />{t({ uk: "Зателефонувати", en: "Call" })}</a>
      <button type="button" onClick={() => window.print()} className={btn}><Printer className="h-4 w-4" />{t({ uk: "Роздрукувати", en: "Print" })}</button>
    </div>
  );
}
