import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Інформація про Субагента",
  description:
    "Розкриття інформації про страхового посередника (Субагента) ТОВ «ПРОІНШУРЕНС УКРАЇНА»: повноваження, реєстр посередників, перелік страхових компаній, винагорода та захист прав.",
  path: "/subagent",
});

const INSURERS = [
  { name: 'АТ "СК "АРКС"', edrpou: "20474912", address: "04070, Київ, вул. Іллінська, 8", phone: "(044) 391-11-22", site: "https://arx.com.ua/" },
  { name: 'ПрАТ "СК "ВУСО"', edrpou: "31650052", address: "03680, Київ, вул. Казимира Малевича, 31", phone: "(044) 500-37-73", site: "https://www.vuso.ua" },
  { name: 'ПрАТ "УСК "КНЯЖА ВІЄННА ІНШУРАНС ГРУП"', edrpou: "24175269", address: "04050, Київ, вул. Глибочицька, 44", phone: "(044) 207-72-72", site: "https://kniazha.ua" },
  { name: 'ПрАТ "ЄТС"', edrpou: "34692526", address: "04071, Київ, вул. Спаська, 5, оф. 15", phone: "(044) 220-00-07", site: "https://eurotravelins.com.ua/" },
  { name: 'ПрАТ "СК "Євроінс Україна"', edrpou: "22868348", address: "03150, Київ, вул. Велика Васильківська, 102", phone: "+380 44 529-08-94", site: "https://www.euroins.com.ua" },
  { name: 'АТ "СК "ІНГО"', edrpou: "16285602", address: "01054, Київ, вул. Бульварно-Кудрявська, 33", phone: "0 800 21-55-53", site: "https://ingo.ua" },
  { name: 'ПАТ "НАСК "ОРАНТА"', edrpou: "00034186", address: "02081, Київ, вул. Здолбунівська, 7Д, корпус Г", phone: "+380 44 537-58-00", site: "https://oranta.ua/" },
  { name: 'ПрАТ СК "ПЗУ УКРАЇНА"', edrpou: "20782312", address: "04053, Київ, вул. Січових Стрільців, 40", phone: "(044) 238-62-38", site: "https://www.pzu.com.ua" },
  { name: 'АТ "СГ "ТАС" (приватне)', edrpou: "30115243", address: "03062, Київ, просп. Перемоги, 65", phone: "(044) 536-00-20", site: "https://sgtas.ua" },
  { name: 'ПАТ "СК "УСГ"', edrpou: "30859524", address: "03038, Київ, вул. Федорова Івана, 32, корп. А", phone: "(044) 237-02-78", site: "https://www.ukringroup.ua" },
  { name: 'ПрАТ "УТСК"', edrpou: "22945712", address: "01033, Київ, вул. Саксаганського, 77", phone: "+380 44 303-97-70", site: "https://www.utico.ua/" },
  { name: 'ПрАТ "ЄВРОПЕЙСЬКИЙ СТРАХОВИЙ АЛЬЯНС"', edrpou: "19411125", address: "03039, Київ, пр-т Науки, 3", phone: "(044) 290-14-20", site: "https://eia.com.ua/" },
  { name: 'СК "ББС ІНШУРАНС"', edrpou: "20344871", address: "04050, Київ, вул. Білоруська, 3", phone: "(044) 246-67-22", site: "https://bbs.ua/" },
  { name: 'ПрАТ СК "ІНТЕР-ПОЛІС"', edrpou: "19350062", address: "01033, Київ, вул. Володимирська, 69", phone: "(044) 287-43-05", site: "https://inter-policy.com/" },
  { name: 'ПрАТ "СК "АРСЕНАЛ СТРАХУВАННЯ"', edrpou: "33908322", address: "01033, Київ, вул. Борщагівська, 15", phone: "(044) 503-67-37", site: "https://arsenal-ic.ua/" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-zinc-100 pt-6">
      <h2 className="mb-3 text-lg font-bold text-zinc-900">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-zinc-600">{children}</div>
    </section>
  );
}

export default function SubagentPage() {
  return (
    <>
      <Navbar solid />
      <main className="flex-1 pt-24 pb-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <p className="text-sm font-medium text-indigo-600">Інформація про страхового посередника</p>
          <h1 className="mt-1 mb-4 text-2xl font-bold text-zinc-900 sm:text-3xl">Інформація про Субагента</h1>

          <a
            href="https://uconnect.com.ua/sub-agent"
            target="_blank"
            rel="noopener noreferrer"
            className="mb-8 inline-flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-2.5 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100"
          >
            Офіційний портал субагента (Ukasko)
            <span aria-hidden>↗</span>
          </a>

          <div className="space-y-6">
            <Section title="1. Субагент">
              <p><span className="font-medium text-zinc-800">Повне найменування:</span> ТОВАРИСТВО З ОБМЕЖЕНОЮ ВІДПОВІДАЛЬНІСТЮ «ПРОІНШУРЕНС УКРАЇНА»</p>
              <p><span className="font-medium text-zinc-800">Скорочене найменування:</span> ТОВ «ПРОІНШУРЕНС УКРАЇНА»</p>
              <p><span className="font-medium text-zinc-800">Код ЄДРПОУ:</span> 45892850</p>
              <p><span className="font-medium text-zinc-800">Місцезнаходження:</span> м. Харків, пр-т Героїв Харкова, буд. 57/63, офіс 41</p>
              <p>
                <span className="font-medium text-zinc-800">Адреса вебсайту:</span>{" "}
                <a href="https://ukasko.ua/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">https://ukasko.ua/</a>
              </p>
            </Section>

            <Section title="2. Повноваження Субагента">
              <p>ТОВ «ПРОІНШУРЕНС УКРАЇНА» є субагентом, який діє від імені та за дорученням страхової компанії та надає посередницькі послуги з укладення договорів страхування, в тому числі:</p>
              <ol className="ml-5 list-decimal space-y-1">
                <li>рекламування та/або проведення маркетингових, рекламних та інших підготовчих заходів, спрямованих на укладення договорів страхування;</li>
                <li>пропозиція, пропонування та консультування Страхувальника щодо укладення Договору страхування, проведення іншої роботи з підготовки до укладення Договорів страхування;</li>
                <li>укладення Договору страхування.</li>
              </ol>
            </Section>

            <Section title="3. Номер запису в Реєстрі посередників">
              <p>Реєстр посередників запроваджується Національним банком України з 01.04.2025.</p>
              <p>ТОВ «ПРОІНШУРЕНС УКРАЇНА» — субагент ТОВ «ЮІНШУР». Реєстраційний номер — <span className="font-medium text-zinc-800">00019016</span>.</p>
            </Section>

            <Section title="4. Індивідуальні консультації та рекомендації">
              <p>
                ТОВ «ПРОІНШУРЕНС УКРАЇНА» надає індивідуальні консультації щодо умов страхового продукту та рекомендації щодо вибору страхового продукту відповідно до потреб клієнта при зверненні клієнта до служби підтримки на сайті, у месенджери чи на пошту{" "}
                <a href="mailto:support@ukasko.com.ua" className="text-indigo-600 hover:underline">support@ukasko.com.ua</a>.
              </p>
            </Section>

            <Section title="5. Страхові компанії, продукти яких реалізує Субагент">
              <div className="space-y-3">
                {INSURERS.map((c, i) => (
                  <div key={c.edrpou} className="rounded-xl border border-zinc-100 bg-white px-4 py-3">
                    <p className="font-medium text-zinc-800">{i + 1}. {c.name}</p>
                    <p className="mt-1 text-xs text-zinc-500">Код ЄДРПОУ: {c.edrpou} · {c.address} · {c.phone}</p>
                    <a href={c.site} target="_blank" rel="noopener noreferrer" className="mt-0.5 inline-block text-xs text-indigo-600 hover:underline">
                      {c.site}
                    </a>
                    <p className="mt-1 text-xs text-zinc-400">Перелік послуг, що надаються страховиком, зазначено на вебсайті страховика.</p>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="6. Наявність істотної участі в будь-якому страховику">
              <p>ТОВ «ПРОІНШУРЕНС УКРАЇНА» не має істотної участі в будь-якому із страховиків.</p>
            </Section>

            <Section title="7. Наявність істотної участі страховика у Субагенті">
              <p>Будь-який страховик не має істотної участі в ТОВ «ПРОІНШУРЕНС УКРАЇНА».</p>
            </Section>

            <Section title="8. Вид винагороди за укладення договору страхування">
              <p>За укладання договорів страхування страховий агент отримує комісійну винагороду у розмірі фіксованого відсотка від страхової премії за договором страхування (винагорода входить до складу страхової премії). Винагороду страховому агенту сплачує страхова компанія.</p>
            </Section>

            <Section title="9. Розмір та спосіб оплати послуг Субагента клієнтом">
              <p>Клієнт не оплачує послуги Субагента.</p>
            </Section>

            <Section title="10. Інші платежі клієнта">
              <p>Будь-які інші платежі (крім страхової премії) клієнт не повинен сплачувати відповідно до умов договору страхування після його укладення.</p>
            </Section>

            <Section title="11. Механізми та способи захисту прав">
              <p>Звернення розглядаються і вирішуються Страховиком у термін не більше одного місяця від дня їх надходження, а ті, які не потребують додаткового вивчення, — не пізніше пʼятнадцяти днів від дня їх отримання.</p>
              <p>Якщо в місячний термін вирішити порушені у зверненні питання неможливо, уповноважена особа Страховика встановлює необхідний термін для його розгляду, що не може перевищувати сорока пʼяти днів.</p>
              <p>Звернення може бути усним (за допомогою засобів телефонного звʼязку через контактний центр Страховика та/або страхового агента) чи письмовим (на електронну пошту Страховика або засобами поштового звʼязку на його адресу).</p>
              <p className="pt-1 font-medium text-zinc-800">Скарга на дії чи рішення Страховика подається у порядку підлеглості:</p>
              <ul className="ml-5 list-disc space-y-1">
                <li>
                  Національному банку України (пошта{" "}
                  <a href="mailto:nbu@bank.gov.ua" className="text-indigo-600 hover:underline">nbu@bank.gov.ua</a>, форма{" "}
                  <a href="https://bank.gov.ua/ua/consumer-protection" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">bank.gov.ua/ua/consumer-protection</a>; адреса: 01601, м. Київ, вул. Інститутська, 9, тел.: 0 800 505 240);
                </li>
                <li>
                  Державній службі України з питань безпечності харчових продуктів та захисту споживачів (адреса: 01001, м. Київ, вул. Б. Грінченка, 1, тел.: (044) 279-12-70, e-mail:{" "}
                  <a href="mailto:info@dpss.gov.ua" className="text-indigo-600 hover:underline">info@dpss.gov.ua</a>).
                </li>
              </ul>
              <p>Подання клієнтом скарги до Страховика або компетентного органу не позбавляє споживача права звернутися до суду відповідно до чинного законодавства, а у разі незгоди споживача з прийнятим за скаргою рішенням — безпосередньо до суду.</p>
            </Section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
