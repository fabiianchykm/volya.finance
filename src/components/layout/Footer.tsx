import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

function AppleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}
import { FooterContact } from "./FooterContact";

const footerLinks = {
  products: [
    { label: "Автоцивілка", href: "/osago" },
    { label: "КАСКО", href: "/kasko" },
    { label: "Міні-КАСКО", href: "/mini-kasko" },
    { label: "Зелена карта", href: "/green-card" },
  ],
  company: [
    { label: "Поширені запитання", href: "/osago#faq" },
  ],
  legal: [
    { label: "Інформація про Субагента", href: "/subagent" },
    { label: "Публічна оферта", href: "#" },
    { label: "Політика конфіденційності", href: "#" },
  ],
};

function LinkColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h3 className="mb-5 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
        {title}
      </h3>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-[15px] text-zinc-600 transition-colors hover:text-indigo-600"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-[#F5F5F7] text-zinc-600">
      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <div className="grid gap-12 py-16 lg:grid-cols-12 lg:py-20">
          {/* Бренд + контакти + соцмережі */}
          <div className="lg:col-span-5">
            <FooterContact />

            {/* Застосунок для iPhone — «Скоро» у правому верхньому куті рамки кнопки */}
            <div className="mt-7">
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Застосунок</p>
              <div className="relative inline-flex cursor-default items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-2.5">
                <AppleLogo className="h-6 w-6 text-zinc-900" />
                <span className="flex flex-col leading-tight">
                  <span className="text-[10px] text-zinc-500">Завантажити в</span>
                  <span className="text-sm font-semibold text-zinc-900">App Store</span>
                </span>
                <span className="absolute -right-2 -top-2 rounded-full bg-indigo-600 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white shadow-sm">Скоро</span>
              </div>
            </div>
          </div>

          {/* Колонки посилань */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7 lg:gap-8">
            <LinkColumn title="Продукти" links={footerLinks.products} />
            <LinkColumn title="Компанія" links={footerLinks.company} />
            <LinkColumn title="Документи" links={footerLinks.legal} />
          </div>
        </div>

        {/* Рядок довіри — офіційне лого МТСБУ (лінк на реєстр) + галочка */}
        <div className="flex items-center border-t border-zinc-200 py-6">
          <a
            href="https://policy.mtsbu.ua"
            target="_blank"
            rel="noopener noreferrer"
            title="Перевірити поліс у реєстрі МТСБУ"
            className="inline-flex items-center gap-2.5 rounded-full bg-white px-4 py-2 ring-1 ring-black/5 transition-transform hover:scale-[1.03]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/mtsbu-logo.svg"
              alt="МТСБУ — Моторне (транспортне) страхове бюро України"
              className="h-5 w-auto"
            />
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </a>
        </div>

        {/* Довідковий SEO-текст дрібним шрифтом — ПРИРОДНА проза з ключовими фразами,
            вплетеними органічно (без keyword-stuffing, щоб не отримати штраф Google). */}
        <div className="border-t border-zinc-200 py-6">
          <p className="text-justify text-[11px] leading-relaxed text-zinc-500">
            Воля Фінанс (VOLYA.FINANCE) — сервіс онлайн-страхування в Україні.
            У нас можна оформити автоцивілку (ОСЦПВ / ОСАГО), КАСКО та міні-КАСКО, Зелену карту для виїзду за кордон,
            туристичне страхування для подорожей і страхування домашніх тварин. Ми порівнюємо ціни від 18+ провідних
            страхових компаній і показуємо найвигідніші пропозиції, а всі поліси електронні та офіційно зареєстровані
            в МТСБУ. Розрахуйте вартість і купіть страховку на авто онлайн за кілька хвилин — без черг, візитів до
            офісу та зайвих документів, з готовим полісом на email. Оформлення доступне по всій Україні: Київ, Львів,
            Одеса, Харків, Дніпро та інші міста.
          </p>
          <p className="mt-3 text-[11px] text-zinc-500">
            © {new Date().getFullYear()} VOLYA.FINANCE. Усі права захищені.
          </p>
        </div>
      </div>
    </footer>
  );
}
