import type { Metadata } from "next";
import "./globals.css";
import "./learning.css";

export const metadata: Metadata = {
  title: "English Studio | Английский для твоей жизни",
  description: "Короткие уроки, ИИ-репетиторы и английский для BIM, работы и жизни в США и Канаде.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "English Studio", statusBarStyle: "default" },
  icons: {
    apple: "/icon-192.png",
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head><link rel="stylesheet" href="/fonts/studio/fonts.css"/><meta name="theme-color" content="#f8f6ef"/></head>
      <body>{children}</body>
    </html>
  );
}
