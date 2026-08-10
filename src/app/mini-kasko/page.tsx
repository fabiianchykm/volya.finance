import { Footer } from "@/components/layout/Footer";
import { MiniKaskoFlow } from "@/components/minikasko/MiniKaskoFlow";
import { KaskoBenefits } from "@/components/kasko/KaskoBenefits";
import { KASKO_PRODUCTS } from "@/components/kasko/products";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildMetadata, serviceLd, breadcrumbLd } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Міні-КАСКО онлайн — бюджетна страховка авто",
  description:
    "Міні-КАСКО онлайн — бюджетний захист авто від ключових ризиків. Введіть номер авто — розрахуємо вартість і передзвонимо з вигідною пропозицією.",
  path: "/mini-kasko",
  keywords: [
    // Усі написання (дифіс / пробіл / без роздільника) — Google не завжди їх ототожнює
    "міні-КАСКО", "міні каско", "мінікаско", "міні-каско онлайн", "mini kasko", "mini-kasko",
    "міні КАСКО онлайн", "бюджетне КАСКО", "недороге КАСКО",
    "часткове КАСКО", "страховка авто дешево",
  ],
});

export default function MiniKaskoPage() {
  return (
    <>
      <JsonLd
        data={[
          serviceLd({
            name: "Міні-КАСКО онлайн",
            serviceType: "Часткове (бюджетне) автострахування Міні-КАСКО",
            description:
              "Бюджетний поліс Міні-КАСКО з покриттям ключових ризиків для авто. Індивідуальний розрахунок вартості від страхових компаній.",
            path: "/mini-kasko",
          }),
          breadcrumbLd([
            { name: "Головна", path: "/" },
            { name: "Міні-КАСКО", path: "/mini-kasko" },
          ]),
        ]}
      />
      {/* Navbar рендериться всередині MiniKaskoFlow (прозорий герой → solid екран пропозицій) */}
      <main className="flex-1">
        <MiniKaskoFlow />
        <KaskoBenefits config={KASKO_PRODUCTS["mini-kasko"]} />
      </main>
      <Footer />
    </>
  );
}
