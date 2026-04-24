export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body style={{ margin: 0, backgroundColor: '#f5f5f5', fontFamily: 'sans-serif' }}>
        {children}
      </body>
    </html>
  );
}