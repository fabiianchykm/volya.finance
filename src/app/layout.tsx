import type { Metadata, Viewport } from "next";
import { Inter, Roboto, Open_Sans } from "next/font/google";
import "./globals.css";
import { auth } from "@/auth";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { SITE_URL } from "@/lib/seo";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const roboto = Roboto({
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

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
  title: "volya.finance — Страхування авто онлайн",
  description:
    "Оформіть ОСЦПВ (автоцивілку) онлайн за 3 хвилини. Порівняйте ціни від 18+ страхових компаній. Офіційні поліси МТСБУ.",
  keywords: ["ОСЦПВ", "автоцивілка", "страхування авто", "онлайн страхування", "поліс", "КАСКО", "Зелена карта"],
  alternates: { canonical: "/" },
  openGraph: {
    title: "volya.finance — Страхування авто онлайн",
    description: "Оформіть ОСЦПВ онлайн за 3 хвилини. Найкращі ціни від 18+ страховиків.",
    type: "website",
    locale: "uk_UA",
    url: SITE_URL,
    siteName: "volya.finance",
  },
  twitter: {
    card: "summary_large_image",
    title: "volya.finance — Страхування авто онлайн",
    description: "Оформіть ОСЦПВ онлайн за 3 хвилини. Найкращі ціни від 18+ страховиків.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // auth() кидає помилку, якщо NextAuth не сконфігуровано (напр. немає AUTH_SECRET).
  // Не дамо цьому покласти весь сайт — рендеримо без сесії, логін просто не працюватиме.
  let session = null;
  try {
    session = await auth();
  } catch (e) {
    // Службові помилки Next.js (динамічний рендер, redirect, notFound) мають digest —
    // їх не можна ковтати, інакше зламається рендеринг. Перекидаємо далі.
    if (e && typeof e === "object" && "digest" in e) throw e;
    console.error("[auth] не вдалося отримати сесію (перевірте AUTH_SECRET):", e instanceof Error ? e.message : e);
  }
  return (
    <html lang="uk" className={`${inter.variable} ${roboto.variable} ${openSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-white font-sans">
        <SessionProvider session={session}>{children}</SessionProvider>
      </body>
    </html>
  );
}
