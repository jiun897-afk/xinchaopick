import type { Metadata } from "next";
import "./globals.css";
import TabBar from "../components/TabBar";

export const metadata: Metadata = {
  metadataBase: new URL("https://vejaview.com"),
  title: "베자뷰 — 베트남의 모든 체험, 리뷰로 돌려받다",
  description: "베트남 체험단 · 기자단 플랫폼",
  openGraph: {
    title: "베자뷰",
    description: "베트남 체험단 · 기자단 플랫폼",
    siteName: "베자뷰",
    url: "https://vejaview.com",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#F55B24" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <TabBar />
      </body>
    </html>
  );
}
