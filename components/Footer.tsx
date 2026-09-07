import Link from "next/link";
import { site } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div>
            <div className="footer__brand">
              <span className="nav__logo" aria-hidden>AX</span>
              {site.nameEn} · {site.name}
            </div>
            <p className="footer__desc">{site.description}</p>
          </div>

          <div className="footer__col">
            <h4>서비스</h4>
            <Link href="/services#ai-automation">AI 자동화 운영</Link>
            <Link href="/services#ax-consulting">AX 컨설팅</Link>
            <Link href="/services#shopping-mall">쇼핑몰 구축</Link>
            <Link href="/services#chatbot">챗봇 개발</Link>
            <Link href="/services#erp-crm">ERP / CRM 개발</Link>
            <Link href="/services#website">홈페이지 구축</Link>
            <Link href="/services#vibe-coding">바이브코딩 강의</Link>
            <Link href="/services#ai-automation-course">AI 자동화 강의</Link>
          </div>

          <div className="footer__col">
            <h4>회사</h4>
            <Link href="/about">회사소개</Link>
            <Link href="/services">전체 서비스</Link>
            <Link href="/projects">자체 프로젝트</Link>
            <Link href="/contact">문의하기</Link>
          </div>

          <div className="footer__col">
            <h4>사업자 정보</h4>
            <p>대표 {site.ceo}</p>
            <p>사업자등록번호 {site.bizNumber}</p>
            <p>{site.address}</p>
            <p>{site.email}</p>
          </div>
        </div>

        <div className="footer__bottom">
          <span>© {new Date().getFullYear()} {site.name}({site.nameEn}). All rights reserved.</span>
          <span style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <Link href="/privacy" style={{ color: "inherit" }}>개인정보처리방침</Link>
            <Link href="/terms" style={{ color: "inherit" }}>이용약관</Link>
            <span>사업자등록번호 {site.bizNumber}</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
