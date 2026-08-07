"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { importServerProfile, clearLocalProfiles } from "@/lib/customer-profile";

// Синхронізація профілю страхувальника з БД під акаунтом:
// • увійшли (або змінили акаунт) → ПОВНІСТЮ чистимо локальний кеш (щоб дані
//   попереднього акаунта не спливали навіть через фолбек loadLastProfile), потім
//   тягнемо профіль ЦЬОГО акаунта з сервера; нема профілю → форми лишаються порожні;
// • вийшли → чистимо локальний кеш (щоб на спільному пристрої нічого не лишалось).
export function ProfileSync() {
  const { data: session, status } = useSession();
  const prevEmail = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (status === "loading") return;
    const email = session?.user?.email ?? null;
    if (prevEmail.current === email) return;
    const wasLoggedIn = !!prevEmail.current;
    prevEmail.current = email;

    if (email) {
      // Вхід або зміна акаунта: стираємо будь-який чужий локальний кеш (прибирає й
      // «фолбек за часом» loadLastProfile), потім тягнемо профіль цього акаунта.
      clearLocalProfiles();
      let cancelled = false;
      fetch("/api/profile")
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => {
          if (!cancelled && j?.profile) importServerProfile(j.profile);
        })
        .catch(() => { /* ignore */ });
      return () => { cancelled = true; };
    }

    // email === null. Чистимо ЛИШЕ якщо це вихід (раніше був залогінений);
    // «гість із самого початку» лишаємо з його локальним автозаповненням.
    if (wasLoggedIn) clearLocalProfiles();
  }, [session?.user?.email, status]);

  return null;
}
