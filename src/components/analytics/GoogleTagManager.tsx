import Script from "next/script";

// Google Tag Manager — «контейнер», через який маркетологи додають теги
// (конверсії Google Ads, GA4, Meta Pixel тощо) БЕЗ правок коду. Вантажимо лише
// якщо задано NEXT_PUBLIC_GTM_ID (у проді). Container ID (GTM-XXXXXXX) — публічне
// значення, видно у вихідному коді, тож не секрет.
//
// Складається з двох частин:
//  • GoogleTagManager — головний скрипт (у layout, всередині <head>/початку body);
//  • GoogleTagManagerNoScript — <noscript>-iframe одразу після відкриття <body>
//    (fallback для користувачів без JavaScript; так вимагає стандартний сніпет GTM).

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

export function GoogleTagManager() {
  if (!GTM_ID) return null;
  return (
    <Script id="gtm-init" strategy="afterInteractive">
      {`
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${GTM_ID}');
      `}
    </Script>
  );
}

export function GoogleTagManagerNoScript() {
  if (!GTM_ID) return null;
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
      />
    </noscript>
  );
}
