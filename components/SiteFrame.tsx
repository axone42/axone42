"use client";

import { usePathname } from "next/navigation";

/**
 * 마케팅 사이트 껍데기(상단 배너·네비·푸터)를 경로에 따라 조건부로 렌더.
 * /lab/* (자체 프로젝트 데모)는 마케팅 껍데기 없이 전체화면으로 열려,
 * 실제 구동되는 독립 사이트처럼 보이게 합니다.
 * nav/footer/jsonLd는 서버 컴포넌트를 그대로 노드로 전달받아 사용합니다.
 */
export default function SiteFrame({
  nav,
  footer,
  jsonLd,
  children,
}: {
  nav: React.ReactNode;
  footer: React.ReactNode;
  jsonLd: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "";
  const bare = pathname.startsWith("/lab");

  if (bare) {
    // 데모: 전체화면 — 마케팅 껍데기 제거
    return <>{children}</>;
  }

  return (
    <>
      {jsonLd}
      <a href="/contact" className="status-banner">
        <span className="status-banner__dot" aria-hidden>✦</span>
        AI 자동화·AX 무료 진단 상담을 받고 있습니다
        <span className="status-banner__arrow" aria-hidden>→</span>
      </a>
      {nav}
      <main>{children}</main>
      {footer}
    </>
  );
}
