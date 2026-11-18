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

const FAQ_ACCIDENT: FaqItem[] = [
  {
    question: "Що таке страхування від нещасних випадків?",
    answer:
      "Це особисте страхування: якщо застрахована особа отримає травму, тимчасову чи стійку втрату працездатності або загине внаслідок нещасного випадку, страхова виплачує гроші в межах страхової суми. Виплата не залежить від наявності інших полісів.",
    questionEn: "What is accident insurance?",
    answerEn:
      "It is personal insurance: if the insured person suffers an injury, temporary or permanent disability, or dies as a result of an accident, the insurer pays out money within the insured sum. The payout does not depend on any other policies.",
  },
  {
    question: "Кого можна застрахувати?",
    answer:
      "Себе або іншу особу — дитину чи родича — віком від 1 до 75 років. Поліс оформлюється на застраховану особу, а платником може бути ви.",
    questionEn: "Who can be insured?",
    answerEn:
      "Yourself or another person — a child or relative — aged 1 to 75. The policy is issued for the insured person, and you can be the payer.",
  },
  {
    question: "Яку страхову суму обрати?",
    answer:
      "Доступні фіксовані суми від 10 000 до 300 000 грн. Чим більша сума, тим більша виплата при страховому випадку й вища ціна поліса. Для спорту чи роботи з підвищеним ризиком варто обирати більшу суму.",
    questionEn: "Which insured sum should I choose?",
    answerEn:
      "Fixed sums from UAH 10,000 to UAH 300,000 are available. The higher the sum, the bigger the payout in an insured event and the higher the premium. For sports or high-risk work it is worth choosing a larger sum.",
  },
  {
    question: "Які ризики входять у поліс і чи є інвалідність 1–2 групи?",
    answer:
      "Так. Базовий набір — смерть від нещасного випадку та інвалідність 1–2 групи. У калькуляторі можна додати інвалідність 3 групи і тілесні ушкодження (травми), обрати пакет «Лікарняні» (виплата 0,3% суми за день непрацездатності) або «Комплекс» (додатково смерть та інвалідність від хвороби). Для дітей до 18 років — дитяча програма: смерть від НВ, встановлення інвалідності дитині, травми.",
    questionEn: "Which risks are covered, and are disability groups 1–2 included?",
    answerEn:
      "Yes. The base set is death from an accident and disability groups 1–2. In the calculator you can add disability group 3 and injuries, or choose the “Sick leave” package (0.3% of the sum per day of incapacity) or “Complex” (additionally death and disability from illness). For children under 18 there is a child programme: death from an accident, child disability, injuries.",
  },
  {
    question: "Чи покриваються воєнні ризики, спорт, небезпечна робота?",
    answer:
      "Так. При розрахунку оберіть діяльність — заняття спортом (із видом спорту та рівнем) або професію підвищеного ризику — і за потреби додайте воєнні ризики; їх можна поєднувати. Від цього залежать умови та ціна.",
    questionEn: "Are war risks, sports or hazardous work covered?",
    answerEn:
      "Yes. When calculating, choose your activity — sports (with the sport and level) or a high-risk profession — and add war risks if needed; they can be combined. The terms and price depend on it.",
  },
  {
    question: "Коли поліс починає діяти?",
    answer:
      "Не раніше наступного дня після оформлення. Строк — від 10 днів до 1 року, територія — Україна або весь світ.",
    questionEn: "When does the policy take effect?",
    answerEn:
      "No earlier than the day after purchase. The term is from 10 days to 1 year, the territory is Ukraine or worldwide.",
  },
  {
    question: "Скільки коштує поліс від нещасних випадків?",
    answer:
      "Від 159 грн: дитячий поліс на 10 днів зі страховою сумою 50 000 грн. Річний поліс для дорослого на 100 000 грн — близько 1 256 грн, з воєнними ризиками — близько 2 824 грн, для спортсмена-аматора — від 3 766 грн. Точну ціну показує калькулятор.",
    questionEn: "How much does an accident policy cost?",
    answerEn:
      "From UAH 159: a 10-day child policy with an insured sum of UAH 50,000. An annual adult policy for UAH 100,000 is about UAH 1,256, with war risks about UAH 2,824, for an amateur athlete from UAH 3,766. The calculator shows the exact price.",
  },
  {
    question: "Які документи потрібні для оформлення?",
    answer:
      "Паспорт або ID-картка та ідентифікаційний код платника; якщо страхуєте іншу особу — її паспорт або ID-картка та ідентифікаційний код. Поліс електронний: приходить на email і доступний у кабінеті.",
    questionEn: "What documents are needed?",
    answerEn:
      "The payer's passport or ID card and tax number; if you insure another person — their passport or ID card and tax number. The policy is electronic: it arrives by email and is available in your account.",
  },
  {
    question: "Що робити, якщо стався нещасний випадок?",
    answer:
      "Зверніться по медичну допомогу й отримайте документи про травму (виписка, лікарняний). Повідомте страхову компанію у строк, зазначений у договорі, та подайте заяву на виплату з медичними документами. Виплата надходить на картку застрахованої особи або вигодонабувача.",
    questionEn: "What should I do if an accident happens?",
    answerEn:
      "Seek medical help and obtain documents about the injury (discharge summary, sick leave). Notify the insurer within the period stated in the contract and submit a claim with the medical documents. The payout is transferred to the insured person's or beneficiary's card.",
  },
];

export const FAQ_WEAPON: FaqItem[] = [
  {
    question: "Чи обовʼязково страхувати зброю?",
    answer:
      "Так. Громадяни, які мають у власності чи користуванні зброю, зобовʼязані застрахувати свою цивільну відповідальність перед третіми особами. Чинний поліс вимагають при отриманні дозволу на зброю та при кожному його продовженні.",
    questionEn: "Is firearms insurance mandatory?",
    answerEn:
      "Yes. Citizens who own or use firearms must insure their civil liability towards third parties. A valid policy is required when obtaining a firearms permit and at every renewal.",
  },
  {
    question: "Яка зброя підлягає страхуванню?",
    answer:
      "Мисливська гладкоствольна та нарізна, травматична (пристрої для відстрілу гумових куль), газові пістолети й револьвери, пневматична зброя калібру понад 4,5 мм зі швидкістю кулі понад 100 м/с, холодна та нагородна зброя. Кілька одиниць можна включити в один договір.",
    questionEn: "Which weapons must be insured?",
    answerEn:
      "Hunting smoothbore and rifled firearms, traumatic (rubber-bullet) devices, gas pistols and revolvers, pneumatic weapons over 4.5 mm calibre with a muzzle velocity above 100 m/s, cold steel and award weapons. Several units can be covered by one contract.",
  },
  {
    question: "Скільки коштує поліс?",
    answer:
      "Орієнтовно від 100 грн на рік за одну одиницю залежно від страхової суми, строку та страхової компанії. Поліс на 3 роки зазвичай вигідніший і збігається зі строком дії дозволу. Точну вартість менеджер назве після заявки.",
    questionEn: "How much does the policy cost?",
    answerEn:
      "Roughly from UAH 100 a year per unit, depending on the sum insured, term and insurer. A 3-year policy is usually better value and matches the permit term. The manager quotes the exact price after your request.",
  },
  {
    question: "Що покриває страховка?",
    answer:
      "Шкоду життю, здоровʼю або майну третіх осіб, заподіяну внаслідок володіння чи використання зброї. Шкода самому власнику, його зброї або події у стані спʼяніння не покриваються.",
    questionEn: "What does the policy cover?",
    answerEn:
      "Harm to the life, health or property of third parties caused by owning or using the weapon. Harm to the owner, to the weapon itself, or incidents under the influence are not covered.",
  },
  {
    question: "Які документи потрібні?",
    answer:
      "Паспорт або ID-картка та ІПН власника, дозвіл на зброю (номер, ким і коли виданий) і дані зброї: вид, модель, калібр, серійний номер. Фото документів можна надіслати менеджеру в Telegram або Viber.",
    questionEn: "What documents are needed?",
    answerEn:
      "The owner's passport or ID card and tax number, the firearms permit (number, issuer, date) and the weapon details: type, model, calibre, serial number. Photos can be sent to the manager via Telegram or Viber.",
  },
  {
    question: "Як швидко я отримаю поліс?",
    answer:
      "Зазвичай протягом 15–30 хвилин у робочий час після підтвердження даних і оплати. Електронний договір надходить на email, його приймає дозвільна система Національної поліції.",
    questionEn: "How quickly will I get the policy?",
    answerEn:
      "Usually within 15–30 minutes during business hours after the details are confirmed and paid. The electronic contract arrives by email and is accepted by the National Police permit office.",
  },
];

export const FAQ_VIGNETTE: FaqItem[] = [
  {
    question: "Що таке віньєтка і в яких країнах вона потрібна?",
    answer:
      "Віньєтка — це передплата за проїзд автобанами й швидкісними дорогами. Вона обовʼязкова в Австрії, Чехії, Словаччині, Угорщині, Словенії, Швейцарії, Румунії, Болгарії та Молдові. У Польщі, Німеччині, Хорватії, Італії, Франції та Іспанії віньєток немає — там платять за окремі ділянки, мости чи тунелі.",
    questionEn: "What is a vignette and where is it required?",
    answerEn:
      "A vignette is a prepaid toll for motorways and expressways. It is mandatory in Austria, Czechia, Slovakia, Hungary, Slovenia, Switzerland, Romania, Bulgaria and Moldova. Poland, Germany, Croatia, Italy, France and Spain have no vignettes — you pay for specific sections, bridges or tunnels instead.",
  },
  {
    question: "Чи потрібна наліпка на скло?",
    answer:
      "Ні. Усі країни зі списку вже перейшли на електронні віньєтки: вона реєструється на державний номер авто, а камери на дорогах звіряють його з базою автоматично. Достатньо мати підтвердження оператора в телефоні.",
    questionEn: "Do I need a windscreen sticker?",
    answerEn:
      "No. Every country on the list has moved to e-vignettes: it is registered to your plate number and roadside cameras check it against the database automatically. Keep the operator's confirmation on your phone.",
  },
  {
    question: "Скільки коштує віньєтка у 2026 році?",
    answer:
      "Для легкового авто до 3,5 т орієнтовно: Австрія — 10 днів €12.80, 2 місяці €32, рік €106.80; Чехія — 10 днів 310 Kč, 30 днів 440 Kč, рік 2 570 Kč; Словаччина — 10 днів €12, рік €90; Угорщина — 10 днів 6 900 Ft; Словенія — 7 днів €16, рік €117.50; Швейцарія — лише річна, CHF 40; Румунія — 10 днів близько €6; Болгарія — 7 днів €10. Точну суму в гривні назве менеджер.",
    questionEn: "How much does a vignette cost in 2026?",
    answerEn:
      "For a car up to 3.5 t, roughly: Austria — 10 days €12.80, 2 months €32, year €106.80; Czechia — 10 days CZK 310, 30 days CZK 440, year CZK 2,570; Slovakia — 10 days €12, year €90; Hungary — 10 days HUF 6,900; Slovenia — 7 days €16, year €117.50; Switzerland — annual only, CHF 40; Romania — 10 days about €6; Bulgaria — 7 days €10. The manager quotes the exact price in UAH.",
  },
  {
    question: "З якого дня діє віньєтка?",
    answer:
      "З дати, яку ви вкажете в заявці — її можна обрати наперед, до року вперед. Віньєтка на 10 днів діє 10 календарних днів поспіль починаючи з обраної дати, тож оберіть день, коли реально вʼїдете на автобан.",
    questionEn: "From which day is the vignette valid?",
    answerEn:
      "From the date you choose in the request — it can be set in advance, up to a year ahead. A 10-day vignette covers 10 consecutive calendar days from that date, so pick the day you actually enter the motorway.",
  },
  {
    question: "Який штраф за проїзд без віньєтки?",
    answer:
      "Австрія — €120 на місці, до €300 і більше при оскарженні; Чехія — до 20 000 Kč; Словаччина — від €150; Угорщина — 20–30 тис. Ft; Словенія — €300–800; Швейцарія — CHF 200 плюс вартість віньєтки. Камери фіксують номер автоматично, штраф надсилають поштою навіть на українські номери.",
    questionEn: "What is the fine for driving without a vignette?",
    answerEn:
      "Austria — €120 on the spot, €300+ if contested; Czechia — up to CZK 20,000; Slovakia — from €150; Hungary — HUF 20–30k; Slovenia — €300–800; Switzerland — CHF 200 plus the vignette price. Cameras capture the plate automatically and fines are mailed even to Ukrainian-registered cars.",
  },
  {
    question: "Що потрібно, щоб оформити?",
    answer:
      "Державний номер авто, країна реєстрації, тип авто (легкове, мотоцикл, кемпер), країни маршруту, строк і дата початку. Паспорт чи техпаспорт не потрібні. Після оплати в гривні менеджер реєструє віньєтку в офіційного оператора й надсилає підтвердження в Telegram, Viber або на email.",
    questionEn: "What do I need to apply?",
    answerEn:
      "Your plate number, country of registration, vehicle type (car, motorcycle, camper), countries on the route, period and start date. No passport or registration certificate needed. After payment in UAH the manager registers the vignette with the official operator and sends the confirmation via Telegram, Viber or email.",
  },
  {
    question: "Авто понад 3,5 т або з причепом — теж віньєтка?",
    answer:
      "Для авто понад 3,5 т в Австрії, Чехії, Словаччині, Угорщині та Словенії діє дорожній збір за кілометр (GO-Box, Mýto, HU-GO, DarsGo) — це окрема реєстрація, допоможемо з нею вручну. Причіп до легкового авто в більшості країн додаткової віньєтки не потребує, крім Словенії (клас 2B для авто з причепом заввишки понад 1,3 м).",
    questionEn: "Over 3.5 t or with a trailer — also a vignette?",
    answerEn:
      "Vehicles over 3.5 t in Austria, Czechia, Slovakia, Hungary and Slovenia pay a per-kilometre toll (GO-Box, Mýto, HU-GO, DarsGo) — a separate registration we help with manually. A trailer behind a car needs no extra vignette in most countries, except Slovenia (class 2B for cars over 1.3 m high with a trailer).",
  },
];

export const FAQ_PASSENGERS: FaqItem[] = [
  { question: "Хто зобовʼязаний страхувати пасажирів?", answer: "Усі перевізники, які перевозять пасажирів за плату: автобуси міських, приміських, міжміських і міжнародних маршрутів, маршрутки, таксі, а також підприємства зі службовим транспортом для перевезення працівників. Це обовʼязкове особисте страхування від нещасних випадків на транспорті.", questionEn: "Who must insure passengers?", answerEn: "Every carrier that transports passengers for a fee: urban, suburban, intercity and international buses, minibuses, taxis, and companies with staff shuttle transport. It is compulsory personal accident insurance on transport." },
  { question: "Що покриває договір?", answer: "Тимчасову втрату працездатності, інвалідність і загибель пасажира чи водія внаслідок нещасного випадку під час поїздки, посадки й висадки. Виплата — у відсотках від страхової суми на кожну особу залежно від тяжкості.", questionEn: "What does the contract cover?", answerEn: "Temporary disability, permanent disability and death of a passenger or driver due to an accident during the trip, boarding and alighting. The payout is a percentage of the sum insured per person depending on severity." },
  { question: "Скільки це коштує?", answer: "Вартість залежить від виду перевезень, кількості транспортних засобів і місць. Для невеликого парку таксі чи кількох маршруток це зазвичай від кількох тисяч гривень на рік за весь парк. Точну суму менеджер назве після заявки з переліком транспорту.", questionEn: "How much does it cost?", answerEn: "The price depends on the type of transport, the number of vehicles and seats. For a small taxi fleet or a few minibuses it is usually a few thousand hryvnias a year for the whole fleet. The manager quotes the exact amount after a request with the vehicle list." },
  { question: "Чи потрібен окремий договір на кожен автобус?", answer: "Ні. Укладається один договір на перевізника з переліком транспорту в додатку. Протягом року транспорт можна додавати чи виключати додатковою угодою.", questionEn: "Is a separate contract needed for each bus?", answerEn: "No. One contract is concluded per carrier with the vehicle list as an annex. Vehicles can be added or removed during the year by an addendum." },
  { question: "Що буде без поліса?", answer: "Без чинного договору не видадуть і не продовжать ліцензію на пасажирські перевезення, а під час перевірки Укртрансбезпеки перевізник отримає штраф. У разі ДТП виплати потерпілим пасажирам доведеться платити зі своєї кишені.", questionEn: "What happens without a policy?", answerEn: "Without a valid contract the passenger transport licence is neither issued nor renewed, and an inspection results in a fine. In an accident, compensation to injured passengers comes out of the carrier's own pocket." },
];

export const FAQ_CMR: FaqItem[] = [
  { question: "Що таке CMR-страхування і кому воно потрібне?", answer: "Це страхування відповідальності автомобільного перевізника за вантаж за Конвенцією CMR про міжнародне дорожнє перевезення вантажів. Потрібне всім, хто возить чужі вантажі за кордон, а для внутрішніх перевезень — аналогічний поліс відповідальності за українським законодавством. Експедитори й замовники в Європі не дають вантаж без чинного поліса.", questionEn: "What is CMR insurance and who needs it?", answerEn: "It is insurance of a road carrier's liability for cargo under the CMR Convention on international carriage of goods by road. Needed by everyone who hauls third-party cargo abroad; for domestic transport a similar liability policy under Ukrainian law applies. European forwarders and clients do not release cargo without a valid policy." },
  { question: "Який ліміт відповідальності обрати?", answer: "За Конвенцією CMR відповідальність перевізника обмежена 8,33 SDR за кілограм ваги вантажу (близько €10 за кг), але замовники часто вимагають ліміт на подію від €100 000 до €1 000 000. Для збірних і генеральних вантажів зазвичай достатньо €250 000, для техніки, алкоголю чи тютюну просять €500 000 і більше.", questionEn: "Which liability limit should I choose?", answerEn: "Under the CMR Convention the carrier's liability is limited to 8.33 SDR per kilogram (about €10/kg), but clients often require a per-event limit from €100,000 to €1,000,000. For groupage and general cargo €250,000 is usually enough; for electronics, alcohol or tobacco €500,000 or more is requested." },
  { question: "Скільки коштує поліс CMR?", answer: "Залежить від кількості тягачів, території, типу вантажів, ліміту й збитковості за попередні роки. Орієнтовно від кількох сотень доларів на рік за один тягач для перевезень Європою зі стандартним лімітом. Точний розрахунок — за 1 робочий день після заявки.", questionEn: "How much does a CMR policy cost?", answerEn: "It depends on the number of trucks, territory, cargo type, limit and loss history. Roughly from a few hundred dollars a year per truck for European haulage with a standard limit. An exact quote is ready within one business day." },
  { question: "Чи покриваються рефрижератори та небезпечні вантажі?", answer: "Так, розширеннями до договору: поломка рефрижераторної установки з псуванням вантажу та перевезення небезпечних вантажів за ADR. Про такі перевезення треба повідомити при розрахунку.", questionEn: "Are reefers and dangerous goods covered?", answerEn: "Yes, via extensions: reefer unit failure with cargo spoilage and dangerous goods under ADR. Tell us about such transport when requesting a quote." },
  { question: "Чи визнають поліс українських страхових у Європі?", answer: "Так, якщо страхова має міжнародне перестрахування й англомовний сертифікат — саме з такими ми працюємо. Сертифікат приймають експедитори ЄС, біржі вантажів і митні брокери.", questionEn: "Is a Ukrainian insurer's policy recognised in Europe?", answerEn: "Yes, if the insurer has international reinsurance and an English certificate — those are the insurers we work with. The certificate is accepted by EU forwarders, freight exchanges and customs brokers." },
];

export const FAQ_COLLATERAL: FaqItem[] = [
  { question: "Навіщо страхувати заставне майно?", answer: "Це умова кредитного чи лізингового договору: банк хоче бути впевненим, що в разі пожежі, затоплення чи ДТП борг буде погашено страховою виплатою. Договір укладається на користь банку як вигодонабувача і продовжується щороку до погашення кредиту.", questionEn: "Why insure collateral?", answerEn: "It is a condition of the loan or lease agreement: the bank wants assurance that in case of fire, flooding or an accident the debt is repaid from the insurance payout. The contract is concluded with the bank as beneficiary and renewed annually until the loan is repaid." },
  { question: "Чи обовʼязково страхуватись у страховій, яку пропонує банк?", answer: "Ні. Банк має перелік акредитованих страхових, і ви можете обрати будь-яку з нього. Ми порівнюємо кілька акредитованих страхових і підбираємо дешевшу з умовами, які банк приймає.", questionEn: "Do I have to use the insurer the bank suggests?", answerEn: "No. The bank has a list of accredited insurers and you may choose any of them. We compare several accredited insurers and pick a cheaper one with terms the bank accepts." },
  { question: "Скільки коштує страхування іпотечної квартири?", answer: "Орієнтовно 0,2–0,5% від вартості нерухомості на рік залежно від банку, матеріалу будинку, поверху й наявності оздоблення в покритті. Для авто в кредиті оформлюється повне КАСКО, його вартість залежить від марки, року й міста.", questionEn: "How much does mortgaged flat insurance cost?", answerEn: "Roughly 0.2–0.5% of the property value per year depending on the bank, building material, floor and whether finishes are covered. For a financed car full CASCO is issued; its price depends on make, year and city." },
  { question: "Що буде, якщо прострочити продовження?", answer: "Банк нараховує штраф або підвищує ставку за кредитом згідно з договором, а деякі банки страхують майно самі за вищим тарифом і списують суму з рахунку. Ми нагадуємо про продовження за місяць і надсилаємо новий розрахунок.", questionEn: "What if I miss the renewal?", answerEn: "The bank charges a penalty or raises the loan rate per the agreement, and some banks insure the asset themselves at a higher tariff and debit your account. We remind you a month in advance and send a fresh quote." },
  { question: "Які документи потрібні?", answer: "Кредитний або лізинговий договір (сторінки з вимогами до страхування), документи на майно — витяг з реєстру нерухомості чи техпаспорт авто, паспорт та ІПН позичальника. Фото в месенджер достатньо, договір надходить на email і в банк.", questionEn: "What documents are needed?", answerEn: "The loan or lease agreement (pages with insurance requirements), asset documents — a property registry extract or vehicle registration, the borrower's passport and tax number. Photos by messenger are enough; the contract is emailed to you and the bank." },
];

export const FAQ_FOREIGNERS_MEDICAL: FaqItem[] = [
  { question: "Коли іноземцю обовʼязково потрібен медичний поліс?", answer: "При оформленні та продовженні посвідки на тимчасове чи постійне проживання, при отриманні довгострокової візи D у консульстві, а також при працевлаштуванні: роботодавець подає поліс іноземця разом із заявою на дозвіл на застосування праці іноземця. Поліс має діяти на весь строк перебування чи роботи.", questionEn: "When must a foreigner have medical insurance?", answerEn: "When applying for or renewing a temporary or permanent residence permit, when obtaining a long-term type D visa at a consulate, and for employment: the employer files the foreigner's policy with the work permit application. The policy must cover the whole period of stay or work." },
  { question: "Я роботодавець і наймаю іноземців. Як застрахувати працівників?", answer: "Одним договором на всіх іноземних працівників на строк дозволу на працевлаштування. Надішліть список працівників і копії паспортів — ми оформимо поліси, виставимо рахунок на компанію й надамо акт. При зміні складу працівників договір коригується додатковою угодою.", questionEn: "I am an employer hiring foreigners. How do I insure the staff?", answerEn: "With one contract for all foreign employees for the work permit term. Send the staff list and passport copies — we issue the policies, invoice the company and provide an act. Staff changes are handled by an addendum." },
  { question: "Що покриває поліс?", answer: "Невідкладну медичну допомогу при раптовому захворюванні чи травмі: виклик швидкої, амбулаторне лікування, стаціонар, невідкладну стоматологію, медикаменти, а також медичну евакуацію та репатріацію. Планове лікування хронічних хвороб не покривається.", questionEn: "What does the policy cover?", answerEn: "Emergency medical care for sudden illness or injury: ambulance, outpatient treatment, hospital, emergency dentistry, medication, plus medical evacuation and repatriation. Planned treatment of chronic conditions is not covered." },
  { question: "Скільки коштує і на який строк можна оформити?", answer: "На 3, 6 або 12 місяців. Вартість залежить від строку, віку та суми покриття; для працездатного віку річний поліс коштує орієнтовно від кількох тисяч гривень. Точну суму менеджер назве після заявки.", questionEn: "How much does it cost and for how long?", answerEn: "For 3, 6 or 12 months. The price depends on term, age and sum insured; for working-age adults an annual policy costs roughly from a few thousand hryvnias. The manager quotes the exact amount after your request." },
  { question: "Чи приймає такий поліс міграційна служба?", answer: "Так. Договір укладається з українською страховою за формою, яка відповідає вимогам до страхування іноземців та осіб без громадянства, і видається українською та англійською мовами. Його приймають ДМС, центри зайнятості й консульства.", questionEn: "Does the Migration Service accept this policy?", answerEn: "Yes. The contract is concluded with a Ukrainian insurer in the form that meets the requirements for insuring foreigners and stateless persons, and is issued in Ukrainian and English. It is accepted by the Migration Service, Employment Centres and consulates." },
];

export const FAQ_BY_PRODUCT: Record<string, FaqItem[]> = {
  osago: FAQ_OSAGO,
  kasko: FAQ_KASKO,
  "mini-kasko": FAQ_MINI_KASKO,
  "green-card": FAQ_GREENCARD,
  tourism: FAQ_TOURISM,
  pets: FAQ_PETS,
  housing: FAQ_HOUSING,
  accident: FAQ_ACCIDENT,
  weapon: FAQ_WEAPON,
  vignette: FAQ_VIGNETTE,
  passengers: FAQ_PASSENGERS,
  cmr: FAQ_CMR,
  collateral: FAQ_COLLATERAL,
  "foreigners-medical": FAQ_FOREIGNERS_MEDICAL,
};

export function faqFor(product: string): FaqItem[] {
  return FAQ_BY_PRODUCT[product] ?? FAQ_OSAGO;
}
