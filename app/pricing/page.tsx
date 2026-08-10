import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import PricingCalculator from "@/components/PricingCalculator";

export const metadata: Metadata = {
  title: "가격 · 조합형 견적",
  description:
    "필요한 서비스를 골라 조합하면 예상 시작가가 계산됩니다. AX 컨설팅·챗봇·개발·자동화·디자인·교육까지 — 에이엑스원(AXONE) 맞춤 견적.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <Reveal>
            <p className="eyebrow">Pricing</p>
            <h1 className="page-hero__title">필요한 만큼, 조합형 견적</h1>
            <p className="page-hero__lead">
              하나의 고정 패키지가 아니라, 필요한 서비스만 골라 조합합니다. 아래에서 선택하면
              예상 시작가가 바로 계산되고, 정확한 견적은 상담으로 확정해 드립니다.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section--tight">
        <div className="container">
          <Reveal>
            <PricingCalculator />
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="container">
          <Reveal className="cta-band">
            <h2 className="cta-band__title">어떤 조합이 맞을지 모르시겠나요?</h2>
            <p className="cta-band__sub">현재 상황을 알려주시면 최적의 조합과 예상 비용을 제안해 드립니다.</p>
            <div className="cta-band__actions">
              <Link href="/contact" className="btn btn--primary">무료 상담 신청</Link>
              <Link href="/services" className="btn btn--ghost">서비스 자세히 보기</Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
