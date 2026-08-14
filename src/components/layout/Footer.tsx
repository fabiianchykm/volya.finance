"use client";

import Link from "next/link";
import { type ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
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

// Бейдж застосунку з кутовою позначкою «Скоро» (магазини ще не активні).
function StoreBadge({ logo, top, name }: { logo: ReactNode; top: string; name: string }) {
  const { t } = useI18n();
  return (
    <div className="relative flex w-full cursor-default items-center gap-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-300 bg-white dark:bg-zinc-100 px-6 py-3.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center text-zinc-900">{logo}</span>
      <span className="flex flex-col leading-tight">
        <span className="text-xs text-zinc-500">{top}</span>
        <span className="text-lg font-semibold text-zinc-900">{name}</span>
      </span>
      <span className="absolute -right-2 -top-2 rounded-full bg-indigo-600 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white shadow-sm">{t({ uk: "Скоро", en: "Soon" })}</span>
    </div>
  );
}
import { FooterContact } from "./FooterContact";

type FooterLink = { label: string; labelEn: string; href: string; frozen?: boolean };

const footerLinks: { products: FooterLink[]; media: FooterLink[]; legal: FooterLink[] } = {
  products: [
    { label: "Автоцивілка", labelEn: "Car insurance (OSAGO)", href: "/osago" },
    { label: "КАСКО", labelEn: "CASCO", href: "/kasko" },
    { label: "Міні-КАСКО", labelEn: "Mini-CASCO", href: "/mini-kasko" },
    { label: "Зелена карта", labelEn: "Green Card", href: "/green-card" },
    { label: "Туристичне", labelEn: "Travel", href: "/tourism" },
    { label: "Тварини", labelEn: "Pets", href: "/pets" },
    { label: "Житло", labelEn: "Property", href: "/housing" },
  ],
  media: [
    // Заморожені (порожні, контент готується) — некликабельні.
    { label: "Блог", labelEn: "Blog", href: "/blog", frozen: true },
    { label: "Новини", labelEn: "News", href: "/news", frozen: true },
    { label: "Статистика", labelEn: "Statistics", href: "/statistics", frozen: true },
  ],
  legal: [
    { label: "Інформація про Субагента", labelEn: "Sub-agent information", href: "/subagent" },
    // Публічна оферта / Політика конфіденційності — біля копірайта внизу (заморожені).
  ],
};

function LinkColumn({ title, links }: { title: string; links: FooterLink[] }) {
  const { t } = useI18n();
  return (
    <div>
      <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
        {title}
      </h3>
      <ul className="space-y-1.5">
        {links.map((link) => (
          <li key={link.label}>
            {link.frozen ? (
              <span className="cursor-default text-[13px] text-zinc-400 dark:text-zinc-500">{t({ uk: link.label, en: link.labelEn })}</span>
            ) : (
              <Link
                href={link.href}
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
        {/* Бренд + контакти + застосунок, а під ними — компактні колонки посилань */}
        <div className="py-16 lg:py-20">
          <FooterContact />

          {/* Застосунки (iOS + Android) — «Скоро» у правому верхньому куті рамок */}
          <div className="mt-7">
            <p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">{t({ uk: "Застосунок", en: "App" })}</p>
            <div className="grid max-w-md grid-cols-1 gap-3 sm:grid-cols-2">
              <StoreBadge logo={<AppleLogo className="h-6 w-6" />} top={t({ uk: "Завантажити в", en: "Download on" })} name="App Store" />
              <StoreBadge logo={<GooglePlayLogo className="h-6 w-6" />} top={t({ uk: "Завантажити в", en: "Get it on" })} name="Google Play" />
            </div>
          </div>

          {/* Колонки посилань — компактні, під підтримкою й застосунком */}
          <div className="mt-10 grid max-w-2xl grid-cols-2 gap-6 sm:grid-cols-3">
            <LinkColumn title={t({ uk: "Продукти", en: "Products" })} links={footerLinks.products} />
            <LinkColumn title={t({ uk: "Медіа", en: "Media" })} links={footerLinks.media} />
            <LinkColumn title={t({ uk: "Документи", en: "Documents" })} links={footerLinks.legal} />
          </div>
        </div>

        {/* Рядок довіри — лого МТСБУ (лінк на реєстр) + доступність і тема праворуч */}
        <div className="flex items-center justify-between gap-4 border-t border-zinc-200 py-6 dark:border-zinc-800">
          <a
            href="https://policy.mtsbu.ua"
            target="_blank"
            rel="noopener noreferrer"
            title={t({ uk: "Перевірити поліс у реєстрі МТСБУ", en: "Check a policy in the MTSBU register" })}
            className="inline-flex items-center gap-2.5 rounded-full bg-white px-4 py-2 ring-1 ring-black/5 transition-transform hover:scale-[1.03] dark:bg-zinc-800 dark:ring-white/10"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/mtsbu-logo.svg"
              alt={t({ uk: "МТСБУ — Моторне (транспортне) страхове бюро України", en: "MTSBU — Motor (Transport) Insurance Bureau of Ukraine" })}
              className="h-5 w-auto opacity-60 grayscale transition-all hover:opacity-100 hover:grayscale-0 dark:invert"
            />
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </a>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <LanguageToggle />
            <AccessibilityControls />
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">{t({ uk: "Тема", en: "Theme" })}</span>
            <ThemeToggle />
          </div>
        </div>

        {/* Довідковий SEO-текст дрібним шрифтом — ПРИРОДНА проза з ключовими фразами,
            вплетеними органічно (без keyword-stuffing, щоб не отримати штраф Google). */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 py-6">
          <p className="text-justify text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
            {t({
              uk: "Воля Фінанс (VOLYA.FINANCE) — сервіс онлайн-страхування в Україні. У нас можна оформити автоцивілку (ОСЦПВ / ОСАГО), КАСКО та міні-КАСКО, Зелену карту для виїзду за кордон, туристичне страхування для подорожей і страхування домашніх тварин. Ми порівнюємо ціни від 18+ провідних страхових компаній і показуємо найвигідніші пропозиції, а всі поліси електронні та офіційно зареєстровані в МТСБУ. Розрахуйте вартість і купіть страховку на авто онлайн за кілька хвилин — без черг, візитів до офісу та зайвих документів, з готовим полісом на email. Оформлення доступне по всій Україні: Київ, Львів, Одеса, Харків, Дніпро та інші міста.",
              en: "Volya Finance (VOLYA.FINANCE) is an online insurance service in Ukraine. Here you can arrange car insurance (OSAGO), CASCO and Mini-CASCO, a Green Card for trips abroad, travel insurance for your journeys and pet insurance. We compare prices from 18+ leading insurance companies and show the best offers, and all policies are electronic and officially registered with MTSBU. Calculate the cost and buy car insurance online in just a few minutes — no queues, office visits or extra paperwork, with a ready policy sent to your email. Available across Ukraine: Kyiv, Lviv, Odesa, Kharkiv, Dnipro and other cities.",
            })}
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              © {new Date().getFullYear()} VOLYA.FINANCE. {t({ uk: "Усі права захищені.", en: "All rights reserved." })}
            </p>
            {/* Публічна оферта / Політика конфіденційності — заморожені (документів ще нема). */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-zinc-400 dark:text-zinc-500">
              <span className="cursor-default">{t({ uk: "Публічна оферта", en: "Public offer" })}</span>
              <span className="cursor-default">{t({ uk: "Політика конфіденційності", en: "Privacy policy" })}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
