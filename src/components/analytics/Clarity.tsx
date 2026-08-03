"use client";

import Script from "next/script";

// Microsoft Clarity — безкоштовна поведінкова аналітика: теплові карти (heatmaps)
// та записи сесій (де користувачі клікають, де «застрягають», де кидають форму).
// Вантажимо ЛИШЕ якщо задано NEXT_PUBLIC_CLARITY_ID (у проді). Project ID —
// публічне значення (видно у вихідному коді), тож не секрет.

const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID;

export function Clarity() {
  if (!CLARITY_ID) return null;
  return (
    <Script id="clarity-init" strategy="afterInteractive">
      {`
        (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "${CLARITY_ID}");
      `}
    </Script>
  );
}
