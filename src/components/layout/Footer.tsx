import Link from "next/link";
import { ShieldCheck, Phone, Mail, Send } from "lucide-react";
import { VMark, BarlessA } from "./VMark";

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

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:gap-4">
              <a
                href="tel:+380965092400"
                className="group inline-flex items-center gap-3 rounded-xl bg-white/[0.04] px-4 py-2.5 ring-1 ring-white/10 transition-colors hover:bg-white/[0.08]"
              >
                <Phone className="h-4 w-4 shrink-0 text-indigo-400" />
                <span className="whitespace-nowrap text-[15px] font-medium text-zinc-200">+38 096 509 24 00</span>
              </a>
              <a
                href="mailto:volya.finance.team@gmail.com"
                className="group inline-flex items-center gap-3 rounded-xl bg-white/[0.04] px-4 py-2.5 ring-1 ring-white/10 transition-colors hover:bg-white/[0.08]"
              >
                <Mail className="h-4 w-4 shrink-0 text-indigo-400" />
                <span className="whitespace-nowrap text-[15px] font-medium text-zinc-200">volya.finance.team@gmail.com</span>
              </a>
            </div>

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

        {/* Рядок довіри */}
        <div className="flex flex-col items-start gap-3 border-t border-white/10 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex items-center gap-2.5 rounded-full bg-white/[0.04] px-4 py-2 ring-1 ring-white/10">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="text-sm text-zinc-300">
              Офіційні поліси, зареєстровані в базі{" "}
              <span className="font-semibold text-white">МТСБУ</span>
            </span>
          </div>
          <span className="text-sm text-zinc-500">
            Партнер провідних страхових компаній України
          </span>
        </div>

        {/* Нижня смуга */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 py-7 sm:flex-row">
          <p className="text-sm text-zinc-500">
            © {new Date().getFullYear()} volya.finance. Усі права захищені.
          </p>
          <p className="text-sm text-zinc-500">Зроблено в Україні 🇺🇦</p>
        </div>
      </div>
    </footer>
  );
}
