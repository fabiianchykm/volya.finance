import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Інформація про страхового посередника",
  description:
    "Розкриття інформації про страхового посередника (субагента) ФОП Александров Володимир Петрович відповідно до статті 88 Закону України «Про страхування»: повноваження, реєстр НБУ, перелік страхових компаній, винагорода та захист прав.",
  path: "/subagent",
});

// Перелік страхових компаній, договори яких реалізує субагент (з офіційного
// розкриття інформації страхового агента ТОВ «ЮІНШУР»).
const INSURERS = [
  { name: "ПрАТ «СК «ПЗУ УКРАЇНА»", edrpou: "20782312", address: "04053, м. Київ, вул. Січових Стрільців, 40", site: "https://www.pzu.com.ua/" },
  { name: "ПрАТ «УСК «КНЯЖА ВІЄННА ІНШУРАНС ГРУП»", edrpou: "24175269", address: "04050, м. Київ, вул. Глибочицька, 44", site: "https://kniazha.ua/" },
  { name: "АТ «СК «АРКС»", edrpou: "20474912", address: "04070, м. Київ, вул. Іллінська, 8", site: "https://arx.com.ua/" },
  { name: "АТ «СК «ББС ІНШУРАНС»", edrpou: "20344871", address: "04050, м. Київ, вул. Білоруська, 3", site: "http://bbs.ua/" },
  { name: "ТДВ «ЕКСПРЕС СТРАХУВАННЯ»", edrpou: "36086124", address: "04073, м. Київ, проспект Степана Бандери, 28-А", site: "https://www.express-insurance.com.ua/" },
  { name: "ПАТ «НАСК «ОРАНТА»", edrpou: "00034186", address: "02081, м. Київ, вул. Здолбунівська, 7-Д", site: "https://oranta.ua/" },
  { name: "ПАТ «СГ «ТАС»", edrpou: "30115243", address: "03117, м. Київ, проспект Берестейський, 65", site: "https://tas-insurance.com.ua" },
  { name: "ПАТ «СК «ЄВРОІНС УКРАЇНА»", edrpou: "22868348", address: "03150, м. Київ, вул. Велика Васильківська, 102", site: "https://euroins.com.ua/" },
  { name: "ПрАТ «Українська транспортна страхова компанія»", edrpou: "22945712", address: "04071, м. Київ, вул. Ярославська, 58", site: "https://www.utico.ua/" },
  { name: "ПАТ «СК «ІНТЕР-ПОЛІС»", edrpou: "19350062", address: "04050, м. Київ, вул. Білоруська, 3", site: "https://www.inter-policy.com" },
  { name: "АТ «СК «ІНГО»", edrpou: "16285602", address: "01054, м. Київ, вул. Бульварно-Кудрявська, 33", site: "https://ingo.ua/" },
  { name: "ПрАТ «СК «ВУСО»", edrpou: "31650052", address: "03150, м. Київ, вул. Казимира Малевича, 31", site: "https://vuso.ua" },
  { name: "ПрАТ «СК «АРСЕНАЛ СТРАХУВАННЯ»", edrpou: "33908322", address: "03056, м. Київ, вул. Борщагівська, 154", site: "https://arsenal-ic.ua/" },
  { name: "ПрАТ «СК «УСГ»", edrpou: "30859524", address: "03038, м. Київ, вул. Івана Федорова, 32-А", site: "https://www.usg.ua/" },
  { name: "ПрАТ «Європейське туристичне страхування»", edrpou: "34692526", address: "04071, м. Київ, вул. Спаська, 5", site: "https://eurotravelins.com.ua/" },
  { name: "ПрАТ «СК «УНІКА»", edrpou: "20033533", address: "04112, м. Київ, вул. Олени Теліги, 6, літ. В", site: "https://uniqa.ua/" },
  { name: "ПрАТ «Інноваційний страховий капітал»", edrpou: "32942598", address: "04080, м. Київ, вул. Кирилівська, 40", site: "https://insk.com.ua/ua/" },
  { name: "ТДВ «СК «ГАРДІАН»", edrpou: "35417298", address: "01032, м. Київ, вул. Саксаганського, 96", site: "https://grdn.com.ua/" },
  { name: "ПрАТ «Європейський страховий альянс»", edrpou: "19411125", address: "03039, м. Київ, проспект Валерія Лобановського, 17", site: "https://eia.com.ua/" },
];

const CLASSES = [
  "Клас 1 «Страхування від нещасного випадку (в тому числі на випадок виробничої травми та професійного захворювання)»",
  "Клас 2 «Страхування на випадок хвороби (у тому числі медичне страхування)»",
  "Клас 3 «Страхування наземних транспортних засобів (крім залізничного рухомого складу)»",
  "Клас 10 «Страхування відповідальності, яка виникає внаслідок використання наземного транспортного засобу (у тому числі відповідальності перевізника)» — страхування відповідальності власників наземних транспортних засобів (ОСЦПВ)",
  "Клас 13 «Страхування іншої відповідальності (крім визначеної у класах 10, 11, 12)»",
  "Клас 16 «Страхування інших фінансових ризиків (крім визначених класами 14, 15)»",
  "Клас 18 «Страхування витрат, пов'язаних з наданням допомоги (асистанс) особам, які потрапили у скрутне становище під час здійснення подорожі»",
];

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-zinc-100 pt-6">
      <h2 className="mb-3 text-lg font-bold text-zinc-900">{n}. {title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-zinc-600">{children}</div>
    </section>
  );
}

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <p><span className="font-medium text-zinc-800">{label}: </span>{children}</p>
);

export default function SubagentPage() {
  return (
    <>
      <Navbar solid />
      <main className="flex-1 pt-24 pb-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <p className="text-sm font-medium text-indigo-600">Розкриття інформації</p>
          <h1 className="mt-1 mb-3 text-2xl font-bold text-zinc-900 sm:text-3xl">Інформація про страхового посередника</h1>
          <p className="mb-8 text-sm leading-relaxed text-zinc-500">
            Інформація, яка надається клієнту до укладення договору страхування відповідно до
            статті 88 Закону України «Про страхування».
          </p>

          <div className="space-y-6">
            <Section n={1} title="Страховий посередник">
              <p>Страховим посередником (субагентом) є фізична особа — підприємець:</p>
              <Row label="Найменування">Фізична особа — підприємець Александров Володимир Петрович (ФОП Александров Володимир Петрович)</Row>
              <Row label="Ідентифікаційний код / ЄДРПОУ">3397909111</Row>
              <Row label="Місцезнаходження">м. Бережани, вул. Хмельницького, буд. 18</Row>
              <Row label="Адреса вебсайту">—</Row>
            </Section>

            <Section n={2} title="Повноваження страхового посередника">
              <p>
                ФОП Александров Володимир Петрович є страховим посередником (субагентом), який діє
                від імені та за дорученням страхового агента:
              </p>
              <div className="mt-2 rounded-xl border border-zinc-100 bg-zinc-50 p-4 space-y-1.5">
                <Row label="Агент">ТОВАРИСТВО З ОБМЕЖЕНОЮ ВІДПОВІДАЛЬНІСТЮ «ЮІНШУР» (ТОВ «ЮІНШУР»)</Row>
                <Row label="Код ЄДРПОУ">45581136</Row>
                <Row label="Місцезнаходження">Україна, 61001, Харківська обл., м. Харків, пр. Героїв Харкова, буд. 57/63, офіс 57</Row>
                <Row label="Вебсайт"><a href="https://uconnect.com.ua" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">https://uconnect.com.ua</a></Row>
                <Row label="Рахунок для приймання страхових платежів">UA663077700000026002211241177</Row>
                <Row label="Реєстраційний номер у Реєстрі посередників НБУ">00004153 від 20.03.2025</Row>
              </div>
              <p className="mt-3">Субагент надає посередницькі послуги з укладення договорів страхування, зокрема:</p>
              <ul className="ml-4 list-disc space-y-1">
                <li>рекламування та/або проведення маркетингових, рекламних та інших підготовчих заходів, спрямованих на укладення договорів страхування;</li>
                <li>пропонування та консультування страхувальника щодо укладення договорів страхування, інша робота з підготовки до укладення договорів;</li>
                <li>укладення договорів страхування.</li>
              </ul>
            </Section>

            <Section n={3} title="Консультації та рекомендації">
              <p>
                Страховий посередник надає індивідуальні консультації та рекомендації щодо вибору
                страхового продукту відповідно до потреб клієнта.
              </p>
              <p>
                Для отримання консультації звертайтесь до служби підтримки:
                {" "}<a href="mailto:Aleksandrovvolodimir9@gmail.com" className="text-indigo-600 hover:underline">Aleksandrovvolodimir9@gmail.com</a>
                {" "}або тел. <a href="tel:+380976898653" className="text-indigo-600 hover:underline">+38 (097) 689-86-53</a>.
              </p>
            </Section>

            <Section n={4} title="Реєстрація в НБУ">
              <Row label="Реєстраційний номер у Реєстрі посередників">00001164 від 18.03.2025</Row>
              <p>
                Перевірити:{" "}
                <a href="https://kis.bank.gov.ua/search-fu" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">kis.bank.gov.ua/search-fu</a>
              </p>
            </Section>

            <Section n={5} title="Страхові компанії та продукти, які реалізує посередник">
              <ol className="space-y-3">
                {INSURERS.map((c, i) => (
                  <li key={c.edrpou} className="rounded-xl border border-zinc-100 bg-white p-3.5">
                    <p className="text-sm font-semibold text-zinc-900">{i + 1}. {c.name}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">ЄДРПОУ {c.edrpou} · {c.address}</p>
                    <p className="mt-0.5 text-xs">
                      <a href={c.site} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">{c.site.replace(/^https?:\/\//, "").replace(/\/$/, "")}</a>
                      {" · "}
                      <a href="https://kis.bank.gov.ua" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Реєстр НБУ</a>
                    </p>
                  </li>
                ))}
              </ol>
              <p className="mt-4 font-medium text-zinc-800">Класи страхових продуктів:</p>
              <ul className="ml-4 list-disc space-y-1">
                {CLASSES.map((cl) => <li key={cl}>{cl}</li>)}
              </ul>
            </Section>

            <Section n={6} title="Наявність істотної участі в будь-якому страховику та страховому посереднику">
              <p>ФОП Александров Володимир Петрович не має істотної участі в будь-якому зі страховиків та страхових посередників.</p>
            </Section>

            <Section n={7} title="Наявність істотної участі страховика у страховому посереднику">
              <p>Будь-який страховик не має істотної участі у ФОП Александров Володимир Петрович.</p>
            </Section>

            <Section n={8} title="Відокремлені підрозділи">
              <p>Відокремлені підрозділи, в яких споживач може укласти договір страхування, — відсутні.</p>
            </Section>

            <Section n={9} title="Вид винагороди за укладення договору, порядок та умови її виплати">
              <p>
                За укладання договорів страхування субагент отримує комісійну винагороду у розмірі
                фіксованого відсотка від страхової премії за договором (винагорода входить до складу
                страхової премії). Винагороду страховому субагенту сплачує страховий агент.
              </p>
            </Section>

            <Section n={10} title="Розмір та спосіб оплати послуг субагента безпосередньо клієнтом">
              <p>Клієнт не оплачує послуги субагента.</p>
            </Section>

            <Section n={11} title="Інші платежі (крім страхової премії)">
              <p>Будь-які інші платежі (крім страхової премії) клієнт не повинен сплачувати відповідно до умов договору страхування після його укладення.</p>
            </Section>

            <Section n={12} title="Механізми та способи захисту прав">
              <p>
                Страховий посередник дотримується вимог Закону України «Про захист персональних даних»
                та внутрішніх нормативних документів страховика щодо обробки та захисту персональних
                даних споживачів фінансових послуг.
              </p>
              <p>
                Звернення розглядаються страховиком у термін не більше одного місяця від дня їх
                надходження, а ті, що не потребують додаткового вивчення, — не пізніше пʼятнадцяти днів.
                Якщо у місячний термін вирішити питання неможливо, встановлюється необхідний термін
                розгляду, що не може перевищувати сорока пʼяти днів.
              </p>
              <p>
                Звернення може бути усним (через контактний центр страховика та/або субагента) або
                письмовим (на електронну пошту чи поштову адресу страховика).
              </p>
              <p className="mt-2 font-medium text-zinc-800">Скарга на дії чи рішення страховика подається у порядку підлеглості:</p>
              <ul className="ml-4 list-disc space-y-1">
                <li>
                  Національному банку України: <a href="mailto:nbu@bank.gov.ua" className="text-indigo-600 hover:underline">nbu@bank.gov.ua</a>,
                  форма <a href="https://bank.gov.ua/ua/consumer-protection" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">bank.gov.ua/ua/consumer-protection</a>;
                  адреса: 01601, м. Київ, вул. Інститутська, 9, тел. 0 800 505 240;
                </li>
                <li>
                  Державній службі України з питань безпечності харчових продуктів та захисту споживачів:
                  01001, м. Київ, вул. Б. Грінченка, 1, тел. (044) 279-12-70, <a href="mailto:info@dpss.gov.ua" className="text-indigo-600 hover:underline">info@dpss.gov.ua</a>.
                </li>
              </ul>
              <p className="mt-2">Подання скарги не позбавляє вас права звернутися безпосередньо до суду.</p>
            </Section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
