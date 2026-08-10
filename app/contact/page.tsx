import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import ContactForm from "./ContactForm";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "문의·무료 상담 신청",
  description:
    "AI 자동화·AX 컨설팅·챗봇·홈페이지 개발·교육 무료 상담. 업무 상황을 남겨주시면 영업일 기준 1~2일 내 연락드립니다. — 에이엑스원(AXONE).",
  alternates: { canonical: "/contact" },
};

const contactInfo = [
  { label: "이메일", value: site.email },
  { label: "대표", value: site.ceo },
  { label: "소재지", value: site.address },
  { label: "사업자등록번호", value: site.bizNumber },
];

export default function ContactPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <Reveal>
            <p className="eyebrow">Contact</p>
            <h1 className="page-hero__title">문의하기</h1>
            <p className="page-hero__lead">
              자동화하고 싶은 업무, 컨설팅·제작·교육 문의를 남겨 주세요.
              접수 즉시 확인 후 영업일 기준 1~2일 내 연락드립니다.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section--tight">
        <div className="container">
          <div className="split split--wide-left">
            <Reveal>
              <div className="card" style={{ padding: 32 }}>
                <ContactForm />
              </div>
            </Reveal>

            <Reveal delay={80}>
              <p className="eyebrow">Reach us</p>
              <h2 className="section-title">연락처</h2>
              <div className="info-list" style={{ marginTop: 24 }}>
                {contactInfo.map((c) => (
                  <div key={c.label} className="info-list__item">
                    <p className="info-list__label">{c.label}</p>
                    <p className="info-list__value">{c.value}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
