// Поширені запитання по кожному продукту. У звичайному (не-клієнтському) модулі,
// щоб імпортувати І клієнтський UI (FAQSection), І серверні сторінки для FAQPage
// JSON-LD (rich-результати Google) — з одного джерела.

export interface FaqItem {
  question: string;
  answer: string;
  questionEn?: string;
  answerEn?: string;
}

export const FAQ_OSAGO: FaqItem[] = [
  {
    question: "Що таке електронний поліс ОСЦПВ?",
    answer:
      "Електронний поліс ОСЦПВ (автоцивілка) — це повноцінний аналог паперового поліса, який має таку ж юридичну силу. Він автоматично реєструється в базі МТСБУ, і його можна пред'являти патрульній поліції просто з екрана смартфона або в застосунку «Дія».",
    questionEn: "What is an electronic OSAGO/MTPL policy?",
    answerEn:
      "An electronic OSAGO/MTPL policy (compulsory motor third-party liability insurance) is a full equivalent of the paper policy and has the same legal force. It is automatically registered in the MTSBU (Motor Insurance Bureau of Ukraine) database, and you can present it to the patrol police straight from your smartphone screen or in the Diia app.",
  },
  {
    question: "Як перевірити дійсність мого поліса?",
    answer:
      "Відразу після оформлення та оплати ваш поліс миттєво потрапляє до централізованої бази МТСБУ. Ви можете перевірити його статус та дійсність на офіційному сайті МТСБУ за номером авто або номером самого поліса, а також він автоматично підтягнеться в застосунок «Дія».",
    questionEn: "How can I verify that my policy is valid?",
    answerEn:
      "Immediately after purchase and payment, your policy is instantly added to the centralized MTSBU (Motor Insurance Bureau of Ukraine) database. You can check its status and validity on the official MTSBU website using your car's plate number or the policy number, and it will also be pulled into the Diia app automatically.",
  },
  {
    question: "Що робити при настанні ДТП?",
    answer:
      "У разі ДТП обов'язково увімкніть аварійну сигналізацію та встановіть знак аварійної зупинки. Викличте поліцію або заповніть Європротокол (якщо немає постраждалих і учасники згодні з обставинами). Після цього обов'язково зателефонуйте на гарячу лінію вашої страхової компанії (номер вказано в полісі) для реєстрації страхової події.",
    questionEn: "What should I do in the event of a road accident?",
    answerEn:
      "In the event of a road accident, be sure to turn on the hazard lights and set up the warning triangle. Call the police or fill out a Euro Accident Statement (if there are no injuries and the parties agree on the circumstances). After that, be sure to call your insurance company's hotline (the number is stated in the policy) to register the insured event.",
  },
  {
    question: "Чи можна оформити страховку не власнику авто?",
    answer:
      "Так, поліс ОСЦПВ страхує цивільно-правову відповідальність усіх водіїв, які на законних підставах керують даним транспортним засобом. Тому оформити і оплатити страховку може будь-яка особа, маючи необхідні дані про автомобіль.",
    questionEn: "Can someone other than the car owner take out the insurance?",
    answerEn:
      "Yes, an OSAGO/MTPL policy covers the civil liability of all drivers who lawfully operate the vehicle. Therefore, any person can take out and pay for the insurance as long as they have the necessary details about the car.",
  },
  {
    question: "Скільки часу займає оформлення на сайті?",
    answer:
      "Процес оформлення на volya.finance займає в середньому 3-5 хвилин. Ви вводите номер авто, обираєте найвигіднішу пропозицію, заповнюєте дані та оплачуєте онлайн. Поліс приходить на ваш email протягом кількох хвилин після оплати.",
    questionEn: "How long does it take to buy a policy on the website?",
    answerEn:
      "The purchase process on volya.finance takes 3-5 minutes on average. You enter your car's plate number, choose the best offer, fill in the details, and pay online. The policy is sent to your email within a few minutes of payment.",
  },
];

// Зворотна сумісність зі старим імпортом (сторінка ОСЦПВ).
export const FAQ_ITEMS = FAQ_OSAGO;

const FAQ_KASKO: FaqItem[] = [
  {
    question: "Що покриває КАСКО?",
    answer:
      "КАСКО — це добровільне страхування вашого власного автомобіля. Воно покриває пошкодження внаслідок ДТП (незалежно від вини), викрадення, стихійні лиха, пожежу, а також протиправні дії третіх осіб. На відміну від ОСЦПВ, яке покриває шкоду іншим, КАСКО відшкодовує саме ваше авто.",
    questionEn: "What does CASCO cover?",
    answerEn:
      "CASCO is voluntary insurance for your own car. It covers damage from a road accident (regardless of fault), theft, natural disasters, fire, as well as unlawful acts by third parties. Unlike OSAGO/MTPL, which covers damage caused to others, CASCO compensates for your own car.",
  },
  {
    question: "Чим КАСКО відрізняється від ОСЦПВ?",
    answer:
      "ОСЦПВ (автоцивілка) — обов'язкове страхування вашої відповідальності перед іншими учасниками руху. КАСКО — добровільне страхування вашого власного авто від пошкоджень, викрадення та інших ризиків. Це різні продукти, які часто оформлюють разом.",
    questionEn: "How does CASCO differ from OSAGO/MTPL?",
    answerEn:
      "OSAGO/MTPL is compulsory insurance of your liability to other road users. CASCO is voluntary insurance of your own car against damage, theft, and other risks. These are different products that are often purchased together.",
  },
  {
    question: "Від чого залежить ціна КАСКО?",
    answer:
      "Вартість залежить від марки, моделі та року авто, його вартості, обраного покриття, розміру франшизи та даних водія. Тому КАСКО розраховується індивідуально під ваш автомобіль.",
    questionEn: "What determines the price of CASCO?",
    answerEn:
      "The cost depends on the make, model, and year of the car, its value, the chosen coverage, the deductible amount, and the driver's details. That is why CASCO is calculated individually for your specific car.",
  },
  {
    question: "Що таке франшиза?",
    answer:
      "Франшиза — це частина збитку, яку ви покриваєте самостійно при страховій події. Що більша франшиза, то дешевший поліс. Розмір франшизи обирається при оформленні.",
    questionEn: "What is a deductible?",
    answerEn:
      "A deductible is the portion of the loss that you cover yourself in an insured event. The higher the deductible, the cheaper the policy. The deductible amount is chosen when purchasing the policy.",
  },
];

const FAQ_MINI_KASKO: FaqItem[] = [
  {
    question: "Що таке міні-КАСКО?",
    answer:
      "Міні-КАСКО — це бюджетне часткове автокаско. Воно покриває ключові ризики (залежно від програми — ДТП з вашої вини та/або не з вашої вини, у деяких страхових також воєнні ризики) за значно нижчою ціною, ніж повне КАСКО.",
    questionEn: "What is mini-CASCO?",
    answerEn:
      "Mini-CASCO is a budget-friendly partial CASCO. It covers key risks (depending on the program — a road accident that is your fault and/or not your fault, and with some insurers military risks as well) at a much lower price than full CASCO.",
  },
  {
    question: "Чим міні-КАСКО відрізняється від повного КАСКО?",
    answer:
      "Міні-КАСКО покриває обмежений перелік ризиків, тому коштує дешевше. Повне КАСКО дає максимально широкий захист (ДТП, викрадення, стихія тощо). Обирайте залежно від бюджету та потрібного рівня захисту.",
    questionEn: "How does mini-CASCO differ from full CASCO?",
    answerEn:
      "Mini-CASCO covers a limited list of risks, so it costs less. Full CASCO provides the broadest possible protection (road accidents, theft, natural disasters, etc.). Choose based on your budget and the level of protection you need.",
  },
  {
    question: "Які ризики покриває поліс?",
    answer:
      "Залежить від обраної страхової та програми: одні покривають пошкодження лише з вашої вини, інші — і з вашої, і не з вашої, окремі програми додають покриття воєнних ризиків. Точний перелік вказано в описі кожної пропозиції.",
    questionEn: "Which risks does the policy cover?",
    answerEn:
      "It depends on the chosen insurer and program: some cover damage only when it is your fault, others cover both your fault and not your fault, and certain programs add coverage for military risks. The exact list is stated in the description of each offer.",
  },
  {
    question: "Як оформити міні-КАСКО онлайн?",
    answer:
      "Вкажіть місто та дані авто, оберіть суму покриття й пропозицію страхової, заповніть дані та оплатіть онлайн. Оформлення займає кілька хвилин.",
    questionEn: "How do I buy mini-CASCO online?",
    answerEn:
      "Enter your city and car details, choose the coverage amount and an insurer's offer, fill in the details, and pay online. The purchase takes a few minutes.",
  },
];

const FAQ_GREENCARD: FaqItem[] = [
  {
    question: "Що таке Зелена карта?",
    answer:
      "Зелена карта — це міжнародний поліс страхування цивільної відповідальності водія, який діє за кордоном. Він обов'язковий для в'їзду в більшість країн Європи власним автомобілем.",
    questionEn: "What is a Green Card?",
    answerEn:
      "A Green Card is an international driver's civil liability insurance policy that is valid abroad. It is mandatory for entering most European countries in your own car.",
  },
  {
    question: "У яких країнах діє Зелена карта?",
    answer:
      "Поліс діє в країнах-учасницях міжнародної системи «Зелена карта» (уся Європа та низка інших країн). При оформленні ви обираєте потрібну зону/напрямок поїздки.",
    questionEn: "In which countries is the Green Card valid?",
    answerEn:
      "The policy is valid in the member countries of the international Green Card system (all of Europe and a number of other countries). When purchasing, you select the zone/destination of your trip.",
  },
  {
    question: "Від чого залежить ціна?",
    answer:
      "Вартість залежить від країни/зони дії, типу транспортного засобу та строку страхування. Ви обираєте параметри й одразу бачите ціни різних страхових.",
    questionEn: "What determines the price?",
    answerEn:
      "The cost depends on the country/zone of validity, the type of vehicle, and the insurance term. You choose the parameters and immediately see the prices from different insurers.",
  },
  {
    question: "Як швидко я отримаю поліс?",
    answer:
      "Оформлення онлайн займає кілька хвилин. Готовий поліс приходить на ваш email одразу після оплати.",
    questionEn: "How quickly will I receive the policy?",
    answerEn:
      "Buying online takes a few minutes. The ready policy is sent to your email immediately after payment.",
  },
];

const FAQ_TOURISM: FaqItem[] = [
  {
    question: "Що покриває туристичне страхування?",
    answer:
      "Основне покриття — медичні витрати за кордоном (лікування, невідкладна допомога). Залежно від програми додатково можуть покриватися нещасні випадки, втрата багажу, скасування поїздки та інші ризики.",
    questionEn: "What does travel insurance cover?",
    answerEn:
      "The main coverage is medical expenses abroad (treatment, emergency care). Depending on the program, it may additionally cover accidents, lost luggage, trip cancellation, and other risks.",
  },
  {
    question: "Чи потрібна страховка для Шенгену?",
    answer:
      "Так. Для отримання шенгенської візи та в'їзду необхідне медичне страхування з покриттям щонайменше 30 000 євро на весь період поїздки.",
    questionEn: "Do I need insurance for the Schengen area?",
    answerEn:
      "Yes. To obtain a Schengen visa and enter, you need medical insurance with coverage of at least EUR 30,000 for the entire duration of the trip.",
  },
  {
    question: "Яку суму покриття обрати?",
    answer:
      "Мінімум для країн Шенгену — 30 000 євро. Для дальших подорожей або активного відпочинку варто обрати вищу суму. Ви можете порівняти варіанти з різним покриттям.",
    questionEn: "What coverage amount should I choose?",
    answerEn:
      "The minimum for Schengen countries is EUR 30,000. For more distant trips or active recreation, it is worth choosing a higher amount. You can compare options with different coverage.",
  },
  {
    question: "Коли поліс починає діяти?",
    answer:
      "Поліс діє з обраної вами дати початку поїздки й до дати завершення. Оформити його потрібно до виїзду за кордон.",
    questionEn: "When does the policy take effect?",
    answerEn:
      "The policy is valid from the trip start date you choose until the end date. You need to purchase it before travelling abroad.",
  },
];

const FAQ_PETS: FaqItem[] = [
  {
    question: "Що покриває страхування тварин?",
    answer:
      "Поліс покриває ветеринарні витрати та лікування вашого улюбленця у разі хвороби чи нещасного випадку, згідно з умовами обраної програми.",
    questionEn: "What does pet insurance cover?",
    answerEn:
      "The policy covers veterinary expenses and treatment for your pet in the event of illness or an accident, in accordance with the terms of the chosen program.",
  },
  {
    question: "Яких тварин можна застрахувати?",
    answer:
      "Наразі доступне страхування котів і собак.",
    questionEn: "Which animals can be insured?",
    answerEn:
      "Currently, insurance is available for cats and dogs.",
  },
  {
    question: "Що потрібно для оформлення?",
    answer:
      "Дані про тварину (вид, кличка, дата народження) та ваші контактні дані. Для деяких програм може знадобитися номер чіпа або тавра.",
    questionEn: "What is required to purchase a policy?",
    answerEn:
      "Details about the animal (species, name, date of birth) and your contact details. Some programs may require a microchip or tattoo number.",
  },
  {
    question: "Коли поліс починає діяти?",
    answer:
      "Поліс починає діяти з дати, вказаної при оформленні. Зверніть увагу: у страхуванні тварин зазвичай є період очікування, вказаний в умовах страховика.",
    questionEn: "When does the policy take effect?",
    answerEn:
      "The policy takes effect from the date specified when purchasing. Please note: pet insurance usually has a waiting period, which is stated in the insurer's terms.",
  },
];

const FAQ_HOUSING: FaqItem[] = [
  {
    question: "Що покриває страхування житла?",
    answer:
      "Поліс захищає квартиру чи будинок від пожежі, вибуху, удару блискавки, затоплення (у т.ч. від сусідів), стихійних лих та протиправних дій третіх осіб.",
    questionEn: "What does home insurance cover?",
    answerEn:
      "The policy protects an apartment or house against fire, explosion, lightning strike, flooding (including from neighbours), natural disasters, and unlawful acts by third parties.",
  },
  {
    question: "Можна застрахувати і квартиру, і будинок?",
    answer:
      "Так. При оформленні ви обираєте тип житла — квартира або будинок, — і параметри розрахунку підлаштовуються відповідно.",
    questionEn: "Can I insure both an apartment and a house?",
    answerEn:
      "Yes. When purchasing, you choose the type of property — apartment or house — and the calculation parameters adjust accordingly.",
  },
  {
    question: "Як визначається сума покриття?",
    answer:
      "Ви обираєте суму покриття зі стандартного переліку (від 500 тис. до 5 млн грн) залежно від вартості майна. Від неї залежить максимальна виплата та ціна поліса.",
    questionEn: "How is the coverage amount determined?",
    answerEn:
      "You choose the coverage amount from a standard list (from UAH 500,000 to UAH 5 million) depending on the value of the property. It determines the maximum payout and the price of the policy.",
  },
  {
    question: "Коли поліс починає діяти?",
    answer:
      "Поліс діє з обраної дати початку. Зверніть увагу: окремі страхові приймають оформлення лише з датою старту через кілька днів.",
    questionEn: "When does the policy take effect?",
    answerEn:
      "The policy is valid from the chosen start date. Please note: some insurers only accept purchases with a start date a few days in the future.",
  },
];

export const FAQ_BY_PRODUCT: Record<string, FaqItem[]> = {
  osago: FAQ_OSAGO,
  kasko: FAQ_KASKO,
  "mini-kasko": FAQ_MINI_KASKO,
  "green-card": FAQ_GREENCARD,
  tourism: FAQ_TOURISM,
  pets: FAQ_PETS,
  housing: FAQ_HOUSING,
};

export function faqFor(product: string): FaqItem[] {
  return FAQ_BY_PRODUCT[product] ?? FAQ_OSAGO;
}
