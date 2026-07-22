import Link from "next/link";
import { CheckCircle2, Send } from "lucide-react";
import { VMark, BarlessA } from "./VMark";
import { FooterContact } from "./FooterContact";

// Telegram-контакт менеджера. За номером телефону (Telegram відкриває чат із цим
// акаунтом). Пізніше можна замінити на @username бота.
const TELEGRAM_URL = "https://t.me/+380965092400";

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

const socials = [
  { label: "Telegram", href: TELEGRAM_URL, icon: Send },
];

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
              className="text-[15px] text-zinc-400 transition-colors hover:text-white"
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
    <footer className="relative overflow-hidden bg-zinc-950 text-zinc-300">
      {/* Тонка градієнтна лінія + світний акцент угорі */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent" />
      <div className="pointer-events-none absolute -top-32 left-1/2 h-64 w-[44rem] -translate-x-1/2 rounded-full bg-indigo-600/20 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 sm:px-10">
        <div className="grid gap-12 py-16 lg:grid-cols-12 lg:py-20">
          {/* Бренд + контакти + соцмережі */}
          <div className="lg:col-span-5">
            <Link href="/" className="inline-flex items-center gap-1">
              <VMark id="vmark-footer" className="h-11 w-11" />
              <span
                style={{ fontFamily: "var(--font-logo)" }}
                className="text-3xl font-medium uppercase tracking-[0.2em] text-white"
              >
                OLY<BarlessA className="inline-block h-[0.72em] w-auto align-baseline" />
              </span>
            </Link>

            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-zinc-400">
              Автострахування онлайн — швидко, офіційно та вигідно. Порівнюйте
              пропозиції провідних страхових і оформлюйте поліси за кілька хвилин.
            </p>

            <FooterContact />

            <div className="mt-7 flex items-center gap-2.5">
              {socials.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] text-zinc-300 ring-1 ring-white/10 transition-all hover:bg-indigo-600 hover:text-white hover:ring-indigo-500"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
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
        <div className="flex items-center border-t border-white/10 py-6">
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

        {/* Нижня смуга */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 py-7 sm:flex-row">
          <p className="text-sm text-zinc-500">
            © {new Date().getFullYear()} volya.finance. Усі права захищені.
          </p>
        </div>
      </div>
    </footer>
  );
}
