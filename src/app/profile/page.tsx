import type { Metadata } from "next";
import { T } from "@/components/i18n/T";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProfilesManager } from "@/components/profile/ProfilesManager";

export const metadata: Metadata = {
  title: "Мої дані — volya.finance",
  // Приватний кабінет — поза індексом пошукових систем.
  robots: { index: false, follow: false },
};

// Кабінет «Мої дані»: збережені особи акаунта (сам, дружина, діти…) — редагування,
// дозаповнення, видалення, додавання. Дані читає/пише клієнт через /api/profile
// (ідентичність — із сесії), тож сторінка сама нічого не завантажує на сервері.
export default function ProfilePage() {
  return (
    <>
      <Navbar solid />
      <main className="flex-1 pt-24 pb-16">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <h1 className="mb-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100"><T uk="Мої дані" en="My data" /></h1>
          <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
            <T uk="Збережені дані осіб для швидкого оформлення полісів. Їх підставляє кнопка «Заповнити збереженими даними» у формах." en="Saved people for quick policy checkout. The “Fill from saved data” button in forms uses them." />
          </p>
          <ProfilesManager />
        </div>
      </main>
      <Footer />
    </>
  );
}
