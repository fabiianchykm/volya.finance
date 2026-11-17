"use client";

import { FileCheck, Scale, Clock, Mail, Users, Crosshair, IdCard, FileText, type LucideIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type Tr = { uk: string; en: string };

const BENEFITS: { icon: LucideIcon; title: Tr; desc: Tr }[] = [
  { icon: Scale, title: { uk: "Вимога закону", en: "Required by law" }, desc: { uk: "Власник зброї зобовʼязаний застрахувати цивільну відповідальність. Без поліса дозвіл не видадуть і не продовжать.", en: "Firearm owners must insure their civil liability. Without a policy the permit is neither issued nor renewed." } },
  { icon: Users, title: { uk: "Захист третіх осіб", en: "Third-party cover" }, desc: { uk: "Страхова відшкодовує шкоду життю, здоровʼю чи майну інших людей, заподіяну при володінні або використанні зброї.", en: "The insurer compensates harm to other people's life, health or property caused while owning or using the weapon." } },
  { icon: Clock, title: { uk: "На строк дозволу", en: "For the permit term" }, desc: { uk: "Поліс на 1 або 3 роки — під строк дії дозволу, щоб не переоформлювати щороку.", en: "A 1- or 3-year policy to match the permit, so you don't renew every year." } },
  { icon: Mail, title: { uk: "Електронний поліс", en: "Electronic policy" }, desc: { uk: "Договір надходить на email у день звернення — його приймає дозвільна система Нацполіції.", en: "The contract arrives by email the same day and is accepted by the National Police permit office." } },
  { icon: Crosshair, title: { uk: "Будь-яка зброя", en: "Any weapon type" }, desc: { uk: "Мисливська гладкоствольна й нарізна, травматична, газова, пневматична, холодна, нагородна — кілька одиниць в одному договорі.", en: "Hunting smoothbore and rifled, traumatic, gas, pneumatic, cold steel, award — several units in one contract." } },
  { icon: FileCheck, title: { uk: "Без зайвих візитів", en: "No office visits" }, desc: { uk: "Усе онлайн: дані з дозволу та паспорта — і поліс готовий. Менеджер допоможе з будь-яким питанням.", en: "Everything online: permit and passport details — and the policy is ready. A manager helps with any question." } },
];

const DOCS: { icon: LucideIcon; text: Tr }[] = [
  { icon: IdCard, text: { uk: "Паспорт або ID-картка та ІПН власника", en: "Owner's passport or ID card and tax number" } },
  { icon: FileText, text: { uk: "Дозвіл на зброю (номер, ким і коли виданий)", en: "Firearms permit (number, issuer, date)" } },
  { icon: Crosshair, text: { uk: "Дані зброї: вид, модель, калібр, номер", en: "Weapon details: type, model, calibre, serial number" } },
];

export function WeaponBenefits() {
  const { t } = useI18n();
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="mb-12 text-center">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-3xl">{t({ uk: "Навіщо власнику зброї поліс", en: "Why a firearm owner needs a policy" })}</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-zinc-500 dark:text-zinc-400 sm:text-base">
          {t({ uk: "Обовʼязкове страхування цивільної відповідальності громадян, які мають у власності чи користуванні зброю.", en: "Compulsory civil liability insurance for citizens who own or use firearms." })}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {BENEFITS.map(({ icon: Icon, title, desc }) => (
          <div key={title.uk} className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/40">
              <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{t(title)}</h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t(desc)}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-[2rem] p-6 text-white sm:p-8" style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #4338ca 45%, #6d28d9 100%)" }}>
        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div>
            <h3 className="text-xl font-bold sm:text-2xl">{t({ uk: "Що потрібно для оформлення", en: "What you need to apply" })}</h3>
            <p className="mt-2 text-sm text-indigo-100">
              {t({ uk: "Три речі — і менеджер оформить поліс за 15 хвилин. Фото документів можна надіслати в Telegram або Viber.", en: "Three things — and a manager issues the policy in 15 minutes. Photos of the documents can be sent via Telegram or Viber." })}
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-3">
            {DOCS.map(({ icon: Icon, text }) => (
              <li key={text.uk} className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
                <Icon className="mb-2 h-5 w-5 text-indigo-200" />
                <p className="text-sm font-medium leading-snug">{t(text)}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
