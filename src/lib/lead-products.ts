// Продукти «через заявку»: онлайн-розрахунку в Ukasko для них немає (або він
// індивідуальний), тож сторінка збирає параметри й телефон → менеджер рахує
// і оформлює. Один конфіг на продукт: копірайт героя, поля форми, переваги,
// документи, SEO. Без іконок і node-залежностей — імпортується і клієнтом,
// і сервером (валідація полів в API).

export type Tr = { uk: string; en: string };

export type LeadField =
  | { key: string; type: "select"; label: Tr; options: { value: string; label: Tr }[]; required?: boolean }
  | { key: string; type: "chips"; label: Tr; options: { value: string; label: Tr }[]; multiple?: boolean; required?: boolean }
  | { key: string; type: "number"; label: Tr; placeholder?: string; min?: number; max?: number; suffix?: Tr; required?: boolean }
  | { key: string; type: "text"; label: Tr; placeholder?: Tr; maxLength?: number; required?: boolean };

export interface LeadProductConfig {
  slug: string;
  /** Назва для меню/футера/Telegram. */
  label: Tr;
  /** Коротко в меню. */
  menuDesc: Tr;
  /** Герой. */
  badge: Tr;
  titleLead: Tr;
  titleHighlight: Tr;
  subtitle: Tr;
  pills: Tr[];
  fields: LeadField[];
  cta: Tr;
  afterSubmit: Tr;
  /** Переваги (3–6). */
  benefitsTitle: Tr;
  benefitsSubtitle: Tr;
  benefits: { title: Tr; desc: Tr }[];
  /** Що потрібно для оформлення. */
  docsTitle: Tr;
  docsSubtitle: Tr;
  docs: Tr[];
  /** SEO. */
  seo: { title: string; description: string; keywords: string[]; serviceType: string; audience: string; breadcrumb: string };
  /** Ключ у FAQ_BY_PRODUCT. */
  faqKey: string;
  faqSubtitle: string;
  /** Emoji для Telegram-повідомлення. */
  emoji: string;
}

const T = (uk: string, en: string): Tr => ({ uk, en });

export const LEAD_PRODUCTS: Record<string, LeadProductConfig> = {
  passengers: {
    slug: "passengers",
    label: T("Пасажири", "Passengers"),
    menuDesc: T("Автобуси, маршрутки, таксі", "Buses, minibuses, taxis"),
    badge: T("Обовʼязкове для перевізників", "Mandatory for carriers"),
    titleLead: T("Страхування пасажирів", "Passenger insurance"),
    titleHighlight: T("від нещасних випадків на транспорті", "against accidents on transport"),
    subtitle: T(
      "Обовʼязкове особисте страхування пасажирів і водіїв для автобусів, маршруток і таксі. Потрібне для ліцензії перевізника й перевірок Укртрансбезпеки. Договір на весь парк — одна заявка.",
      "Compulsory personal accident insurance for passengers and drivers of buses, minibuses and taxis. Required for the carrier licence and inspections. One request covers the whole fleet.",
    ),
    pills: [T("автобуси й маршрутки", "buses & minibuses"), T("таксі", "taxis"), T("весь парк одним договором", "whole fleet in one contract"), T("для ліцензії", "for the licence")],
    fields: [
      { key: "routeType", type: "chips", label: T("Вид перевезень (можна кілька)", "Type of transport (select several)"), multiple: true, required: true, options: [
        { value: "city", label: T("Міські", "Urban") }, { value: "suburban", label: T("Приміські", "Suburban") }, { value: "intercity", label: T("Міжміські", "Intercity") },
        { value: "international", label: T("Міжнародні", "International") }, { value: "taxi", label: T("Таксі", "Taxi") }, { value: "corporate", label: T("Службові / корпоративні", "Corporate") },
      ] },
      { key: "vehicles", type: "number", label: T("Кількість транспортних засобів", "Number of vehicles"), min: 1, max: 999, required: true, placeholder: "1" },
      { key: "seats", type: "number", label: T("Загальна кількість місць", "Total number of seats"), min: 1, max: 99999, placeholder: "20" },
      { key: "company", type: "text", label: T("Компанія або ФОП", "Company or sole trader"), placeholder: T("ТОВ «Перевізник»", "Carrier LLC"), maxLength: 120 },
    ],
    cta: T("Отримати розрахунок", "Get a quote"),
    afterSubmit: T("Менеджер зв'яжеться, уточнить дані про парк і надішле розрахунок від кількох страхових. Договір укладемо дистанційно.", "A manager will contact you, confirm the fleet details and send quotes from several insurers. The contract is concluded remotely."),
    benefitsTitle: T("Навіщо перевізнику поліс", "Why a carrier needs the policy"),
    benefitsSubtitle: T("Обовʼязкове особисте страхування від нещасних випадків на транспорті — для всіх, хто перевозить пасажирів за плату.", "Compulsory personal accident insurance on transport — for everyone who carries passengers for a fee."),
    benefits: [
      { title: T("Вимога ліцензії", "Licence requirement"), desc: T("Без чинного договору не видадуть і не продовжать ліцензію на перевезення, а при перевірці Укртрансбезпеки — штраф.", "Without a valid contract the transport licence is neither issued nor renewed, and inspections result in fines.") },
      { title: T("Пасажири і водій", "Passengers and driver"), desc: T("Виплата при травмі, інвалідності чи загибелі пасажира або водія під час поїздки, посадки й висадки.", "A payout for injury, disability or death of a passenger or driver during the trip, boarding and alighting.") },
      { title: T("Весь парк одразу", "Whole fleet at once"), desc: T("Один договір на всі автобуси чи авто таксі — додати або прибрати транспорт можна протягом року.", "One contract for all buses or taxis — vehicles can be added or removed during the year.") },
      { title: T("Без візитів", "No visits"), desc: T("Дані парку надсилаєте в месенджер, договір і рахунок отримуєте на email.", "Send the fleet details by messenger, receive the contract and invoice by email.") },
    ],
    docsTitle: T("Що потрібно для оформлення", "What you need to apply"),
    docsSubtitle: T("Менеджер надішле шаблон переліку транспорту — заповнити можна за 10 хвилин.", "The manager sends a fleet list template — it takes 10 minutes to fill in."),
    docs: [T("Реквізити компанії або ФОП (ЄДРПОУ / РНОКПП)", "Company or sole trader details (registration code)"), T("Перелік транспорту: марка, держномер, кількість місць", "Vehicle list: make, plate, number of seats"), T("Ліцензія на перевезення (номер) або заявка на неї", "Transport licence number or application")],
    seo: {
      title: "Страхування пасажирів від нещасних випадків — для автобусів, маршруток і таксі",
      description: "Обовʼязкове особисте страхування пасажирів і водіїв на транспорті для перевізників: автобуси, маршрутки, таксі, міжнародні рейси. Договір на весь парк, оформлення дистанційно, розрахунок від кількох страхових.",
      keywords: ["страхування пасажирів", "обов'язкове страхування пасажирів", "страхування пасажирів автобуса", "страхування від нещасних випадків на транспорті", "страхування для перевізників", "страхування пасажирів таксі", "поліс перевізника"],
      serviceType: "Обовʼязкове особисте страхування від нещасних випадків на транспорті",
      audience: "Перевізники пасажирів: автобуси, маршрутки, таксі",
      breadcrumb: "Страхування пасажирів",
    },
    faqKey: "passengers",
    faqSubtitle: "Усе, що потрібно знати перевізнику",
    emoji: "🚌",
  },

  cmr: {
    slug: "cmr",
    label: T("CMR-страхування", "CMR insurance"),
    menuDesc: T("Відповідальність перевізника", "Carrier liability"),
    badge: T("Для міжнародних і внутрішніх перевезень", "For international and domestic haulage"),
    titleLead: T("CMR-страхування", "CMR insurance"),
    titleHighlight: T("відповідальності автоперевізника", "of road carrier liability"),
    subtitle: T(
      "Захист перевізника за втрату, пошкодження чи затримку вантажу за Конвенцією CMR. Його вимагають експедитори й замовники в Європі — без поліса вантаж не дадуть. Ліміти від €100 000 до €1 000 000 на кожен випадок.",
      "Protects the carrier against loss, damage or delay of cargo under the CMR Convention. Forwarders and clients across Europe require it — no policy, no cargo. Limits from €100,000 to €1,000,000 per event.",
    ),
    pills: [T("Європа · Україна · СНД", "Europe · Ukraine · CIS"), T("ліміт до €1 000 000", "limit up to €1,000,000"), T("на весь парк", "whole fleet"), T("визнають експедитори", "accepted by forwarders")],
    fields: [
      { key: "territory", type: "chips", label: T("Територія перевезень (можна кілька)", "Territory (select several)"), multiple: true, required: true, options: [
        { value: "ua", label: T("Україна", "Ukraine") }, { value: "eu", label: T("Європа", "Europe") }, { value: "cis", label: T("СНД / Азія", "CIS / Asia") },
      ] },
      { key: "limit", type: "select", label: T("Ліміт відповідальності", "Liability limit"), required: true, options: [
        { value: "100000", label: T("€100 000", "€100,000") }, { value: "250000", label: T("€250 000", "€250,000") }, { value: "500000", label: T("€500 000", "€500,000") }, { value: "1000000", label: T("€1 000 000", "€1,000,000") },
      ] },
      { key: "trucks", type: "number", label: T("Кількість тягачів / авто", "Number of trucks"), min: 1, max: 999, required: true, placeholder: "1" },
      { key: "cargo", type: "select", label: T("Основний тип вантажів", "Main cargo type"), options: [
        { value: "general", label: T("Генеральні / збірні", "General / groupage") }, { value: "reefer", label: T("Рефрижераторні", "Refrigerated") }, { value: "adr", label: T("Небезпечні (ADR)", "Dangerous goods (ADR)") },
        { value: "valuable", label: T("Цінні (техніка, алкоголь, тютюн)", "High-value (electronics, alcohol, tobacco)") }, { value: "other", label: T("Інше", "Other") },
      ] },
      { key: "company", type: "text", label: T("Компанія або ФОП", "Company or sole trader"), placeholder: T("ТОВ «Транс-Логістик»", "Trans-Logistics LLC"), maxLength: 120 },
    ],
    cta: T("Отримати розрахунок", "Get a quote"),
    afterSubmit: T("Менеджер зв'яжеться, уточнить територію, вантажі й парк і надішле пропозиції від страхових, які визнають європейські експедитори.", "A manager will contact you, confirm the territory, cargo and fleet, and send offers from insurers recognised by European forwarders."),
    benefitsTitle: T("Що покриває CMR-страхування", "What CMR insurance covers"),
    benefitsSubtitle: T("Відповідальність перевізника за вантаж за Конвенцією CMR і внутрішнім законодавством.", "The carrier's liability for cargo under the CMR Convention and domestic law."),
    benefits: [
      { title: T("Втрата й пошкодження вантажу", "Loss and damage"), desc: T("ДТП, пожежа, крадіжка, перекидання, пошкодження при завантаженні чи розвантаженні.", "Accidents, fire, theft, rollover, damage during loading or unloading.") },
      { title: T("Затримка доставки", "Delivery delay"), desc: T("Відшкодування збитків замовника за прострочення строку за ст. 23 Конвенції CMR.", "Compensation of the client's losses for late delivery under Art. 23 of the CMR Convention.") },
      { title: T("Митні платежі", "Customs duties"), desc: T("Мито й податки, нараховані через втрату вантажу під митним контролем (TIR, T1).", "Duties and taxes charged due to cargo lost under customs control (TIR, T1).") },
      { title: T("Витрати на порятунок", "Salvage costs"), desc: T("Перевантаження, зберігання, утилізація пошкодженого вантажу, юридичний захист.", "Reloading, storage, disposal of damaged cargo, legal defence.") },
      { title: T("Рефрижератори та ADR", "Reefers and ADR"), desc: T("Розширення на поломку рефустановки й перевезення небезпечних вантажів.", "Extensions for reefer unit failure and dangerous goods.") },
      { title: T("Визнають у Європі", "Recognised in Europe"), desc: T("Поліси страхових з міжнародним перестрахуванням — приймають експедитори ЄС і біржі вантажів.", "Policies with international reinsurance — accepted by EU forwarders and freight exchanges.") },
    ],
    docsTitle: T("Що потрібно для розрахунку", "What is needed for a quote"),
    docsSubtitle: T("Розрахунок — за 1 робочий день, оформлення — дистанційно.", "Quote within 1 business day, contract concluded remotely."),
    docs: [T("Реквізити компанії, ліцензія на міжнародні перевезення", "Company details, international haulage licence"), T("Перелік тягачів і причепів (держномери, рік)", "List of trucks and trailers (plates, year)"), T("Напрямки, типи вантажів, орієнтовний річний оборот перевезень", "Routes, cargo types, approximate annual freight turnover")],
    seo: {
      title: "CMR-страхування відповідальності автоперевізника — ліміт до €1 000 000",
      description: "Страхування відповідальності автомобільного перевізника за вантаж (CMR) для міжнародних і внутрішніх перевезень: втрата, пошкодження, затримка, митні платежі. Ліміти €100 000 – €1 000 000, визнають європейські експедитори. Розрахунок за 1 день.",
      keywords: ["CMR страхування", "страхування відповідальності перевізника", "страхування CMR ціна", "страхування вантажоперевізника", "ЦМР страховка", "страхування відповідальності автоперевізника", "страховка для міжнародних перевезень"],
      serviceType: "Страхування відповідальності автомобільного перевізника (CMR)",
      audience: "Автоперевізники та експедитори",
      breadcrumb: "CMR-страхування",
    },
    faqKey: "cmr",
    faqSubtitle: "Усе, що потрібно знати про CMR-страхування",
    emoji: "🚛",
  },

  collateral: {
    slug: "collateral",
    label: T("Заставне майно", "Collateral insurance"),
    menuDesc: T("Для кредиту чи іпотеки", "For a loan or mortgage"),
    badge: T("Вимога банку за кредитом", "Bank requirement for a loan"),
    titleLead: T("Страхування заставного майна", "Collateral insurance"),
    titleHighlight: T("для кредиту, іпотеки чи лізингу", "for a loan, mortgage or lease"),
    subtitle: T(
      "Квартира в іпотеці, авто в кредиті, обладнання чи товари в заставі — банк вимагає страхування на користь кредитора щороку. Підберемо страхову з переліку акредитованих вашим банком і оформимо дистанційно.",
      "A mortgaged flat, a financed car, pledged equipment or goods — the bank requires insurance in its favour every year. We choose an insurer accredited by your bank and arrange everything remotely.",
    ),
    pills: [T("акредитовані банком страхові", "bank-accredited insurers"), T("іпотека · автокредит · лізинг", "mortgage · car loan · leasing"), T("щорічне продовження", "annual renewal"), T("банк — вигодонабувач", "bank as beneficiary")],
    fields: [
      { key: "asset", type: "chips", label: T("Що в заставі", "What is pledged"), required: true, options: [
        { value: "flat", label: T("Квартира / будинок", "Flat / house") }, { value: "car", label: T("Автомобіль", "Car") }, { value: "commercial", label: T("Комерційна нерухомість", "Commercial property") },
        { value: "equipment", label: T("Обладнання / техніка", "Equipment / machinery") }, { value: "goods", label: T("Товари в обороті", "Goods in circulation") }, { value: "other", label: T("Інше", "Other") },
      ] },
      { key: "bank", type: "text", label: T("Банк або лізингова компанія", "Bank or leasing company"), placeholder: T("ПриватБанк, Ощадбанк, OTP…", "PrivatBank, Oschadbank, OTP…"), maxLength: 80, required: true },
      { key: "value", type: "number", label: T("Орієнтовна вартість майна", "Approximate asset value"), min: 1000, max: 999_000_000, placeholder: "1 500 000", suffix: T("₴", "UAH") },
      { key: "term", type: "select", label: T("Строк", "Term"), options: [
        { value: "1y", label: T("1 рік (щорічне продовження)", "1 year (annual renewal)") }, { value: "loan", label: T("На весь строк кредиту", "Whole loan term") },
      ] },
    ],
    cta: T("Підібрати страхову", "Find an insurer"),
    afterSubmit: T("Менеджер уточнить вимоги вашого банку до договору, надішле пропозиції акредитованих страхових і оформить поліс із банком як вигодонабувачем.", "A manager will check your bank's requirements, send offers from accredited insurers and issue the policy with the bank as beneficiary."),
    benefitsTitle: T("Як працює страхування застави", "How collateral insurance works"),
    benefitsSubtitle: T("Договір на користь банку: якщо з майном щось станеться, виплата покриває борг, а залишок — вам.", "A contract in the bank's favour: if something happens to the asset, the payout covers the debt and the balance goes to you."),
    benefits: [
      { title: T("Під вимоги банку", "To the bank's requirements"), desc: T("Кожен банк має перелік акредитованих страхових і свої умови до договору — підбираємо так, щоб банк прийняв з першого разу.", "Every bank has a list of accredited insurers and contract conditions — we match them so the bank accepts the policy first time.") },
      { title: T("Дешевше, ніж у відділенні", "Cheaper than at the branch"), desc: T("Порівнюємо кілька акредитованих страхових замість однієї, яку пропонує менеджер банку.", "We compare several accredited insurers instead of the single one the bank manager offers.") },
      { title: T("Нерухомість", "Property"), desc: T("Пожежа, затоплення, стихія, протиправні дії третіх осіб — конструктив і оздоблення за вимогою банку.", "Fire, flooding, natural disasters, third-party actions — structure and finishes as the bank requires.") },
      { title: T("Авто в кредиті", "Financed cars"), desc: T("Повне КАСКО з банком як вигодонабувачем, без франшизи або з мінімальною за вимогою кредитора.", "Full CASCO with the bank as beneficiary, zero or minimal deductible as the lender requires.") },
      { title: T("Бізнес-застава", "Business collateral"), desc: T("Обладнання, транспорт, товари в обороті, комерційна нерухомість — під кредитні лінії та лізинг.", "Equipment, vehicles, goods in circulation, commercial property — for credit lines and leasing.") },
      { title: T("Нагадаємо про продовження", "Renewal reminders"), desc: T("За місяць до закінчення — новий розрахунок, щоб не отримати штраф від банку за прострочення.", "A month before expiry — a fresh quote, so you avoid the bank's late-renewal penalty.") },
    ],
    docsTitle: T("Що потрібно для оформлення", "What you need to apply"),
    docsSubtitle: T("Достатньо фото документів у месенджер.", "Photos of the documents by messenger are enough."),
    docs: [T("Кредитний або лізинговий договір (сторінки з вимогами до страхування)", "Loan or lease agreement (pages with insurance requirements)"), T("Документи на майно: витяг з реєстру / техпаспорт", "Asset documents: registry extract / vehicle registration"), T("Паспорт та ІПН позичальника", "Borrower's passport and tax number")],
    seo: {
      title: "Страхування заставного майна для банку — іпотека, автокредит, лізинг",
      description: "Страхування застави на користь банку: квартира в іпотеці, авто в кредиті, обладнання, товари в обороті, комерційна нерухомість. Підбір акредитованих вашим банком страхових, оформлення дистанційно, щорічне продовження.",
      keywords: ["страхування заставного майна", "страхування застави", "страхування іпотеки", "страхування квартири для банку", "страхування предмета застави", "страхування майна в заставі банку", "страхування авто в кредиті"],
      serviceType: "Страхування майна, переданого в заставу (іпотека, кредит, лізинг)",
      audience: "Позичальники банків і лізингоотримувачі",
      breadcrumb: "Заставне майно",
    },
    faqKey: "collateral",
    faqSubtitle: "Усе, що потрібно знати про страхування застави",
    emoji: "🏦",
  },

  "foreigners-medical": {
    slug: "foreigners-medical",
    label: T("Медичне для іноземців", "Medical for foreigners"),
    menuDesc: T("Посвідка, робоча віза, дозвіл на роботу", "Residence permit, work visa, work permit"),
    badge: T("Для посвідки, робочої візи та дозволу на роботу", "For residence permit, work visa and work permit"),
    titleLead: T("Медичне страхування іноземців", "Medical insurance for foreigners"),
    titleHighlight: T("для роботи й проживання в Україні", "for working and living in Ukraine"),
    subtitle: T(
      "Поліс, який вимагають для посвідки на тимчасове чи постійне проживання, робочої візи D і дозволу на працевлаштування іноземця. Роботодавець страхує іноземних працівників на весь строк роботи — оформимо одразу на всю команду. Невідкладна допомога, стаціонар, репатріація.",
      "The policy required for a temporary or permanent residence permit, a type D work visa and a foreigner's work permit. Employers insure foreign staff for the whole employment term — we cover the entire team at once. Emergency care, hospital, repatriation.",
    ),
    pills: [T("приймає ДМС і ЦЗ", "accepted by Migration and Employment services"), T("для роботодавців — на всю команду", "for employers — whole team"), T("на 3, 6 чи 12 місяців", "for 3, 6 or 12 months"), T("двомовний поліс", "bilingual policy")],
    fields: [
      { key: "purpose", type: "chips", label: T("Для чого потрібен поліс", "Purpose"), required: true, options: [
        { value: "work", label: T("Дозвіл на роботу / робоча віза", "Work permit / work visa") }, { value: "residence", label: T("Посвідка на проживання", "Residence permit") }, { value: "visa", label: T("Віза D (інша мета)", "Type D visa (other)") },
        { value: "study", label: T("Навчання", "Study") }, { value: "family", label: T("Возз'єднання сім'ї", "Family reunification") }, { value: "other", label: T("Інше", "Other") },
      ] },
      { key: "persons", type: "number", label: T("Кількість осіб (для роботодавця — працівників)", "Number of people (for employers — staff)"), min: 1, max: 999, placeholder: "1", required: true },
      { key: "citizenship", type: "text", label: T("Громадянство", "Citizenship"), placeholder: T("Наприклад: Туреччина", "e.g. Türkiye"), maxLength: 60, required: true },
      { key: "age", type: "number", label: T("Вік (якщо одна особа)", "Age (if one person)"), min: 0, max: 99, placeholder: "35" },
      { key: "term", type: "select", label: T("Строк", "Term"), required: true, options: [
        { value: "3m", label: T("3 місяці", "3 months") }, { value: "6m", label: T("6 місяців", "6 months") }, { value: "12m", label: T("12 місяців", "12 months") },
      ] },
    ],
    cta: T("Оформити поліс", "Get the policy"),
    afterSubmit: T("Менеджер зв'яжеться, уточнить дані паспортів і мету, назве вартість і надішле поліси на email українською та англійською. Для роботодавця — одним договором на всіх працівників з актом і рахунком.", "A manager will contact you, confirm passport details and purpose, quote the price and email the policies in Ukrainian and English. For employers — one contract for all staff with an invoice and act."),
    benefitsTitle: T("Що дає поліс іноземцю та роботодавцю", "What the policy gives a foreigner and an employer"),
    benefitsSubtitle: T("Обовʼязкова умова легального перебування й працевлаштування та медичний захист на весь строк.", "A mandatory condition of legal stay and employment, plus medical cover for the whole term."),
    benefits: [
      { title: T("Для дозволу на роботу", "For the work permit"), desc: T("Роботодавець подає поліс іноземця до центру зайнятості разом із заявою на дозвіл на працевлаштування і продовжує його разом із дозволом.", "The employer files the foreigner's policy with the Employment Centre together with the work permit application and renews it with the permit.") },
      { title: T("Приймає міграційна служба", "Accepted by the Migration Service"), desc: T("Форма договору відповідає вимогам ДМС до посвідок на тимчасове й постійне проживання та робочої візи D.", "The contract form meets the Migration Service requirements for temporary and permanent residence permits and the type D work visa.") },
      { title: T("Невідкладна допомога", "Emergency care"), desc: T("Виклик швидкої, амбулаторне лікування, стаціонар, невідкладна стоматологія, медикаменти.", "Ambulance, outpatient treatment, hospital, emergency dentistry, medication.") },
      { title: T("Репатріація", "Repatriation"), desc: T("Медична евакуація та репатріація до країни громадянства включені в покриття.", "Medical evacuation and repatriation to the home country are included.") },
      { title: T("Двомовний поліс", "Bilingual policy"), desc: T("Договір українською та англійською — зручно для подання документів і для самого клієнта.", "The contract in Ukrainian and English — convenient for document filing and for the client.") },
      { title: T("Асистанс 24/7", "24/7 assistance"), desc: T("Цілодобова лінія підтримки, яка направляє до клініки й узгоджує оплату зі страховою.", "A round-the-clock line that directs to a clinic and settles payment with the insurer.") },
    ],
    docsTitle: T("Що потрібно для оформлення", "What you need to apply"),
    docsSubtitle: T("Усе дистанційно — фото паспорта в месенджер.", "Everything remotely — a passport photo by messenger."),
    docs: [T("Закордонні паспорти іноземців (фото в месенджер)", "The foreigners' passports (photos by messenger)"), T("Для роботодавця — реквізити компанії та список працівників", "For employers — company details and staff list"), T("Мета перебування і бажаний строк", "Purpose of stay and desired term")],
    seo: {
      title: "Медичне страхування іноземців в Україні — дозвіл на роботу, робоча віза, посвідка на проживання",
      description: "Поліс медичного страхування для іноземців, який вимагають для дозволу на працевлаштування, робочої візи D та посвідки на тимчасове чи постійне проживання. Роботодавцям — одним договором на всіх іноземних працівників. На 3, 6 чи 12 місяців, двомовний, оформлення за паспортом.",
      keywords: ["медичне страхування іноземців", "страхування іноземних працівників", "страховка для дозволу на роботу іноземцю", "страхування іноземців для роботодавця", "страховка для іноземців в Україні", "страхування для посвідки на проживання", "медичний поліс для робочої візи D", "страхування іноземних громадян"],
      serviceType: "Медичне страхування іноземців та осіб без громадянства, які перебувають в Україні",
      audience: "Іноземці в Україні та роботодавці, що наймають іноземців",
      breadcrumb: "Медичне для іноземців",
    },
    faqKey: "foreigners-medical",
    faqSubtitle: "Усе, що потрібно знати іноземцю про поліс",
    emoji: "🌍",
  },
};

export const LEAD_PRODUCT_SLUGS = Object.keys(LEAD_PRODUCTS);

export function getLeadProduct(slug: string): LeadProductConfig | undefined {
  return LEAD_PRODUCTS[slug];
}

/** Людська підпись значення поля (для Telegram/лідів). */
export function leadFieldValueLabel(field: LeadField, value: unknown): string {
  if (field.type === "select" || field.type === "chips") {
    const vals = Array.isArray(value) ? value.map(String) : [String(value ?? "")];
    return vals.map((v) => field.options.find((o) => o.value === v)?.label.uk ?? v).filter(Boolean).join(", ");
  }
  if (field.type === "number") return `${Number(value).toLocaleString("uk-UA")}${field.suffix ? ` ${field.suffix.uk}` : ""}`;
  return String(value ?? "").trim();
}
