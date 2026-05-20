import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "心斋 · 八字人格匹配",
  description: "基于八字人格的轻社交系统",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-paper text-ink-900 antialiased pb-16">
        {children}
        <Navigation />
      </body>
    </html>
  );
}
