import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { FooterContact } from "./FooterContact";

const footerLinks = {
  products: [
    { label: "Автоцивілка", href: "/osago" },
    { label: "КАСКО", href: "/kasko" },
    { label: "Міні-КАСКО", href: "/mini-kasko" },
    { label: "Зелена карта", href: "/green-card" },
  ],
  company: [
    { label: "Мої поліси", href: "/policies" },
    { label: "Поширені запитання", href: "/osago#faq" },
    { label: "Підтримка", href: "mailto:volya.finance.team@gmail.com" },
    { label: "Про нас", href: "#" },
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
    <footer className="border-t border-zinc-200 bg-[#FAFAFA] text-zinc-600">
      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <div className="grid gap-12 py-16 lg:grid-cols-12 lg:py-20">
          {/* Бренд + контакти + соцмережі */}
          <div className="lg:col-span-5">
            <FooterContact />
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
          <p className="text-[11px] leading-relaxed text-zinc-500">
            Воля Фінанс (volya.finance) — сервіс онлайн-страхування в Україні.
            У нас можна оформити автоцивілку (ОСЦПВ / ОСАГО), КАСКО та міні-КАСКО, Зелену карту для виїзду за кордон,
            туристичне страхування для подорожей і страхування домашніх тварин. Ми порівнюємо ціни від 18+ провідних
            страхових компаній і показуємо найвигідніші пропозиції, а всі поліси електронні та офіційно зареєстровані
            в МТСБУ. Розрахуйте вартість і купіть страховку на авто онлайн за кілька хвилин — без черг, візитів до
            офісу та зайвих документів, з готовим полісом на email. Оформлення доступне по всій Україні: Київ, Львів,
            Одеса, Харків, Дніпро та інші міста.
          </p>
        </div>

        {/* Нижня смуга */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-zinc-200 py-7 sm:flex-row">
          <p className="text-sm text-zinc-500">
            © {new Date().getFullYear()} volya.finance. Усі права захищені.
          </p>
        </div>
      </div>
    </footer>
  );
}
