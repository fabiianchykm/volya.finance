import type { ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CabinetTabs } from "@/components/cabinet/CabinetTabs";
import { CabinetSignIn } from "@/components/cabinet/CabinetSignIn";
import { getSessionIdentity } from "@/lib/session-identity";

// Спільна оболонка кабінету: шапка, заголовок + вкладки (Поліси · Бонуси ·
// Налаштування), гостю — один екран входу замість трьох різних заглушок.
export default async function CabinetLayout({ children }: { children: ReactNode }) {
  const { email, phone } = await getSessionIdentity();
  const loggedIn = !!email || !!phone;
  return (
    <>
      <Navbar solid />
      <main className="flex-1 pt-24 pb-16">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <CabinetTabs />
          {loggedIn ? children : <CabinetSignIn />}
        </div>
      </main>
      <Footer />
    </>
  );
}
