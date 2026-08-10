import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name}(${site.nameEn}) — ${site.tagline}`,
    template: `%s | ${site.nameEn}`,
  },
  description: site.description,
  keywords: [
    "AX컨설팅",
    "AI자동화",
    "n8n",
    "바이브코딩",
    "AI 자동화 강의",
    "홈페이지 제작",
    "에이엑스원",
    "AXONE",
  ],
  openGraph: {
    title: `${site.name}(${site.nameEn})`,
    description: site.description,
    type: "website",
    locale: "ko_KR",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        {/* 첫 페인트 전에 .js 표시 → JS 켜진 경우에만 reveal 숨김 적용 */}
        <script
          dangerouslySetInnerHTML={{
            __html: "document.documentElement.classList.add('js')",
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Geist:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <JsonLd />
        <a href="/contact" className="status-banner">
          <span className="status-banner__dot" aria-hidden>✦</span>
          AI 자동화·AX 무료 진단 상담을 받고 있습니다
          <span className="status-banner__arrow" aria-hidden>→</span>
        </a>
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
