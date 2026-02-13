import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { FontSizeProvider } from "@/components/font-size-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HNW 홍보 아카이브",
  description: "HNW지원부 홍보활동 아카이브 - 2025년 이후 인터뷰, 세미나 안내, 소개 및 홍보 기사 모음",
  keywords: ["HNW", "홍보", "아카이브", "인터뷰", "세미나", "솔루션"],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HNW Archive",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 3,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <FontSizeProvider>
          <PullToRefresh>{children}</PullToRefresh>
        </FontSizeProvider>
        <Toaster richColors closeButton position="bottom-center" />
      </body>
    </html>
  );
}
