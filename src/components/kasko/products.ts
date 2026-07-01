import type { LucideIcon } from "lucide-react";
import { Car, ShieldCheck, Wrench, CloudLightning, KeyRound, Banknote, Coins, Sparkles } from "lucide-react";

// Спільний флоу заявки (номер → дані авто → телефон → Telegram) обслуговує два
// продукти: повне КАСКО і Міні-КАСКО. Відрізняються лише копірайтом і переліком
// покриттів — усе зведено сюди, щоб сторінки/компоненти лишались однаковими.

export type KaskoProduct = "kasko" | "mini-kasko";

export interface BenefitItem {
  icon: LucideIcon;
  title: string;
  desc: string;
}

export interface KaskoProductConfig {
  /** Назва для Telegram-заявки та заголовків. */
  label: string;
  heroTitleLead: string;
  heroTitleHighlight: string;
  heroSubtitle: string;
  cta: string;
  benefitsTitle: string;
  benefitsSubtitle: string;
  benefits: BenefitItem[];
}

export const KASKO_PRODUCTS: Record<KaskoProduct, KaskoProductConfig> = {
  kasko: {
    label: "КАСКО",
    heroTitleLead: "КАСКО —",
    heroTitleHighlight: "повний захист вашого авто",
    heroSubtitle:
      "Введіть номер авто — підберемо найкращі умови КАСКО та передзвонимо з персональним розрахунком.",
    cta: "Підібрати КАСКО",
    benefitsTitle: "Що покриває КАСКО",
    benefitsSubtitle:
      "На відміну від обовʼязкової автоцивілки, КАСКО захищає саме ваш автомобіль — у будь-якій ситуації, незалежно від винного.",
    benefits: [
      { icon: Car, title: "ДТП з вашої вини", desc: "Ремонт авто навіть якщо винуватець аварії — ви. ОСАГО так не покриває." },
      { icon: KeyRound, title: "Викрадення", desc: "Виплата повної вартості авто у разі крадіжки чи угону." },
      { icon: CloudLightning, title: "Стихія та пожежа", desc: "Град, повінь, падіння дерев, пожежа — збитки компенсуються." },
      { icon: Wrench, title: "Пошкодження та вандалізм", desc: "Подряпини, розбите скло, дії третіх осіб на парковці." },
      { icon: ShieldCheck, title: "Ремонт на СТО", desc: "Відновлення на офіційних чи перевірених сервісах без зайвих витрат." },
      { icon: Banknote, title: "Гнучка франшиза", desc: "Підберемо співвідношення ціни та покриття саме під ваш бюджет." },
    ],
  },
  "mini-kasko": {
    label: "Міні-КАСКО",
    heroTitleLead: "Міні-КАСКО —",
    heroTitleHighlight: "захист від головних ризиків за менші гроші",
    heroSubtitle:
      "Бюджетний варіант КАСКО з покриттям ключових ризиків. Введіть номер авто — передзвонимо й розрахуємо вартість.",
    cta: "Підібрати Міні-КАСКО",
    benefitsTitle: "Що покриває Міні-КАСКО",
    benefitsSubtitle:
      "Найпотрібніший захист за доступною ціною — для тих, кому повне КАСКО завелике, а сама автоцивілка замала.",
    benefits: [
      { icon: Coins, title: "Доступна ціна", desc: "У рази дешевше за повне КАСКО — платите лише за потрібні ризики." },
      { icon: Car, title: "ДТП з вашої вини", desc: "Покриває ремонт вашого авто у типових аваріях, яких не покриває ОСАГО." },
      { icon: CloudLightning, title: "Стихія та пожежа", desc: "Град, буря, падіння дерев, пожежа — основні природні ризики." },
      { icon: Wrench, title: "Пошкодження третіми особами", desc: "Розбите скло, подряпини, дрібний вандалізм на парковці." },
      { icon: Sparkles, title: "Швидке оформлення", desc: "Мінімум документів — досить номера авто й телефону." },
    ],
  },
};
