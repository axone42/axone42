import PageSeo from "@/components/PageSeo";
import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import PricingCalculator from "@/components/PricingCalculator";
import DeliveryGuide from "@/components/DeliveryGuide";

export const metadata: Metadata = pageMetadata({
  title: "가격 · 조합형 견적",
  description:
    "필요한 서비스를 골라 조합하면 예상 시작가가 계산됩니다. AX 컨설팅·챗봇·개발·자동화·디자인·교육까지 · 에이엑스원(AXONE) 맞춤 견적.",
  alternates: { canonical: "/pricing" },
});

export default function PricingPage() {
  return (
    <>
      <PageSeo path="/pricing" title="가격 · 조합형 견적" />
      <section className="page-hero">
        <div className="container">
          <Reveal>
            <p className="eyebrow">Pricing</p>
            <h1 className="page-hero__title">초기 비용부터 월 운영비까지</h1>
            <p className="page-hero__lead">
              필요한 서비스를 고르면 초기 비용과 매월 비용을 따로 확인할 수 있습니다.
              각 서비스의 제공 내용과 상담에서 확정할 범위도 함께 살펴보세요.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section--tight">
        <div className="container consultation-compare">
          <div><span className="eyebrow">무료 상담</span><h2>우리 업무에 적용할 수 있을까요?</h2><p>업무 상황을 듣고 적용 가능성과 대략적인 범위를 안내합니다. 서비스 선택과 계약 의무가 없습니다.</p></div>
          <div><span className="eyebrow">유료 AX 컨설팅 · 500만원 기준</span><h2>진단과 실행 로드맵이 필요해요</h2><p>업무 조사, 도입 우선순위와 실행 계획을 산출물로 정리합니다. 조사 기간·대상·산출물 범위는 착수 전 견적서로 확정합니다.</p></div>
        </div>
        <div className="container">
          <Reveal>
            <PricingCalculator />
          </Reveal>
        </div>
      </section>

      <div className="container"><DeliveryGuide /></div>
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
