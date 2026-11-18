"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

// Довідковий SEO-текст у футері: один суцільний абзац дрібним шрифтом, без
// підзаголовків і відступів, з внутрішніми посиланнями на продукти. Написаний
// своїми словами про свій сервіс (не копія конкурентів).

const p = "text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400";
const a = "text-zinc-600 underline decoration-zinc-300 underline-offset-2 hover:text-indigo-600 dark:text-zinc-300 dark:decoration-zinc-600 dark:hover:text-indigo-400";

export function FooterSeoText() {
  const { lang } = useI18n();

  if (lang === "en") {
    return (
      <p className={p}>
        volya.finance is a Ukrainian online insurance service and a licensed intermediary: in one form you get offers from 21+ insurers, compare prices and terms, pay by card and receive an electronic policy by email within minutes. Car insurance policies are registered in the MTSBU database and appear in the Diia app; all contracts are kept in your personal account with term tracking. The price is the insurer’s own or lower: we share part of our commission as a discount, credit 1% of every purchase as bonuses and 5% of friends’ purchases via the referral programme, and a manager answers in Telegram or Viber. Online you can buy <Link href="/osago" className={a}>car insurance (OSAGO)</Link>, <Link href="/green-card" className={a}>Green Card</Link>, <Link href="/kasko" className={a}>CASCO</Link> and <Link href="/mini-kasko" className={a}>Mini-CASCO</Link>, <Link href="/tourism" className={a}>travel insurance</Link>, <Link href="/housing" className={a}>property</Link>, <Link href="/pets" className={a}>pets</Link>, <Link href="/accident" className={a}>accident</Link>, <Link href="/weapon" className={a}>firearms liability</Link>, <Link href="/vignette" className={a}>vignettes</Link> and <Link href="/gift" className={a}>gift certificates</Link>; for business — <Link href="/passengers" className={a}>passenger insurance</Link>, <Link href="/cmr" className={a}>CMR carrier liability</Link>, <Link href="/collateral" className={a}>collateral insurance</Link> and <Link href="/foreigners-medical" className={a}>medical insurance for foreigners</Link>. Data is transmitted over an encrypted connection, card payments go through the insurer’s licensed payment provider and we never store card details; an electronic policy has the same legal force as a paper one. Available across Ukraine: Kyiv, Lviv, Odesa, Kharkiv, Dnipro and every other city.
      </p>
    );
  }

  return (
    <p className={p}>
      volya.finance — український сервіс онлайн-страхування і страховий посередник: в одній формі ви отримуєте пропозиції від 21+ страхових компаній, порівнюєте ціни й умови, оплачуєте карткою й за кілька хвилин отримуєте електронний поліс на email. Автоцивілка реєструється в базі МТСБУ і зʼявляється в застосунку «Дія», а всі договори зберігаються в особистому кабінеті з контролем строку дії. Ціна така сама, як у страхової, або нижча: частину своєї комісії ми віддаємо знижкою, 1% від кожної покупки нараховуємо бонусами, 5% від покупок друзів — за реферальною програмою, а менеджер відповідає в Telegram і Viber. Онлайн можна оформити <Link href="/osago" className={a}>автоцивілку (ОСЦПВ)</Link>, <Link href="/green-card" className={a}>Зелену карту</Link>, <Link href="/kasko" className={a}>КАСКО</Link> та <Link href="/mini-kasko" className={a}>міні-КАСКО</Link>, <Link href="/tourism" className={a}>туристичне страхування</Link>, <Link href="/housing" className={a}>страхування житла</Link>, <Link href="/pets" className={a}>тварин</Link>, <Link href="/accident" className={a}>від нещасних випадків</Link>, <Link href="/weapon" className={a}>відповідальності власника зброї</Link>, <Link href="/vignette" className={a}>віньєтки для доріг Європи</Link> та <Link href="/gift" className={a}>подарункові сертифікати</Link>; для бізнесу — <Link href="/passengers" className={a}>страхування пасажирів</Link>, <Link href="/cmr" className={a}>CMR-відповідальність перевізника</Link>, <Link href="/collateral" className={a}>заставне майно</Link> та <Link href="/foreigners-medical" className={a}>медичне страхування іноземців</Link>. Дані передаються захищеним зʼєднанням, оплата карткою проходить через ліцензований платіжний сервіс страхової, реквізити картки ми не зберігаємо, а електронний поліс має таку саму юридичну силу, як паперовий. Оформлення доступне по всій Україні: Київ, Львів, Одеса, Харків, Дніпро та будь-яке інше місто.
    </p>
  );
}
