"use client";

import { Gift, CalendarClock } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { GIFT_LAUNCH_LABEL, isGiftLaunched } from "@/lib/gift-constants";

// Бейдж у хедері /gift: до старту — «З 1 січня 2027», після — «Подарунок, який захищає».
// Клієнтський, бо сторінка статична, а дата має перевірятись у момент перегляду.
export function GiftLaunchBadge() {
  const { t } = useI18n();
  const launched = isGiftLaunched();
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-indigo-100 ring-1 ring-white/15">
      {launched ? <Gift className="h-3.5 w-3.5" /> : <CalendarClock className="h-3.5 w-3.5" />}
      {launched ? t({ uk: "Подарунок, який захищає", en: "A gift that protects" }) : t({ uk: `Старт продажів — ${GIFT_LAUNCH_LABEL.uk}`, en: `Available from ${GIFT_LAUNCH_LABEL.en}` })}
    </span>
  );
}
