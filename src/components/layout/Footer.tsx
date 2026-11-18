"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { emitNavReset } from "@/lib/nav-reset";
import { type ReactNode } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { AccessibilityControls } from "./AccessibilityControls";
import { LanguageToggle } from "./LanguageToggle";
import { useI18n } from "@/lib/i18n";

function AppleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

function GooglePlayLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M22.018 13.298l-3.919 2.218-3.515-3.493 3.543-3.521 3.891 2.202a1.49 1.49 0 010 2.594zM1.337.924a1.486 1.486 0 00-.112.568v21.017c0 .217.045.419.124.6l11.155-11.087zm12.207 10.065l3.258-3.238L3.45.195a1.466 1.466 0 00-.946-.179zm0 2.067l-11 10.933c.298.036.612-.016.906-.183l13.324-7.54z" />
    </svg>
  );
}

// Бейдж застосунку в стилі офіційних (чорний, компактний) з позначкою «Скоро».
function StoreBadge({ logo, top, name }: { logo: ReactNode; top: string; name: string }) {
  const { t } = useI18n();
  return (
    <div className="relative inline-flex cursor-default items-center gap-2.5 rounded-xl bg-zinc-900 px-4 py-2.5 ring-1 ring-white/10 dark:bg-black">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center text-white">{logo}</span>
      <span className="flex flex-col leading-tight">
        <span className="text-[10px] text-zinc-300">{top}</span>
        <span className="text-base font-semibold text-white">{name}</span>
      </span>
      <span className="absolute -right-2 -top-2 rounded-full bg-indigo-600 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white shadow-sm">{t({ uk: "Скоро", en: "Soon" })}</span>
    </div>
  );
}
import { FooterContact } from "./FooterContact";

type FooterLink = { label: string; labelEn: string; href: string; frozen?: boolean; /** Зовнішнє посилання — у новій вкладці. */ external?: boolean };

const footerLinks: { products: FooterLink[]; business: FooterLink[]; media: FooterLink[]; legal: FooterLink[] } = {
  // За абеткою (українські назви).
  products: [
    { label: "Автоцивілка", labelEn: "Car insurance (OSAGO)", href: "/osago" },
    { label: "Віньєтка (скоро)", labelEn: "Vignette (soon)", href: "/vignette" },
    { label: "Житло", labelEn: "Property", href: "/housing" },
    { label: "Зброя", labelEn: "Firearms", href: "/weapon" },
    { label: "Зелена карта", labelEn: "Green Card", href: "/green-card" },
    { label: "КАСКО", labelEn: "CASCO", href: "/kasko" },
    { label: "Міні-КАСКО", labelEn: "Mini-CASCO", href: "/mini-kasko" },
    { label: "Нещасні випадки", labelEn: "Accident", href: "/accident" },
    { label: "Подарунковий сертифікат", labelEn: "Gift certificate", href: "/gift" },
    { label: "Тварини", labelEn: "Pets", href: "/pets" },
    { label: "Туристичне", labelEn: "Travel", href: "/tourism" },
  ],
  // Продукти «через менеджера» (B2B і спеціальні) — лише у футері, не в головному меню.
  business: [
    { label: "Страхування пасажирів", labelEn: "Passenger insurance", href: "/passengers" },
    { label: "CMR — відповідальність перевізника", labelEn: "CMR carrier liability", href: "/cmr" },
    { label: "Заставне майно", labelEn: "Collateral insurance", href: "/collateral" },
    { label: "Медичне для іноземців", labelEn: "Medical for foreigners", href: "/foreigners-medical" },
  ],
  media: [
    // Заморожені (порожні, контент готується) — некликабельні.
    { label: "Блог", labelEn: "Blog", href: "/blog" },
    { label: "Новини", labelEn: "News", href: "/news", frozen: true },
    { label: "Статистика", labelEn: "Statistics", href: "/statistics", frozen: true },
    { label: "Звіти", labelEn: "Reports", href: "/reports", frozen: true },
  ],
  legal: [
    { label: "Підтримка", labelEn: "Support", href: "/support" },
    { label: "Інформація про Субагента", labelEn: "Sub-agent information", href: "/subagent" },
    // Swagger-документація API Ukasko (для партнерів/розробників).
    { label: "Довідник API", labelEn: "API reference", href: "https://devconnect.ukasko.ua/api/documentation", external: true },
    // Публічна оферта / Політика конфіденційності — біля копірайта внизу (заморожені).
  ],
};

function LinkColumn({ title, links, twoCols = false }: { title: string; links: FooterLink[]; twoCols?: boolean }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  return (
    <div>
      <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
        {title}
      </h3>
      <ul className={twoCols ? "grid grid-cols-2 gap-x-6 gap-y-1.5" : "space-y-1.5"}>
        {links.map((link) => (
          <li key={link.label}>
            {link.frozen ? (
              <span className="cursor-default text-[13px] text-zinc-400 dark:text-zinc-500">{t({ uk: link.label, en: link.labelEn })}</span>
            ) : link.external ? (
              <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-[13px] text-zinc-600 dark:text-zinc-300 transition-colors hover:text-indigo-600 dark:hover:text-indigo-400">
                {t({ uk: link.label, en: link.labelEn })}
              </a>
            ) : (
              <Link
                href={link.href}
                onClick={(e) => {
                  // Клік по продукту, коли вже на його сторінці → скидаємо флоу на 1-й екран.
                  if (link.href === pathname) { e.preventDefault(); emitNavReset(); router.replace(link.href, { scroll: true }); }
                }}
                className="text-[13px] text-zinc-600 dark:text-zinc-300 transition-colors hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                {t({ uk: link.label, en: link.labelEn })}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-[#F5F5F7] dark:bg-[#0a0a0b] text-zinc-600 dark:text-zinc-300">
      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        {/* Верх: бренд (лого, слоган, соцмережі, застосунки) ліворуч, колонки посилань праворуч */}
        <div className="grid gap-12 py-14 lg:grid-cols-12 lg:gap-10 lg:py-16">
          <div className="lg:col-span-4">
            <FooterContact />

            <div className="mt-7">
              <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">{t({ uk: "Застосунок", en: "App" })}</p>
              <div className="flex flex-wrap gap-3">
                <StoreBadge logo={<AppleLogo className="h-6 w-6" />} top={t({ uk: "Завантажити в", en: "Download on" })} name="App Store" />
                <StoreBadge logo={<GooglePlayLogo className="h-6 w-6" />} top={t({ uk: "Завантажити в", en: "Get it on" })} name="Google Play" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-[2fr_1.3fr_1fr_1fr] lg:col-span-8 lg:gap-x-10">
            <div className="col-span-2 sm:col-span-1">
              <LinkColumn title={t({ uk: "Продукти", en: "Products" })} links={footerLinks.products} twoCols />
            </div>
            <LinkColumn title={t({ uk: "Для бізнесу та інше", en: "Business & more" })} links={footerLinks.business} />
            <LinkColumn title={t({ uk: "Медіа", en: "Media" })} links={footerLinks.media} />
            <LinkColumn title={t({ uk: "Документи", en: "Documents" })} links={footerLinks.legal} />
          </div>
        </div>

        {/* Довідковий SEO-текст дрібним шрифтом — ПРИРОДНА проза з ключовими фразами,
            вплетеними органічно (без keyword-stuffing, щоб не отримати штраф Google). */}
        <div className="border-t border-zinc-200 py-6 dark:border-zinc-800">
          <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
            {t({
              uk: "Воля Фінанс (VOLYA.FINANCE) — сервіс онлайн-страхування в Україні. У нас можна оформити автоцивілку (ОСЦПВ / ОСАГО), КАСКО та міні-КАСКО, Зелену карту для виїзду за кордон, туристичне страхування для подорожей і страхування домашніх тварин. Ми порівнюємо ціни від 21+ провідних страхових компаній і показуємо найвигідніші пропозиції, а всі поліси електронні та офіційно зареєстровані в МТСБУ. Розрахуйте вартість і купіть страховку на авто онлайн за кілька хвилин — без черг, візитів до офісу та зайвих документів, з готовим полісом на email. Оформлення доступне по всій Україні: Київ, Львів, Одеса, Харків, Дніпро та інші міста.",
              en: "Volya Finance (VOLYA.FINANCE) is an online insurance service in Ukraine. Here you can arrange car insurance (OSAGO), CASCO and Mini-CASCO, a Green Card for trips abroad, travel insurance for your journeys and pet insurance. We compare prices from 21+ leading insurance companies and show the best offers, and all policies are electronic and officially registered with MTSBU. Calculate the cost and buy car insurance online in just a few minutes — no queues, office visits or extra paperwork, with a ready policy sent to your email. Available across Ukraine: Kyiv, Lviv, Odesa, Kharkiv, Dnipro and other cities.",
            })}
          </p>
        </div>

        {/* Нижній рядок: копірайт і документи ліворуч, мова · доступність · тема праворуч */}
        <div className="flex flex-col gap-4 border-t border-zinc-200 py-5 dark:border-zinc-800 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-zinc-500 dark:text-zinc-400">
            <span>© {new Date().getFullYear()} VOLYA.FINANCE. {t({ uk: "Усі права захищені.", en: "All rights reserved." })}</span>
            {/* Публічна оферта — заморожена (документа ще нема); політика конфіденційності — /privacy. */}
            <span className="cursor-default text-zinc-400 dark:text-zinc-500">{t({ uk: "Публічна оферта", en: "Public offer" })}</span>
            <Link href="/privacy" className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300">{t({ uk: "Політика конфіденційності", en: "Privacy policy" })}</Link>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <LanguageToggle />
            <AccessibilityControls />
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">{t({ uk: "Тема", en: "Theme" })}</span>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}
