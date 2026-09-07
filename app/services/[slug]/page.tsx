import Link from "next/link";
import { notFound } from "next/navigation";
import { services } from "@/lib/services";
import { contactForService, pricingForService } from "@/lib/pricing";
import { servicePrice, priceLabel, serviceSchema } from "@/lib/service-seo";
import { pageMetadata } from "@/lib/seo";
import PageSeo from "@/components/PageSeo";
import Faq from "@/components/Faq";
import DeliveryGuide from "@/components/DeliveryGuide";

export const dynamicParams = false;
export function generateStaticParams() { return services.map(s => ({ slug: s.id })); }
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) {
  const { slug } = await params; const service = services.find(s => s.id === slug); if (!service) notFound();
  return pageMetadata({ title: `${service.title} · 제공 범위와 비용`, description: `${service.summary} 에이엑스원(AXONE)의 제공 범위, 진행 절차와 비용 기준을 확인하고 현재 업무에 맞는 도입 방향을 상담하세요.`, alternates: { canonical: `/services/${slug}` } });
}
export default async function ServicePage({ params }: Props) {
  const { slug } = await params; const service = services.find(s => s.id === slug); if (!service) notFound();
  const path = `/services/${slug}`; const price = servicePrice(service);
  const faqs = [
    { q: `${service.title} 비용은 어떻게 정하나요?`, a: price ? `${priceLabel(price)}으로 안내합니다. ${price.scope}를 기본으로, ${price.confirm}을 확인해 착수 전 견적을 확정합니다.` : "필요한 기능과 운영 범위를 확인한 후 견적을 안내합니다." },
    { q: "상담 전에 무엇을 준비하면 되나요?", a: "현재 사용하는 도구, 반복되는 업무나 만들고 싶은 기능, 희망 일정을 정리해 주세요. 기술 용어를 모르셔도 업무 상황을 바탕으로 도입 방향을 상담할 수 있습니다." },
    { q: "도입 후 운영 범위도 정할 수 있나요?", a: "결과물, 인수인계, 유지보수와 운영 지원 범위를 착수 전에 함께 정합니다. 외부 도구 이용료와 추가 개발·운영 비용의 포함 여부도 견적서에서 확인합니다." },
  ];
  return <>
    <PageSeo path={path} title={service.title} description={service.summary} parent={{ path: "/services", title: "서비스" }} entities={[serviceSchema(service)]} />
    <article className="container seo-article">
      <header><p className="eyebrow">에이엑스원 서비스</p><h1>{service.title}</h1><p className="seo-lead">{service.summary}</p>
        <div className="tags">{service.tags?.map(tag => <span className="tag" key={tag}>{tag}</span>)}</div>
      </header>
      <section><h2>어떤 업무를 도와주나요?</h2><p>{service.description}</p>
        {service.bullets && <ul>{service.bullets.map(item => <li key={item}>{item}</li>)}</ul>}
        {service.curriculum && <ul>{service.curriculum.map(item => <li key={item}>{item}</li>)}</ul>}
      </section>
      {price && <section className="seo-callout"><h2>비용과 제공 범위는 어떻게 되나요?</h2><p className="seo-price">{priceLabel(price)}</p><p>{price.unit} · {price.scope}</p><p>상담에서 확인할 사항: {price.confirm}.</p>{price.note && <p>{price.note}</p>}<p>최종 제공 범위와 비용은 착수 전에 견적서로 확정합니다.</p><Link href={pricingForService(service.id)}>전체 가격과 견적 계산 보기 →</Link></section>}
      {service.process && <section><h2>어떤 순서로 진행하나요?</h2><ol className="seo-process">{service.process.map(step => <li key={step.step}><h3>{step.step}</h3><p>{step.desc}</p></li>)}</ol></section>}
      {service.automations && <section><h2>어떤 자동화를 만들 수 있나요?</h2><p>다음은 구현 가능한 업무 흐름의 예시입니다. 실제 연동 가능 여부와 처리 범위는 현재 쓰는 시스템을 확인한 뒤 정합니다.</p><div className="seo-example-grid">{service.automations.map(example => <div key={example.title}><h3>{example.title}</h3><p>{example.problem}</p><p>{example.flow}</p></div>)}</div></section>}
      <DeliveryGuide serviceId={service.id} />
      <section><h2>자주 묻는 질문</h2><Faq items={faqs} path={path} /></section>
      <section><h2>도입 전에 직접 확인하세요</h2><p>자체 제작 데모로 사용 흐름을 확인하고, AI 도입 가이드에서 준비할 자료와 비용 구분을 살펴보세요.</p><div className="seo-links"><Link href="/projects">자체 제작 데모</Link><Link href="/guides/ai-adoption">AI 도입 가이드</Link><Link href="/services">전체 서비스</Link></div></section>
      <div className="seo-actions"><Link href={contactForService(service.id)} className="btn btn--primary">{service.title} 상담하기</Link><Link href={pricingForService(service.id)} className="btn btn--ghost">가격 확인하기</Link></div>
    </article>
  </>;
}
