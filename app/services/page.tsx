import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import ServiceExplorer from "@/components/ServiceExplorer";
import { services } from "@/lib/services";

export const metadata: Metadata = {
  title: "서비스",
  description:
    "AI 자동화 운영서비스(n8n 워크플로우 사례), AX 컨설팅, 바이브코딩 강의, AI 자동화 강의 — 에이엑스원(AXONE)의 서비스 목록.",
};

export default function ServicesPage() {
  return (
    <>
      {/* Page hero */}
      <section className="page-hero">
        <div className="container">
          <Reveal>
            <p className="eyebrow">Services</p>
            <h1 className="page-hero__title">서비스 목록</h1>
            <p className="page-hero__lead">
              아래 항목을 선택하면 상세 안내를 확인할 수 있습니다. AI 자동화 운영부터
              전략 컨설팅, 실무 교육까지 기업의 AX 여정을 함께합니다.
            </p>
            <div className="anchors">
              {services.map((s) => (
                <a key={s.id} href={`#${s.id}`} className="anchor-chip">
                  {s.icon} {s.title}
                </a>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Service cards → modal */}
      <section className="section--tight">
        <div className="container">
          <ServiceExplorer />
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="container">
          <Reveal className="cta-band">
            <h2 className="cta-band__title">어떤 서비스가 필요하신가요?</h2>
            <p className="cta-band__sub">
              업무 상황을 알려주시면 가장 적합한 서비스와 예상 효과를 제안해 드립니다.
            </p>
            <div className="cta-band__actions">
              <Link href="/contact" className="btn btn--primary">상담 신청하기</Link>
              <Link href="/about" className="btn btn--ghost">회사 소개 보기</Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
