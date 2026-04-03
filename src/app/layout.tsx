import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LAMP - LinkedIn Article Management & Productivity",
  description:
    "Fetch, summarize, and manage your saved LinkedIn articles with AI-powered insights.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
