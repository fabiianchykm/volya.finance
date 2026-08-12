import Script from "next/script";

// Google-теги (gtag.js): GA4 (аналітика) + Google Ads (конверсії реклами).
// Обидва ID — ПУБЛІЧНІ (видно у вихідному коді), тож не секрети; беруться з
// NEXT_PUBLIC_* (вшиваються у бандл на BUILD). Один скрипт gtag.js обслуговує
// обидва config-и — дублювати завантаження не треба. Без жодного ID нічого не
// вантажимо (у dev статистику не смітимо). App Router-переходи GA4 ловить сам
// (Enhanced measurement).

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;          // G-XXXXXXX (GA4)
const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID; // AW-XXXXXXXXX (Google Ads)

export function GoogleAnalytics() {
  const primary = GA_ID || ADS_ID;
  if (!primary) return null;
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${primary}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          ${GA_ID ? `gtag('config', '${GA_ID}');` : ""}
          ${ADS_ID ? `gtag('config', '${ADS_ID}');` : ""}
        `}
      </Script>
    </>
  );
}
