import PageSeo from "@/components/PageSeo";
import { services } from "@/lib/services";
import { serviceCatalogSchema } from "@/lib/service-seo";
import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import ServiceExplorer from "@/components/ServiceExplorer";
import { serviceGroups } from "@/lib/service-groups";
import DeliveryGuide from "@/components/DeliveryGuide";

export const metadata: Metadata = pageMetadata({
  title: "AI 자동화·컨설팅·챗봇·개발 서비스",
  description:
    "업무 자동화, 웹·시스템 구축, 컨설팅·교육. 해결하고 싶은 문제에 맞춰 AXONE의 12개 서비스와 자동화 구현 예시를 확인하세요.",
  alternates: { canonical: "/services" },
});

export default function ServicesPage() {
  return (
    <>
      <PageSeo path="/services" title="AI 자동화·컨설팅·챗봇·개발 서비스" type="CollectionPage" entities={[serviceCatalogSchema]} />
      {/* Page hero */}
      <section className="page-hero">
        <div className="container">
          <Reveal>
            <p className="eyebrow">Services</p>
            <h1 className="page-hero__title">해결하고 싶은 일에서 시작하세요</h1>
            <p className="page-hero__lead">
              반복 업무를 줄이는 일, 필요한 시스템을 만드는 일, 팀의 AI 역량을 키우는 일.
              목적에 맞는 서비스를 확인하고 필요한 범위만 상담하세요.
            </p>
            <div className="anchors">
              {serviceGroups.map((s) => (
                <a key={s.id} href={`#${s.id}`} className="anchor-chip">
                  {s.label}
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
          <section className="seo-service-index"><h2>서비스별 제공 범위와 비용</h2><p>각 서비스의 상세 안내에서 진행 절차와 도입 전에 준비할 내용을 확인하세요.</p><ul>{services.map(s => <li key={s.id}><Link href={`/services/${s.id}`}>{s.title} →</Link></li>)}</ul></section>
        </div>
      </section>

      <div className="container"><DeliveryGuide /></div>
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
