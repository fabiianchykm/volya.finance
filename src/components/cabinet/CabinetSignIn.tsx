"use client";

import { ShieldCheck, LogIn } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useLogin } from "@/components/auth/LoginProvider";
import { useI18n } from "@/lib/i18n";

// Заглушка кабінету для гостя: один екран входу для всіх вкладок (телефон або Google).
export function CabinetSignIn() {
  const { t } = useI18n();
  const { open } = useLogin();
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/40">
        <ShieldCheck className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
      </div>
      <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{t({ uk: "Увійдіть у кабінет", en: "Sign in to your account" })}</h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
        {t({ uk: "За номером телефону або через Google — з тим контактом, який вказували при оформленні. Поліси, бонуси й збережені дані будуть тут.", en: "With your phone number or Google, using the contact you gave at checkout. Your policies, bonuses and saved data will be here." })}
      </p>
      <Button variant="primary" size="lg" className="mx-auto mt-6 flex items-center gap-2" onClick={open}>
        <LogIn className="h-4 w-4" />
        {t({ uk: "Увійти", en: "Sign in" })}
      </Button>
    </div>
  );
}
