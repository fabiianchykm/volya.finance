"use client";

import { useMemo } from "react";
import { Check, Minus, Star, Crown } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n";
import { formatPrice, formatCompanyName } from "@/lib/utils";
import { companyLogo } from "@/lib/logos";
import { osagoStrikePrice, osagoDiscountPct } from "@/lib/osago-discounts";
import { osagoAgeBasis } from "@/lib/osago-age-basis";
import { INSURERS, MTSBU_PERIOD, MTSBU_SOURCE_URL } from "@/lib/insurers";
import type { InsuranceOffer } from "@/types/api";
import type { OfferBadge } from "@/lib/offer-ranking";

// Порівняння пропозицій автоцивілки в одній таблиці: страхова → колонка,
// параметри → рядки (ціна, знижка, ДЦВ, автоюрист, бонус, розстрочка, за чиїм
// віком рахують, бейджі). Перший стовпець із назвами параметрів липкий, таблиця
// прокручується горизонтально. «Обрати» → той самий шлях, що «Купити» на картці.

type Row = { key: string; label: string; hint?: string; hintHref?: string; render: (o: InsuranceOffer) => React.ReactNode };

export function CompareOffersModal({ open, onClose, offers, badges, installmentIds, onPick }: {
  open: boolean;
  onClose: () => void;
  offers: InsuranceOffer[];
  badges: Map<string, OfferBadge>;
  installmentIds: Set<string>;
  onPick: (offer: InsuranceOffer) => void;
}) {
  const { t, lang } = useI18n();

  const cols = useMemo(() => [...offers].sort((a, b) => a.price - b.price), [offers]);
  const minPrice = cols.length ? Math.min(...cols.map((o) => o.price)) : 0;

  const matchName = (o: InsuranceOffer) => [o.company?.publicName, (o.company as { companyName?: string })?.companyName, o.companyName].filter(Boolean).join(" ");
  const dgo = (o: InsuranceOffer) => (Array.isArray(o.listDgo) ? o.listDgo : []);
  const yes = <Check className="mx-auto h-4 w-4 text-emerald-600" />;
  const no = <Minus className="mx-auto h-4 w-4 text-zinc-300 dark:text-zinc-600" />;

  const rows: Row[] = [
    {
      key: "price", label: t({ uk: "Ціна поліса", en: "Policy price" }),
      render: (o) => (
        <span className={`text-base font-bold ${o.price === minPrice ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-900 dark:text-zinc-100"}`}>{formatPrice(o.price)}</span>
      ),
    },
    {
      key: "discount", label: t({ uk: "Знижка volya.finance", en: "volya.finance discount" }), hint: t({ uk: "Частину комісії віддаємо знижкою — ціна вже з нею", en: "We pass part of our commission on as a discount — already included" }),
      render: (o) => { const strike = osagoStrikePrice(matchName(o), o.price); const pct = osagoDiscountPct(matchName(o)); return strike && pct ? <span className="text-sm"><span className="text-zinc-400 line-through">{formatPrice(strike)}</span> <span className="font-semibold text-rose-600">−{pct}%</span></span> : no; },
    },
    {
      key: "dgo", label: t({ uk: "ДЦВ (додаткове покриття)", en: "Extra liability cover" }), hint: t({ uk: "Підвищує ліміт виплати потерпілому понад законний", en: "Raises the payout limit above the statutory one" }),
      render: (o) => { const l = dgo(o); if (!l.length) return no; const min = l.reduce((a, b) => (Number(b.cost) < Number(a.cost) ? b : a)); const max = l.reduce((a, b) => (Number(b.coverage) > Number(a.coverage) ? b : a)); return <span className="text-xs text-zinc-700 dark:text-zinc-200">{t({ uk: `до +${Number(max.coverage).toLocaleString("uk-UA")} ₴`, en: `up to +${Number(max.coverage).toLocaleString("uk-UA")} ₴` })}<br /><span className="text-zinc-400">{t({ uk: `від ${formatPrice(Number(min.cost))}`, en: `from ${formatPrice(Number(min.cost))}` })}{o.dgoRequired ? ` · ${t({ uk: "обовʼязково", en: "required" })}` : ""}</span></span>; },
    },
    {
      key: "installment", label: t({ uk: "Оплата частинами", en: "Instalments" }), hint: t({ uk: "Повна вартість, без бонусів і промокоду", en: "Full price, no bonuses or promo codes" }),
      render: (o) => installmentIds.has(o.offerId) ? yes : no,
    },
    {
      key: "age", label: t({ uk: "Ціна рахується за віком", en: "Price based on age of" }),
      render: (o) => { const a = o.driverAgeHint ? { uk: o.driverAgeHint, en: o.driverAgeHint } : osagoAgeBasis(matchName(o)); return a ? <span className="text-xs text-zinc-600 dark:text-zinc-300">{lang === "en" ? a.en : a.uk}</span> : <span className="text-xs text-zinc-400">—</span>; },
    },
    ...(cols.some((o) => INSURERS.find((i) => i.match.test(matchName(o)))?.mtsbu?.settlementDays) ? [{
      key: "settle", label: t({ uk: "Середній строк виплати", en: "Average claim settlement" }), hint: t({ uk: `МТСБУ, ${MTSBU_PERIOD}`, en: `MTIBU, ${MTSBU_PERIOD}` }), hintHref: MTSBU_SOURCE_URL,
      render: (o: InsuranceOffer) => { const d = INSURERS.find((i) => i.match.test(matchName(o)))?.mtsbu?.settlementDays; return d ? <span className="text-sm text-zinc-700 dark:text-zinc-200">{t({ uk: `${d} дн.`, en: `${d} days` })}</span> : <span className="text-xs text-zinc-400">—</span>; },
    }] : []),
    ...(cols.some((o) => INSURERS.find((i) => i.match.test(matchName(o)))?.mtsbu?.complaintsPer10k != null) ? [{
      key: "complaints", label: t({ uk: "Скарги на 10 000 договорів", en: "Complaints per 10,000 contracts" }), hint: t({ uk: `МТСБУ, ${MTSBU_PERIOD}`, en: `MTIBU, ${MTSBU_PERIOD}` }), hintHref: MTSBU_SOURCE_URL,
      render: (o: InsuranceOffer) => { const c = INSURERS.find((i) => i.match.test(matchName(o)))?.mtsbu?.complaintsPer10k; return c != null ? <span className="text-sm text-zinc-700 dark:text-zinc-200">{c.toLocaleString("uk-UA")}</span> : <span className="text-xs text-zinc-400">—</span>; },
    }] : []),
    ...(cols.some((o) => INSURERS.find((i) => i.match.test(matchName(o)))?.expertNote) ? [{
      key: "expert", label: t({ uk: "Відгук експерта", en: "Expert review" }), hint: t({ uk: "Думка фахівців volya.finance", en: "Opinion of volya.finance specialists" }),
      render: (o: InsuranceOffer) => { const n = INSURERS.find((i) => i.match.test(matchName(o)))?.expertNote; return n ? <span className="block text-left text-xs leading-snug text-zinc-600 dark:text-zinc-300">{n}</span> : <span className="text-xs text-zinc-400">—</span>; },
    }] : []),
    {
      key: "founded", label: t({ uk: "На ринку з", en: "On the market since" }),
      render: (o) => { const y = INSURERS.find((i) => i.match.test(matchName(o)))?.foundedYear; return y ? <span className="text-sm text-zinc-700 dark:text-zinc-200">{y}</span> : <span className="text-xs text-zinc-400">—</span>; },
    },
    {
      key: "origin", label: t({ uk: "Країна капіталу", en: "Country of capital" }), hint: t({ uk: "Звідки материнська група страхової", en: "Home country of the insurer's parent group" }),
      render: (o) => { const ins = INSURERS.find((i) => i.match.test(matchName(o))); const g = ins?.origin; return g ? <span className="text-xs text-zinc-700 dark:text-zinc-200"><span className="mr-1">{g.flag}</span>{g.country}{g.group && <span className="block text-[10px] text-zinc-400 dark:text-zinc-500">{g.group}</span>}</span> : <span className="text-xs text-zinc-400">—</span>; },
    },
    {
      key: "fix", label: t({ uk: "Виправлення поліса у разі помилки", en: "Policy correction if there's a mistake" }),
      render: () => yes,
    },
  ];

  const badgeOf = (o: InsuranceOffer) => {
    const b = badges.get(o.offerId);
    if (!b) return null;
    const items: { Icon: typeof Star; text: string; cls: string }[] = [];
    if (b === "cheapest" || b === "both") items.push({ Icon: Crown, text: t({ uk: "Найвигідніше", en: "Best value" }), cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" });
    if (b === "popular" || b === "both") items.push({ Icon: Star, text: t({ uk: "Популярний вибір", en: "Popular choice" }), cls: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" });
    return items;
  };

  return (
    <Modal open={open} onClose={onClose} title={t({ uk: `Порівняння пропозицій · ${cols.length}`, en: `Compare offers · ${cols.length}` })} size="full">
      <div className="-mx-1 overflow-x-auto pb-2">
        <table className="w-full min-w-[640px] border-separate border-spacing-0 text-left">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 w-[180px] min-w-[150px] bg-white p-2 align-middle text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:bg-zinc-900 dark:text-zinc-500">{t({ uk: "Параметр", en: "Parameter" })}</th>
              {cols.map((o) => {
                const name = formatCompanyName(o.company?.publicName || o.companyNamePublic || o.companyName);
                const logo = companyLogo(name);
                const items = badgeOf(o);
                return (
                  <th key={o.offerId} className="min-w-[150px] p-2 align-top">
                    <div className="flex flex-col items-center gap-1.5 text-center">
                      <span className="flex h-12 w-full items-center justify-center rounded-xl bg-white p-1.5 ring-1 ring-zinc-200 dark:ring-zinc-700">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {logo ? <img src={logo} alt={name} className="max-h-full max-w-full object-contain" /> : <span className="text-sm font-bold text-indigo-600">{name.slice(0, 2).toUpperCase()}</span>}
                      </span>
                      <span className="flex min-h-[2.5rem] items-center text-sm font-semibold leading-tight text-zinc-900 dark:text-zinc-100">{name}</span>
                      {items && items.length > 0 && (
                        <span className="flex flex-wrap justify-center gap-1">
                          {items.map(({ Icon, text, cls }) => <span key={text} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cls}`}><Icon className="h-3 w-3" />{text}</span>)}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.key} className={i % 2 ? "bg-zinc-50/70 dark:bg-zinc-800/30" : ""}>
                <th scope="row" className={`sticky left-0 z-10 p-2 text-left text-xs font-medium text-zinc-600 dark:text-zinc-300 ${i % 2 ? "bg-zinc-50 dark:bg-zinc-800/60" : "bg-white dark:bg-zinc-900"}`}>
                  {r.label}
                  {r.hint && (r.hintHref ? <a href={r.hintHref} target="_blank" rel="noopener noreferrer" className="block text-[10px] font-normal text-indigo-500 underline underline-offset-2 hover:text-indigo-700 dark:text-indigo-400">{r.hint}</a> : <span className="block text-[10px] font-normal text-zinc-400 dark:text-zinc-500">{r.hint}</span>)}
                </th>
                {cols.map((o) => <td key={o.offerId} className="p-2 text-center align-middle">{r.render(o)}</td>)}
              </tr>
            ))}
            <tr>
              <th scope="row" className="sticky left-0 z-10 bg-white p-2 dark:bg-zinc-900" />
              {cols.map((o) => (
                <td key={o.offerId} className="p-2 text-center">
                  <Button variant="primary" size="sm" className="w-full" onClick={() => onPick(o)}>{t({ uk: "Обрати", en: "Choose" })}</Button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">{t({ uk: "Ціни вже зі знижкою volya.finance. ДЦВ додається до ціни за бажанням на картці пропозиції.", en: "Prices already include the volya.finance discount. Extra cover is an optional add-on on the offer card." })}</p>
    </Modal>
  );
}
