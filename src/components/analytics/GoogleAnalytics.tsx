import Script from "next/script";

// Google Analytics 4 (gtag.js). Вантажимо ЛИШЕ якщо задано NEXT_PUBLIC_GA_ID —
// тобто в проді (у dev без змінної нічого не підвантажується, статистику не смітимо).
// Measurement ID — публічне значення (видно у вихідному коді), тож не секрет.
// Клієнтські переходи App Router ловить Enhanced measurement GA4 (page changes).

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export function GoogleAnalytics() {
  if (!GA_ID) return null;
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  );
}
