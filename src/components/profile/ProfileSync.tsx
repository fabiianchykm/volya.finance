"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { importServerProfile, clearLastProfile, clearLocalProfiles } from "@/lib/customer-profile";

// Синхронізація профілю страхувальника з БД під акаунтом:
// • увійшли (або змінили акаунт) → тягнемо профіль ЦЬОГО акаунта з сервера в
//   локальний кеш; якщо на акаунті ще нема профілю — прибираємо автозаповнення,
//   щоб чужі (попереднього акаунта) дані не спливали;
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
      let cancelled = false;
      fetch("/api/profile")
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => {
          if (cancelled) return;
          if (j?.profile) importServerProfile(j.profile);
          else clearLastProfile();
        })
        .catch(() => { /* ignore */ });
      return () => { cancelled = true; };
    }

    // Перехід «залогінений → гість» = вихід: чистимо кеш пристрою.
    if (wasLoggedIn) clearLocalProfiles();
  }, [session?.user?.email, status]);

  return null;
}
