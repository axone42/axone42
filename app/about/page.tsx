import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "회사소개 — AI 트랜스포메이션 파트너",
  description:
    "AI 전환 파트너 에이엑스원(AXONE). 대표 이원희, 경기 부천 소재. 컨설팅부터 개발·운영·교육까지 실행하는 AX 전문 기업의 소개와 사업자 정보·등록 업종.",
  alternates: { canonical: "/about" },
};

const values = [
  { icon: "🎯", title: "실행까지 책임", body: "컨설팅으로 끝내지 않습니다. 기획·개발 역량으로 실제 도입까지 완주합니다." },
  { icon: "⚡", title: "빠른 자동화", body: "n8n 기반으로 아이디어를 빠르게 워크플로우로 만들어 검증합니다." },
  { icon: "🤝", title: "역량 내재화", body: "만들어 드리는 것을 넘어, 팀이 스스로 운영할 수 있도록 교육합니다." },
];

const infoRows = [
  { label: "상호", value: `${site.name}(${site.nameEn})` },
  { label: "대표", value: site.ceo },
  { label: "사업자등록번호", value: site.bizNumber },
  { label: "개업일", value: "2022년 7월 11일" },
  { label: "소재지", value: site.address },
  { label: "이메일", value: site.email },
];

export default function AboutPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <Reveal>
            <p className="eyebrow">About</p>
            <h1 className="page-hero__title">
              AI가 일하게 만드는<br />트랜스포메이션 파트너
            </h1>
            <p className="page-hero__lead">{site.description}</p>
          </Reveal>
        </div>
      </section>

      {/* Values */}
      <section className="section--tight"><div className="container about-owner">
        <div className="about-owner__mark" aria-hidden>AX</div>
        <div><p className="eyebrow">에이엑스원 대표</p><h2>{site.ceo}</h2><p>AI 업무 자동화, 웹·시스템 구축, 컨설팅과 실무 교육을 제공합니다. 귀사의 현재 업무와 목표를 바탕으로 필요한 개발·운영 범위를 상담합니다.</p><a className="card__link" href={`mailto:${site.email}`}>{site.email} →</a></div>
        <div className="about-evidence"><h3>맡기기 전에 확인하세요</h3><p>직접 만든 데모의 체험 범위를 공개하고, 진행 전 결과물·일정·비용·운영 조건을 함께 정합니다.</p><Link href="/projects" className="btn btn--ghost">자체 제작 데모 보기 →</Link></div>
      </div></section>
      <section className="section--tight">
        <div className="container">
          <div className="cards">
            {values.map((v, i) => (
              <Reveal key={v.title} delay={i * 60}>
                <div className="card" style={{ height: "100%" }}>
                  <span className="card__icon" aria-hidden>{v.icon}</span>
                  <h3 className="card__title">{v.title}</h3>
                  <p className="card__body">{v.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <div className="container"><div className="glow-strip" /></div>

      {/* Company info + categories */}
      <section className="section">
        <div className="container">
          <div className="split split--wide-left">
            <Reveal>
              <p className="eyebrow">Company</p>
              <h2 className="section-title">사업자 정보</h2>
              <div className="info-list" style={{ marginTop: 24 }}>
                {infoRows.map((r) => (
                  <div key={r.label} className="info-list__item">
                    <p className="info-list__label">{r.label}</p>
                    <p className="info-list__value">{r.value}</p>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={80}>
              <p className="eyebrow">Business scope</p>
              <h2 className="section-title">등록 업종</h2>
              <ul className="curric" style={{ gridTemplateColumns: "1fr", marginTop: 24 }}>
                {site.categories.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="container">
          <Reveal className="cta-band">
            <h2 className="cta-band__title">함께 만들어 보시겠어요?</h2>
            <p className="cta-band__sub">AI 자동화, 컨설팅, 제작, 교육 — 무엇이든 편하게 문의해 주세요.</p>
            <div className="cta-band__actions">
              <Link href="/contact" className="btn btn--primary">문의하기</Link>
              <Link href="/services" className="btn btn--ghost">서비스 보기</Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
