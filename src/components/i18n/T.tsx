"use client";

import { useI18n } from "@/lib/i18n";

// Клієнтський «листок» для перекладу тексту всередині СЕРВЕРНИХ компонентів
// (сторінки з export metadata не можна робити "use client"). Використання:
// <T uk="Мої поліси" en="My policies" />
export function T({ uk, en }: { uk: string; en?: string }) {
  const { t } = useI18n();
  return <>{t({ uk, en })}</>;
}
