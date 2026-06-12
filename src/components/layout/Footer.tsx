import Link from "next/link";
import { Shield, Phone, Mail } from "lucide-react";

const footerLinks = {
  services: [
    { label: "ОСЦПВ (Автоцивілка)", href: "#" },
    { label: "Зелена карта", href: "#" },
    { label: "Каско", href: "#" },
  ],
  company: [
    { label: "Про нас", href: "#" },
    { label: "Поширені запитання", href: "#faq" },
    { label: "Підтримка", href: "#" },
  ],
  legal: [
    { label: "Публічна оферта", href: "#" },
    { label: "Політика конфіденційності", href: "#" },
  ],
};

function LinkColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h3 className="mb-5 text-sm font-semibold uppercase tracking-wider text-zinc-400">
        {title}
      </h3>
      <ul className="space-y-3.5">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-[15px] text-zinc-300 transition-colors hover:text-white"
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
      {/* Світний акцент угорі */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-64 w-[40rem] -translate-x-1/2 rounded-full bg-indigo-600/20 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 sm:px-10">
        <div className="grid grid-cols-2 gap-10 py-16 md:grid-cols-12 md:gap-8 lg:py-20">
          {/* Бренд + контакти */}
          <div className="col-span-2 md:col-span-5 lg:col-span-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">
                volya<span className="text-indigo-400">.finance</span>
              </span>
            </Link>

            <div className="mt-7 space-y-3.5">
              <a
                href="tel:+380800000000"
                className="flex items-center gap-3 text-[15px] text-zinc-300 transition-colors hover:text-white"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10">
                  <Phone className="h-4 w-4 text-indigo-400" />
                </span>
                0 800 000 000
              </a>
              <a
                href="mailto:info@volya.finance"
                className="flex items-center gap-3 text-[15px] text-zinc-300 transition-colors hover:text-white"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10">
                  <Mail className="h-4 w-4 text-indigo-400" />
                </span>
                info@volya.finance
              </a>
            </div>
          </div>

          {/* Колонки посилань */}
          <div className="md:col-span-3 lg:col-span-3 lg:col-start-6">
            <LinkColumn title="Послуги" links={footerLinks.services} />
          </div>
          <div className="md:col-span-2 lg:col-span-2">
            <LinkColumn title="Компанія" links={footerLinks.company} />
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <LinkColumn title="Документи" links={footerLinks.legal} />
          </div>
        </div>

        {/* Нижня смуга */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 py-7 sm:flex-row">
          <p className="text-sm text-zinc-500">
            © {new Date().getFullYear()} volya.finance. Всі права захищені.
          </p>
          <p className="text-sm text-zinc-500">
            Офіційні поліси, зареєстровані в базі{" "}
            <span className="font-medium text-zinc-300">МТСБУ</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
