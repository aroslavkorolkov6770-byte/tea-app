import type { Metadata } from "next";
import "./globals.css";
import CookieBanner from "./components/CookieBanner";

export const metadata: Metadata = {
  title: "Master HUB",
  description: "Система обучения сотрудников",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black",
    title: "Tea Hub",
  },
  // --- ДОБАВЛЕНО: ЗАПРЕТ НА ИНДЕКСАЦИЮ ПОИСКОВИКАМИ ---
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning style={{ overscrollBehavior: 'none' }}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
      </head>
      <body style={{ backgroundColor: '#0d0f0d', overscrollBehavior: 'none' }}>
        {children}
        
        {/* Вызываем нашу новую плашку */}
        <CookieBanner />
      </body>
    </html>
  );
}