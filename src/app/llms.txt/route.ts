import { SITE_URL, BRAND, PHONE, EMAIL } from "@/lib/seo";
import { getPosts } from "@/lib/blog";

// /llms.txt — курований, LLM-дружній путівник по сайту (конвенція llms.txt).
// Не сторінка й не вкладка: просто статичний text/plain для AI-систем/агентів,
// поряд із robots.txt та sitemap.xml. Джерела правди ті самі, що й у sitemap
// (перелік продуктів) та seo (бренд/контакти) — щоб не розʼїжджалось.
export const dynamic = "force-static";

// Публічні сторінки-продукти з коротким описом (приватні /checkout, /policies,
// /payment-success — поза індексом, як і в robots.ts). Опис — один рядок, суть.
const PRODUCTS: Array<{ path: string; title: string; desc: string }> = [
  { path: "/osago", title: "ОСЦПВ (автоцивілка)", desc: "Обовʼязкове страхування цивільної відповідальності водія. Порівняння цін від 18+ страхових компаній, офіційні поліси МТСБУ, оформлення онлайн за номером авто." },
  { path: "/kasko", title: "КАСКО", desc: "Добровільне страхування автомобіля від ДТП, викрадення, стихійних лих і пошкоджень." },
  { path: "/mini-kasko", title: "Міні-КАСКО", desc: "Бюджетний варіант КАСКО з базовим захистом авто за меншу ціну." },
  { path: "/green-card", title: "Зелена карта", desc: "Міжнародний поліс автоцивілки для виїзду за кордон власним авто. Вибір зони/країн і терміну." },
  { path: "/tourism", title: "Туристичне страхування", desc: "Медичне страхування для подорожей за кордон: покриття, асистанс, вибір країни та днів." },
  { path: "/pets", title: "Страхування тварин", desc: "Поліс для домашніх улюбленців (ветеринарні витрати)." },
  { path: "/housing", title: "Страхування житла", desc: "Захист квартири/будинку та майна." },
  { path: "/subagent", title: "Субагентська програма", desc: "Партнерство для агентів: продаж полісів через платформу volya.finance." },
];

export function GET(): Response {
  const posts = getPosts();
  const lines: string[] = [];

  lines.push(`# ${BRAND}`);
  lines.push("");
  lines.push(
    "> Онлайн-платформа страхування в Україні: порівняння цін від 18+ страхових компаній та " +
    "оформлення офіційних полісів онлайн — автоцивілка (ОСЦПВ), КАСКО, Міні-КАСКО, Зелена карта, " +
    "туристичне страхування, страхування тварин і житла. Поліси автоцивілки реєструються в МТСБУ."
  );
  lines.push("");
  lines.push(`Мова: українська (uk-UA). Сайт: ${SITE_URL}`);
  lines.push("");

  lines.push("## Продукти");
  for (const p of PRODUCTS) {
    lines.push(`- [${p.title}](${SITE_URL}${p.path}): ${p.desc}`);
  }
  lines.push("");

  lines.push("## Як це працює");
  lines.push(
    "- Клієнт вводить дані (для авто — держномер), система запитує реальні пропозиції страхових " +
    "компаній, показує ціни й покриття, після вибору — онлайн-оплата та видача поліса."
  );
  lines.push("- Оплата карткою (LiqPay). Поліс приходить на email; ОСЦПВ реєструється в МТСБУ.");
  lines.push("");

  if (posts.length) {
    lines.push("## Блог (корисні статті)");
    for (const post of posts) {
      lines.push(`- [${post.title}](${SITE_URL}/blog/${post.slug})`);
    }
    lines.push("");
  }

  lines.push("## Контакти");
  lines.push(`- Телефон: ${PHONE}`);
  lines.push(`- Email: ${EMAIL}`);
  lines.push("");

  const body = lines.join("\n");
  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      // Статичний контент — можна довго кешувати на CDN.
      "cache-control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
