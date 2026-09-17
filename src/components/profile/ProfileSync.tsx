"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  fetchServerProfiles,
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
  const uid = (session?.user as { id?: string } | undefined)?.id ?? "";
  const email = session?.user?.email ?? null;

  useEffect(() => {
    if (status === "loading") return;
    // Рівноправна звʼязка: ключ акаунта — email (Google) АБО "phone:+380…" (вхід за
    // номером). Раніше враховувався лише email → вхід за номером не тягнув профіль
    // із БД і навіть чистив локальний кеш (гілка «Гість»).
    const accountKey = email ? email.trim().toLowerCase() : (uid.startsWith("phone:") ? uid : null);

    if (accountKey) {
      if (getProfileOwner() !== accountKey) {
        clearLocalProfiles();
        setProfileOwner(accountKey);
      }
      // /api/profile ідентичнісно-обізнаний: вхід за номером отримає профілі,
      // збережені під повʼязаним Google-акаунтом (і навпаки). Тягнемо УСІ особи
      // акаунта (сам, дружина…) у локальний кеш — БЕЗ автозастосування (поля лишаємо
      // порожніми; підстановка — лише через пікер «Заповнити збереженими»).
      void fetchServerProfiles()
        .then(() => setProfileOwner(accountKey))
        .catch(() => { /* ignore */ });
    }

    // Гість. Якщо кеш належав акаунту — це вихід (у т.ч. через reload): чистимо.
    if (getProfileOwner()) clearLocalProfiles();
  }, [email, uid, status]);

  return null;
}
