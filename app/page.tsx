import Link from "next/link";
import Reveal from "@/components/Reveal";
import CaseStudies from "@/components/CaseStudies";
import Faq from "@/components/Faq";
import { serviceGroups } from "@/lib/service-groups";

export default function Home() {
  return <>
    <section className="hero">
      <div className="hero-inner hero-inner--split">
        <div className="hero-content">
          <span className="hero__badge">AXONE · AI 업무 전환 파트너</span>
          <h1 className="hero__title">반복 업무는 줄이고,<br />중요한 일에 집중하세요</h1>
          <p className="hero__sub">매일 옮기는 엑셀, 반복되는 고객 문의.<br />업무에 맞는 AI 자동화와 웹·시스템을 설계하고 만듭니다.</p>
          <div className="hero__actions"><Link href="/contact" className="btn btn--light">내 업무 무료 상담</Link><Link href="#demos" className="btn btn--ghost">결과물 먼저 체험하기 ↓</Link></div>
          <p className="hero__note">서비스를 몰라도 괜찮습니다. 현재 쓰는 도구와 업무부터 알려주세요.</p>
        </div>
        <div className="workflow-preview" aria-label="주문 문의 분류 자동화 예시">
          <div className="workflow-preview__bar"><span>업무 흐름 미리보기</span><span className="demo-label">구현 예시</span></div>
          <div className="workflow-preview__input"><span>고객 문의</span><p>“주문한 상품은 언제 도착하나요?”</p></div>
          <div className="workflow-preview__connector" aria-hidden>↓</div>
          <div className="workflow-preview__step"><span>01</span><div><b>문의 유형 분류</b><small>배송 · 교환 · 상품 문의 구분</small></div></div>
          <div className="workflow-preview__connector" aria-hidden>↓</div>
          <div className="workflow-preview__step"><span>02</span><div><b>주문 정보 확인</b><small>연결된 시스템에서 필요한 정보 조회</small></div></div>
          <div className="workflow-preview__connector" aria-hidden>↓</div>
          <div className="workflow-preview__result"><b>답변 초안 작성 → 담당자 확인</b><p>자동 처리와 사람이 확인할 단계를 함께 설계합니다.</p></div>
        </div>
      </div>
    </section>
    <section className="section" id="services"><div className="container">
      <Reveal><p className="eyebrow">필요한 변화부터</p><h2 className="section-title">지금 해결하고 싶은 일은 무엇인가요?</h2></Reveal>
      <div className="service-paths">{serviceGroups.map((group,i) => <Link className="service-path" href={`/services#${group.id}`} key={group.id}>
        <span className="service-path__number">0{i+1}</span><p className="eyebrow">{group.label}</p><h3>{group.title}</h3><p>{group.description}</p><span className="card__link">관련 서비스 보기 →</span>
      </Link>)}</div>
    </div></section>
    <section className="section section--tinted" id="demos"><div className="container">
      <Reveal><p className="eyebrow">직접 사용해 보세요</p><h2 className="section-title">설명보다 먼저, 동작하는 화면</h2><p className="section-lead">AXONE이 만든 데모로 사용 흐름을 확인하세요. 각 데모의 체험 범위를 함께 안내합니다.</p></Reveal>
      <CaseStudies />
      <div className="section-action"><Link href="/projects" className="btn btn--ghost">전체 데모와 프로젝트 보기 →</Link></div>
    </div></section>
    <section className="section"><div className="container consultation-split">
      <div><p className="eyebrow">상담부터 실행까지</p><h2 className="section-title">작게 확인하고,<br />필요한 범위를 정합니다</h2><p className="section-lead">어떤 도구를 쓸지보다 어떤 일이 달라져야 하는지 먼저 이야기합니다.</p><Link href="/pricing" className="card__link">서비스별 비용과 범위 확인 →</Link></div>
      <ol className="engagement-steps">
        <li><span>01</span><div><h3>무료 상담 · 적용 가능성 확인</h3><p>현재 업무와 도구, 해결하려는 문제를 듣고 가능한 방향을 안내합니다.</p></div></li>
        <li><span>02</span><div><h3>범위·일정·비용 합의</h3><p>받으실 결과물과 운영 범위를 견적서로 확인한 뒤 유료 작업을 시작합니다.</p></div></li>
        <li><span>03</span><div><h3>구축·확인·운영</h3><p>실제 업무에 적용해 확인하고, 합의한 범위에 따라 인수인계와 운영을 진행합니다.</p></div></li>
      </ol>
    </div></section>
    <section className="section"><div className="container"><Reveal><p className="eyebrow">자주 묻는 질문</p><h2 className="section-title">맡기기 전에 궁금한 점</h2></Reveal><div style={{marginTop:32}}><Faq /></div></div></section>
    <section className="section"><div className="container"><div className="cta-band"><h2 className="cta-band__title">매일 반복하는 업무 하나부터</h2><p className="cta-band__sub">지금 쓰는 도구와 줄이고 싶은 일을 알려주세요. 함께 시작점을 찾겠습니다.</p><div className="cta-band__actions"><Link href="/contact" className="btn btn--primary">무료 상담 신청</Link><Link href="/pricing" className="btn btn--ghost">예상 비용 확인</Link></div></div></div></section>
  </>;
}
