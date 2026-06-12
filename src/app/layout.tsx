import type { Metadata, Viewport } from "next";
import { Inter, Roboto, Open_Sans } from "next/font/google";
import "./globals.css";
import { auth } from "@/auth";
import { SessionProvider } from "@/components/providers/SessionProvider";

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
  title: "volya.finance — Страхування авто онлайн",
  description:
    "Оформіть ОСЦПВ (автоцивілку) онлайн за 3 хвилини. Порівняйте ціни від 18+ страхових компаній. Офіційні поліси МТСБУ.",
  keywords: ["ОСЦПВ", "автоцивілка", "страхування авто", "онлайн страхування", "поліс"],
  openGraph: {
    title: "volya.finance — Страхування авто онлайн",
    description: "Оформіть ОСЦПВ онлайн за 3 хвилини. Найкращі ціни від 18+ страховиків.",
    type: "website",
    locale: "uk_UA",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  return (
    <html lang="uk" className={`${inter.variable} ${roboto.variable} ${openSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-white font-sans">
        <SessionProvider session={session}>{children}</SessionProvider>
      </body>
    </html>
  );
}
