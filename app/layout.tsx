import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import SiteFrame from "@/components/SiteFrame";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  alternates: { canonical: "/" },
  title: {
    default: "에이엑스원(AXONE) | AI 자동화·AX 컨설팅 파트너",
    template: `%s | ${site.nameEn}`,
  },
  description:
    "기업의 AI 전환(AX)을 설계하고 실행합니다. n8n 기반 AI 자동화 운영, AX 컨설팅, 챗봇·쇼핑몰·ERP 개발, 홈페이지 제작, 실무 교육까지 — 에이엑스원(AXONE).",
  applicationName: `${site.name}(${site.nameEn})`,
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
    siteName: `${site.name}(${site.nameEn})`,
    url: site.url,
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name}(${site.nameEn})`,
    description: site.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  verification: {
    // 구글 서치콘솔 등록 후 코드를 GOOGLE_SITE_VERIFICATION 환경변수로 넣으면 자동 반영됩니다.
    google: process.env.GOOGLE_SITE_VERIFICATION,
    other: {
      "naver-site-verification": "f846974c6370a8241688fbafc3b3659686041eae",
    },
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
        <link
          rel="preload"
          href="/fonts/suit/SUIT-Variable.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <SiteFrame nav={<Nav />} footer={<Footer />} jsonLd={<JsonLd />}>
          {children}
        </SiteFrame>
      </body>
    </html>
  );
}
