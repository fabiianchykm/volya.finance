import type { Metadata, Viewport } from "next";
import { Open_Sans } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { ProfileSync } from "@/components/profile/ProfileSync";
import { LoginProvider } from "@/components/auth/LoginProvider";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { GoogleTagManager, GoogleTagManagerNoScript } from "@/components/analytics/GoogleTagManager";
import { Clarity } from "@/components/analytics/Clarity";
import { ReferralCapture } from "@/components/referral/ReferralCapture";
import { ContactWidget } from "@/components/layout/ContactWidget";
import { SkipLink } from "@/components/layout/SkipLink";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE_URL, organizationLd, websiteLd } from "@/lib/seo";

const openSans = Open_Sans({
  weight: ["400", "500", "600", "700"],
  variable: "--font-open-sans",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  // metadataBase робить og:image/canonical абсолютними (інакше Next попереджає й посилання ламаються).
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Автоцивілка, КАСКО, Зелена карта онлайн — volya.finance",
    template: "%s | volya.finance",
  },
  description:
    "Оформіть автоцивілку (ОСЦПВ/ОСАГО) онлайн за 3 хвилини. Порівняйте ціни від 18+ страхових компаній. Офіційні електронні поліси МТСБУ. КАСКО та Зелена карта.",
  keywords: [
    // Бренд (щоб знаходило за кириличним написанням)
    "воля фінанс", "Воля Фінанс", "воля.фінанс", "воля финанс", "volya finance", "volya.finance",
    "автоцивілка", "автоцивілка купити", "ОСЦПВ", "ОСЦПВ онлайн", "ОСАГО", "ОСАГО купити",
    "страхування авто", "страховка на авто", "онлайн страхування", "електронний поліс",
    "КАСКО", "КАСКО онлайн", "міні-КАСКО", "Зелена карта", "туристичне страхування", "автострахування Україна",
  ],
  alternates: { canonical: "/" },
  // Підтвердження власності в Google Search Console (запасний метод — основний DNS).
  verification: { google: "Jr75QDNCCI9csZpWqb5b6_4zaz33Cxnp-HtQGZTHidE" },
  openGraph: {
    title: "Автоцивілка, КАСКО, Зелена карта онлайн — volya.finance",
    description: "Оформіть автоцивілку (ОСЦПВ/ОСАГО) онлайн за 3 хвилини. Порівняйте ціни від 18+ страхових компаній. Офіційні поліси МТСБУ.",
    type: "website",
    locale: "uk_UA",
    url: SITE_URL,
    siteName: "volya.finance",
  },
  twitter: {
    card: "summary_large_image",
    title: "Автоцивілка, КАСКО, Зелена карта онлайн — volya.finance",
    description: "Оформіть автоцивілку (ОСЦПВ/ОСАГО) онлайн за 3 хвилини. Порівняйте ціни від 18+ страхових компаній.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Сесію НЕ читаємо на сервері — інакше auth() (cookies) робить усі сторінки
  // динамічними й вбиває кешування. SessionProvider підтягне сесію на клієнті.
  return (
    <html lang="uk" className={`${openSans.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* Ставимо клас теми ДО рендеру, щоб не було спалаху світлого фону (FOUC). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var e=document.documentElement;try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;e.classList.toggle('dark',d);e.style.colorScheme=d?'dark':'light';}catch(x){}try{var a=JSON.parse(localStorage.getItem('a11y')||'{}');if(a.fontScale)e.style.fontSize=(16*a.fontScale)+'px';e.classList.toggle('a11y-contrast',!!a.contrast);e.classList.toggle('a11y-spacing',!!a.spacing);e.classList.toggle('a11y-underline',!!a.underline);e.classList.toggle('a11y-no-motion',!!a.motion);}catch(x){}})();`,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col bg-[#F5F5F7] font-sans dark:bg-[#0a0a0b]">
        <GoogleTagManagerNoScript />
        <SkipLink />
        <SessionProvider>
          <ProfileSync />
          <LoginProvider>{children}</LoginProvider>
        </SessionProvider>
        <ContactWidget />
        <ReferralCapture />
        <JsonLd data={[organizationLd(), websiteLd()]} />
        <GoogleAnalytics />
        <GoogleTagManager />
        <Clarity />
      </body>
    </html>
  );
}
