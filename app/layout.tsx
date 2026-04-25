import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tea Master HUB",
  description: "Система обучения сотрудников",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Добавили suppressHydrationWarning, чтобы убрать конфликты с расширениями браузера
    <html lang="ru" suppressHydrationWarning>
      <body>
        {children}
      </body>
    </html>
  );
}