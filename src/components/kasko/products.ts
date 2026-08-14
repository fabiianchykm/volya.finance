import type { LucideIcon } from "lucide-react";
import { Car, ShieldCheck, Wrench, CloudLightning, KeyRound, Banknote, Coins, Sparkles } from "lucide-react";

// Спільний флоу заявки (номер → дані авто → телефон → Telegram) обслуговує два
// продукти: повне КАСКО і Міні-КАСКО. Відрізняються лише копірайтом і переліком
// покриттів — усе зведено сюди, щоб сторінки/компоненти лишались однаковими.

export type KaskoProduct = "kasko" | "mini-kasko";

export interface BenefitItem {
  icon: LucideIcon;
  title: string;
  titleEn: string;
  desc: string;
  descEn: string;
}

export interface KaskoProductConfig {
  /** Назва для Telegram-заявки та заголовків. */
  label: string;
  labelEn: string;
  heroTitleLead: string;
  heroTitleLeadEn: string;
  heroTitleHighlight: string;
  heroTitleHighlightEn: string;
  heroSubtitle: string;
  heroSubtitleEn: string;
  cta: string;
  ctaEn: string;
  benefitsTitle: string;
  benefitsTitleEn: string;
  benefitsSubtitle: string;
  benefitsSubtitleEn: string;
  benefits: BenefitItem[];
}

export const KASKO_PRODUCTS: Record<KaskoProduct, KaskoProductConfig> = {
  kasko: {
    label: "КАСКО",
    labelEn: "CASCO",
    heroTitleLead: "КАСКО",
    heroTitleLeadEn: "CASCO",
    heroTitleHighlight: "повний захист вашого авто",
    heroTitleHighlightEn: "full protection for your car",
    heroSubtitle:
      "Введіть номер авто — підберемо найкращі умови КАСКО та передзвонимо з персональним розрахунком.",
    heroSubtitleEn:
      "Enter your plate number — we'll find the best CASCO terms and call you back with a personal quote.",
    cta: "Розрахувати вартість",
    ctaEn: "Calculate the cost",
    benefitsTitle: "Що покриває КАСКО",
    benefitsTitleEn: "What CASCO covers",
    benefitsSubtitle:
      "На відміну від обовʼязкової автоцивілки, КАСКО захищає саме ваш автомобіль — у будь-якій ситуації, незалежно від винного.",
    benefitsSubtitleEn:
      "Unlike mandatory third-party insurance, CASCO protects your own car — in any situation, regardless of who is at fault.",
    benefits: [
      { icon: Car, title: "ДТП з вашої вини", titleEn: "Accident that is your fault", desc: "Ремонт авто навіть якщо винуватець аварії — ви. ОСЦПВ так не покриває.", descEn: "Car repair even if you caused the accident. Third-party insurance does not cover this." },
      { icon: KeyRound, title: "Викрадення", titleEn: "Theft", desc: "Виплата повної вартості авто у разі крадіжки чи угону.", descEn: "Payout of the full value of the car in case of theft or hijacking." },
      { icon: CloudLightning, title: "Стихія та пожежа", titleEn: "Natural disaster and fire", desc: "Град, повінь, падіння дерев, пожежа — збитки компенсуються.", descEn: "Hail, flood, falling trees, fire — the losses are compensated." },
      { icon: Wrench, title: "Пошкодження та вандалізм", titleEn: "Damage and vandalism", desc: "Подряпини, розбите скло, дії третіх осіб на парковці.", descEn: "Scratches, broken glass, third-party actions in the parking lot." },
      { icon: ShieldCheck, title: "Ремонт на СТО", titleEn: "Repair at a service station", desc: "Відновлення на офіційних чи перевірених сервісах без зайвих витрат.", descEn: "Restoration at official or trusted service centers without extra costs." },
      { icon: Banknote, title: "Гнучка франшиза", titleEn: "Flexible deductible", desc: "Підберемо співвідношення ціни та покриття саме під ваш бюджет.", descEn: "We'll match the balance of price and coverage to your budget." },
    ],
  },
  "mini-kasko": {
    label: "Міні-КАСКО",
    labelEn: "Mini-CASCO",
    heroTitleLead: "Міні-КАСКО",
    heroTitleLeadEn: "Mini-CASCO",
    heroTitleHighlight: "захист від головних ризиків за менші гроші",
    heroTitleHighlightEn: "protection from the main risks for less money",
    heroSubtitle:
      "Бюджетний варіант КАСКО з покриттям ключових ризиків. Введіть номер авто — передзвонимо й розрахуємо вартість.",
    heroSubtitleEn:
      "A budget CASCO option covering the key risks. Enter your plate number — we'll call you back and calculate the cost.",
    cta: "Розрахувати вартість",
    ctaEn: "Calculate the cost",
    benefitsTitle: "Що покриває Міні-КАСКО",
    benefitsTitleEn: "What Mini-CASCO covers",
    benefitsSubtitle:
      "Найпотрібніший захист за доступною ціною — для тих, кому повне КАСКО завелике, а сама автоцивілка замала.",
    benefitsSubtitleEn:
      "The most essential protection at an affordable price — for those for whom full CASCO is too much and third-party insurance alone is too little.",
    benefits: [
      { icon: Coins, title: "Доступна ціна", titleEn: "Affordable price", desc: "У рази дешевше за повне КАСКО — платите лише за потрібні ризики.", descEn: "Many times cheaper than full CASCO — you pay only for the risks you need." },
      { icon: Car, title: "ДТП з вашої вини", titleEn: "Accident that is your fault", desc: "Покриває ремонт вашого авто у типових аваріях, яких не покриває ОСЦПВ.", descEn: "Covers the repair of your car in typical accidents that third-party insurance does not cover." },
      { icon: CloudLightning, title: "Стихія та пожежа", titleEn: "Natural disaster and fire", desc: "Град, буря, падіння дерев, пожежа — основні природні ризики.", descEn: "Hail, storm, falling trees, fire — the main natural risks." },
      { icon: Wrench, title: "Пошкодження третіми особами", titleEn: "Damage by third parties", desc: "Розбите скло, подряпини, дрібний вандалізм на парковці.", descEn: "Broken glass, scratches, minor vandalism in the parking lot." },
      { icon: Sparkles, title: "Швидке оформлення", titleEn: "Fast processing", desc: "Мінімум документів — досить номера авто й телефону.", descEn: "Minimal paperwork — just the plate number and a phone number are enough." },
    ],
  },
};
