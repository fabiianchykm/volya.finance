import type { ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CabinetTabs, CabinetSidebar, CabinetHeading } from "@/components/cabinet/CabinetTabs";
import { CabinetSignIn } from "@/components/cabinet/CabinetSignIn";
import { getSessionIdentity } from "@/lib/session-identity";

// Спільна оболонка кабінету: шапка, на десктопі — бічне меню ліворуч (профіль,
// розділи, вихід) і контент праворуч; на мобільному — заголовок і горизонтальні
// вкладки над контентом. Гостю — один екран входу замість чотирьох заглушок.
export default async function CabinetLayout({ children }: { children: ReactNode }) {
  const { email, phone } = await getSessionIdentity();
  const loggedIn = !!email || !!phone;
  return (
    <>
      <Navbar solid />
      <main className="flex-1 pb-16 pt-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          {loggedIn ? (
            <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start lg:gap-10">
              <aside className="hidden lg:block">
                <CabinetSidebar />
              </aside>
              <div className="min-w-0">
                <CabinetHeading />
                <div className="lg:hidden">
                  <CabinetTabs />
                </div>
                {children}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-2xl">
              <CabinetHeading />
              <CabinetSignIn />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
