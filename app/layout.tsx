import type { Metadata } from "next";
import "./globals.css";
import TabBar from "../components/TabBar";

export const metadata: Metadata = {
  metadataBase: new URL("https://vejaview.com"),
  title: "베자뷰 — 베트남의 모든 체험, 리뷰로 돌려받다",
  description:
    "다낭·나트랑·푸꾸옥 맛집부터 마사지·스파, 투어·액티비티까지 무료로 체험하고 네이버 블로그·인스타그램·유튜브 리뷰로 돌려받는 베트남 체험단·기자단 플랫폼. 사장님은 한국인 리뷰어에게 우리 가게를 알리세요.",
  keywords: ["베트남 체험단", "다낭 체험단", "다낭 맛집", "나트랑 체험단", "푸꾸옥", "기자단", "베트남 여행", "블로그 체험단", "베자뷰"],
  openGraph: {
    title: "베자뷰 — 베트남의 모든 체험, 리뷰로 돌려받다",
    description:
      "다낭·나트랑·푸꾸옥 맛집, 마사지·스파, 투어를 무료 체험하고 블로그·인스타·유튜브 리뷰로 돌려받는 베트남 체험단·기자단 플랫폼",
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
