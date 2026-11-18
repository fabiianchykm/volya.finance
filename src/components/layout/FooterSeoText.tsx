"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

// Довідковий SEO-блок у футері: природна проза про сервіс із внутрішніми
// посиланнями на продукти. Пишемо своїми словами про СВІЙ сервіс (не копія
// конкурентів): як працює, чому вигідно, що можна оформити, як ми захищаємо дані.
// Дрібний шрифт, семантичні заголовки h2/h3 — для пошуку, не для реклами.

const h2 = "text-xs font-bold uppercase tracking-[0.12em] text-zinc-600 dark:text-zinc-300";
const h3 = "mt-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400";
const p = "mt-1.5 text-[11.5px] leading-relaxed text-zinc-500 dark:text-zinc-400";
const a = "text-zinc-600 underline decoration-zinc-300 underline-offset-2 hover:text-indigo-600 dark:text-zinc-300 dark:decoration-zinc-600 dark:hover:text-indigo-400";

export function FooterSeoText() {
  const { t, lang } = useI18n();

  if (lang === "en") {
    return (
      <section aria-label="About volya.finance">
        <h2 className={h2}>volya.finance — online insurance across Ukraine</h2>
        <p className={p}>
          volya.finance is a Ukrainian online insurance service. We are an insurance intermediary: in one form you get offers from 21+ insurers, compare prices and terms, pay by card and receive an electronic policy by email within minutes. Car insurance policies are registered in the MTSBU database and appear in the Diia app; all policies are kept in your personal account.
        </p>
        <h3 className={h3}>How it works</h3>
        <p className={p}>
          Enter your plate number or trip details, pick an offer, fill in the insured’s details and pay. No office visits, paper forms or phone calls — the service runs 24/7 and takes about three minutes for a car policy.
        </p>
        <h3 className={h3}>Why volya.finance</h3>
        <p className={p}>
          The price is the insurer’s own or lower: we share part of our commission as a discount, credit 1% of every purchase as bonuses and 5% of friends’ purchases via the referral programme. Every policy is in your account with term tracking, and a manager answers in Telegram or Viber. A mistake in a policy is corrected free of charge.
        </p>
        <h3 className={h3}>What you can buy online</h3>
        <p className={p}>
          <Link href="/osago" className={a}>Car insurance (OSAGO)</Link>, <Link href="/green-card" className={a}>Green Card</Link>, <Link href="/kasko" className={a}>CASCO</Link> and <Link href="/mini-kasko" className={a}>Mini-CASCO</Link>, <Link href="/tourism" className={a}>travel insurance</Link>, <Link href="/housing" className={a}>property</Link>, <Link href="/pets" className={a}>pets</Link>, <Link href="/accident" className={a}>accident</Link>, <Link href="/weapon" className={a}>firearms liability</Link>, <Link href="/vignette" className={a}>vignettes</Link> and <Link href="/gift" className={a}>gift certificates</Link>. For business: <Link href="/passengers" className={a}>passenger insurance</Link>, <Link href="/cmr" className={a}>CMR carrier liability</Link>, <Link href="/collateral" className={a}>collateral insurance</Link> and <Link href="/foreigners-medical" className={a}>medical insurance for foreigners</Link>.
        </p>
        <h3 className={h3}>Security</h3>
        <p className={p}>
          Data is transmitted over an encrypted connection, card payments go through the insurer’s licensed payment provider and we never store card details. An electronic policy has the same legal force as a paper one. Available across Ukraine: Kyiv, Lviv, Odesa, Kharkiv, Dnipro and every other city.
        </p>
      </section>
    );
  }

  return (
    <section aria-label={t({ uk: "Про volya.finance", en: "About volya.finance" })}>
      <h2 className={h2}>volya.finance — страхування онлайн по всій Україні</h2>
      <p className={p}>
        volya.finance — український сервіс онлайн-страхування. Ми страховий посередник: в одній формі ви отримуєте пропозиції від 21+ страхових компаній, порівнюєте ціни й умови, оплачуєте карткою й за кілька хвилин отримуєте електронний поліс на email. Автоцивілка реєструється в базі МТСБУ і зʼявляється в застосунку «Дія», а всі договори зберігаються в особистому кабінеті.
      </p>
      <h3 className={h3}>Як це працює</h3>
      <p className={p}>
        Вводите номер авто або параметри поїздки, обираєте пропозицію, заповнюєте дані страхувальника й оплачуєте. Без візитів до офісу, паперових бланків і дзвінків — сервіс працює цілодобово, а оформлення автоцивілки займає близько трьох хвилин.
      </p>
      <h3 className={h3}>Чому обирають volya.finance</h3>
      <p className={p}>
        Ціна така сама, як у страхової, або нижча: частину своєї комісії ми віддаємо знижкою, 1% від кожної покупки нараховуємо бонусами, а 5% від покупок друзів — за реферальною програмою. Усі поліси в кабінеті з контролем строку дії, менеджер відповідає в Telegram і Viber, а помилку в полісі виправляємо безкоштовно.
      </p>
      <h3 className={h3}>Що можна оформити онлайн</h3>
      <p className={p}>
        <Link href="/osago" className={a}>Автоцивілку (ОСЦПВ)</Link>, <Link href="/green-card" className={a}>Зелену карту</Link>, <Link href="/kasko" className={a}>КАСКО</Link> та <Link href="/mini-kasko" className={a}>міні-КАСКО</Link>, <Link href="/tourism" className={a}>туристичне страхування</Link>, <Link href="/housing" className={a}>страхування житла</Link>, <Link href="/pets" className={a}>тварин</Link>, <Link href="/accident" className={a}>від нещасних випадків</Link>, <Link href="/weapon" className={a}>відповідальності власника зброї</Link>, <Link href="/vignette" className={a}>віньєтки для доріг Європи</Link> та <Link href="/gift" className={a}>подарункові сертифікати</Link>. Для бізнесу — <Link href="/passengers" className={a}>страхування пасажирів</Link>, <Link href="/cmr" className={a}>CMR-відповідальність перевізника</Link>, <Link href="/collateral" className={a}>заставне майно</Link> та <Link href="/foreigners-medical" className={a}>медичне страхування іноземців</Link>.
      </p>
      <h3 className={h3}>Безпека</h3>
      <p className={p}>
        Дані передаються захищеним зʼєднанням, оплата карткою проходить через ліцензований платіжний сервіс страхової, а реквізити картки ми не зберігаємо. Електронний поліс має таку саму юридичну силу, як паперовий. Оформлення доступне по всій Україні: Київ, Львів, Одеса, Харків, Дніпро та будь-яке інше місто.
      </p>
    </section>
  );
}
