import type { Metadata } from "next";
import { Suspense } from "react";
import { T } from "@/components/i18n/T";
import { ProfilesManager } from "@/components/profile/ProfilesManager";
import { LinkedLogins } from "@/components/cabinet/LinkedLogins";

export const metadata: Metadata = {
  title: "Налаштування — volya.finance",
  // Приватний кабінет — поза індексом пошукових систем.
  robots: { index: false, follow: false },
};

// Вкладка «Налаштування»: способи входу (email ↔ телефон однієї людини) і збережені
// особи акаунта (сам, дружина, діти…) — редагування, дозаповнення, видалення.
// Дані читає/пише клієнт через /api/profile та /api/account/link (ідентичність —
// із сесії), тож сторінка сама нічого не завантажує на сервері.
export default function ProfilePage() {
  return (
    <div className="space-y-8">
      {/* useSearchParams усередині — потрібен Suspense для статичного рендеру */}
      <Suspense fallback={null}>
        <LinkedLogins />
      </Suspense>
      <section>
        <h2 className="mb-1 text-base font-bold text-zinc-900 dark:text-zinc-100"><T uk="Збережені особи" en="Saved people" /></h2>
        <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">
          <T uk="Дані осіб для швидкого оформлення полісів. Їх підставляє кнопка «Заповнити збереженими даними» у формах." en="Saved people for quick policy checkout. The “Fill from saved data” button in forms uses them." />
        </p>
        <ProfilesManager />
      </section>
    </div>
  );
}
