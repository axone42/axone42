import PageSeo from "@/components/PageSeo";
import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import ContactForm from "./ContactForm";
import { Suspense } from "react";

export const metadata: Metadata = pageMetadata({
  title: "문의·무료 상담 신청",
  description:
    "AI 자동화·AX 컨설팅·챗봇·홈페이지 개발·교육 무료 상담. 업무 상황을 남겨주시면 영업일 기준 1~2일 내 연락드립니다. · 에이엑스원(AXONE).",
  alternates: { canonical: "/contact" },
});

export default function ContactPage() {
  return (
    <>
      <PageSeo path="/contact" title="문의·무료 상담 신청" type="ContactPage" />
      <section className="page-hero">
        <div className="container">
          <Reveal>
            <p className="eyebrow">Contact</p>
            <h1 className="page-hero__title">업무 고민부터 들려주세요</h1>
            <p className="page-hero__lead">
              어떤 서비스가 필요한지 몰라도 괜찮습니다. 현재 상황을 남겨주시면
              영업일 기준 1~2일 내 연락드립니다.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section--tight">
        <div className="container">
          <Reveal>
            <div className="contact-card">
              <Suspense fallback={<p>상담 양식을 준비하고 있습니다.</p>}><ContactForm /></Suspense>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
