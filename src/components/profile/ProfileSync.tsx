"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  importServerProfile,
  clearLocalProfiles,
  getProfileOwner,
  setProfileOwner,
} from "@/lib/customer-profile";

// Синхронізація профілю страхувальника з БД під акаунтом. Локальний кеш має
// «власника» (owner) — email акаунта, якому він належить, або порожньо для гостя.
// Це працює навіть коли вихід відбувається через перезавантаження сторінки:
// • залогінений: якщо кеш чужий (owner != email) — чистимо й позначаємо власником
//   поточний акаунт; далі тягнемо його профіль з БД;
// • гість: якщо кеш належить якомусь акаунту (owner заданий) — це стан ПІСЛЯ виходу,
//   тож чистимо; якщо owner порожній — це справжній гість, лишаємо його автозаповнення.
export function ProfileSync() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;
    const email = session?.user?.email ?? null;

    if (email) {
      if (getProfileOwner() !== email.trim().toLowerCase()) {
        clearLocalProfiles();
        setProfileOwner(email);
      }
      let cancelled = false;
      fetch("/api/profile")
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => {
          if (cancelled) return;
          if (j?.profile) importServerProfile(j.profile);
          setProfileOwner(email); // importServerProfile міг не спрацювати — фіксуємо власника
        })
        .catch(() => { /* ignore */ });
      return () => { cancelled = true; };
    }

    // Гість. Якщо кеш належав акаунту — це вихід (у т.ч. через reload): чистимо.
    if (getProfileOwner()) clearLocalProfiles();
  }, [session?.user?.email, status]);

  return null;
}
