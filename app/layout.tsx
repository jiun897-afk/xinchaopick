import type { Metadata } from "next";
import "./globals.css";
import TabBar from "../components/TabBar";

export const metadata: Metadata = {
  title: "베자뷰 — 베트남의 모든 체험, 리뷰로 돌려받다",
  description:
    "다낭 맛집·마사지·액티비티를 무료로 체험하고 네이버 블로그·유튜브·인스타그램 리뷰로 돌려받으세요. 베트남 체험단 플랫폼 베자뷰.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700;800;900&display=swap"
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
