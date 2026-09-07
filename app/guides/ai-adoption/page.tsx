import Link from "next/link";
import PageSeo from "@/components/PageSeo";
import Faq from "@/components/Faq";
import { absoluteUrl, pageMetadata, SEO_UPDATED, siteName } from "@/lib/seo";
import { priceItems } from "@/lib/pricing";
import { priceLabel } from "@/lib/service-seo";

const path = "/guides/ai-adoption";
const title = "기업 AI 도입 가이드 · 자동화·챗봇·AX 컨설팅 비교";
const description = "우리 회사는 AI 자동화, 사내 지식 챗봇, AX 컨설팅 중 무엇부터 시작하면 좋을까요? 업무별 선택 기준, 구축비와 월 운영비의 차이, 상담 전 준비할 자료를 안내합니다.";
export const metadata = pageMetadata({ title, description, alternates: { canonical: path } });
const choices = [
  { id: "automation", slug: "ai-automation", label: "AI 업무 자동화", fit: "주문 정리, 문의 분류, 정기 리포트처럼 반복 순서가 있는 업무", check: "연동 권한, 예외 처리, 월 처리량" },
  { id: "chatbot", slug: "chatbot", label: "사내 지식·상담 챗봇", fit: "문서와 FAQ를 찾아 답하거나 고객의 이전 대화 맥락을 이어야 하는 업무", check: "문서 접근 권한, 답변 출처, 담당자 이관" },
  { id: "ax-consulting", slug: "ax-consulting", label: "AX 컨설팅", fit: "여러 부서 중 도입 우선순위와 실행 계획부터 정해야 하는 상황", check: "인터뷰 대상, 진단 범위, 로드맵 산출물" },
];
const faqs = [
  { q: "무료 상담과 유료 AX 컨설팅은 어떻게 다른가요?", a: "무료 상담에서는 현재 업무와 적용 가능성, 대략적인 범위를 안내합니다. 유료 AX 컨설팅은 업무 조사와 도입 우선순위, 실행 로드맵을 산출물로 정리하며 조사 대상과 결과물 범위는 착수 전에 확정합니다." },
  { q: "AI 자동화 구축비에 월 운영비도 포함되나요?", a: `구축비와 월 운영비를 구분해 확인해야 합니다. AXONE의 자동화 구축 안내는 ${priceLabel(priceItems.find(p => p.id === "automation")!)}이며, 연동 도구 수와 처리량, 장애 대응 범위를 상담에서 정합니다.` },
  { q: "AI 챗봇은 모든 질문에 정확하게 답하나요?", a: "모든 답변의 정확성을 보장할 수는 없습니다. 답변 근거가 되는 문서를 관리하고 대표 질문으로 품질을 확인하며, 근거가 부족하거나 중요한 판단이 필요한 문의를 담당자에게 넘기는 흐름을 마련해야 합니다." },
];

export default function AIAdoptionGuide() {
  return <>
    <PageSeo path={path} title="기업 AI 도입 가이드" description={description} entities={[{
      "@type": "Article", "@id": `${absoluteUrl(path)}#article`, headline: title, description,
      datePublished: SEO_UPDATED, dateModified: SEO_UPDATED,
      author: { "@type": "Organization", name: siteName, url: absoluteUrl("/about") },
      publisher: { "@id": absoluteUrl("/#organization") }, image: absoluteUrl("/opengraph-image"), mainEntityOfPage: absoluteUrl(path), inLanguage: "ko-KR",
    }]} />
    <article className="container seo-article">
      <header><p className="eyebrow">기업 AI 도입 안내</p><h1>AI 자동화·챗봇·AX 컨설팅,<br />무엇부터 시작할까요?</h1><p className="seo-lead">{description}</p><p className="seo-byline">작성: <Link href="/about">{siteName}</Link> · 안내 기준일: <time dateTime={SEO_UPDATED}>2026년 9월 7일</time></p></header>
      <section className="seo-callout"><h2>먼저 확인할 세 가지</h2><ul><li>반복 순서가 명확한 업무는 작은 자동화부터 시작할 수 있습니다.</li><li>문서를 찾아 답하는 일이 많다면 지식 챗봇의 적용 가능성을 확인하세요.</li><li>어느 부서부터 바꿀지 막막하다면 업무 진단과 실행 계획이 먼저입니다.</li></ul></section>
      <nav aria-label="가이드 목차" className="seo-toc"><a href="#definition">AX와 AI 자동화는 무엇인가요?</a><a href="#compare">어떤 서비스를 선택하면 좋을까요?</a><a href="#cost">어떤 비용을 구분해야 하나요?</a><a href="#prepare">상담 전에 무엇을 준비하나요?</a></nav>
      <section id="definition"><h2>AX와 AI 자동화는 무엇인가요?</h2><p>AX는 AI Transformation의 약자로, AI를 활용해 기업의 업무 방식과 운영 구조를 바꾸는 접근입니다. 도구 구독만으로 끝내기보다 어느 업무를 개선할지, 누가 결과를 확인할지, 도입 후 어떻게 운영할지를 함께 정합니다.</p><p>AI 자동화는 그 실행 방법 중 하나입니다. 예를 들어 고객 문의를 분류하고 주문 정보를 조회한 뒤 답변 초안을 만들되, 최종 확인은 담당자가 맡도록 연결할 수 있습니다.</p></section>
      <section id="compare"><h2>우리 업무에는 어떤 서비스가 맞을까요?</h2><div className="seo-table-wrap" tabIndex={0} role="region" aria-label="AI 도입 서비스 비교표"><table><caption>AXONE의 서비스별 선택 기준과 안내 가격</caption><thead><tr><th scope="col">선택지</th><th scope="col">적합한 상황</th><th scope="col">확인할 사항</th><th scope="col">비용 기준</th></tr></thead><tbody>{choices.map(c => <tr key={c.id}><th scope="row"><Link href={`/services/${c.slug}`}>{c.label}</Link></th><td>{c.fit}</td><td>{c.check}</td><td>{priceLabel(priceItems.find(p => p.id === c.id)!)}</td></tr>)}</tbody></table></div><p>업무에 따라 두 가지 이상을 함께 구성할 수도 있습니다. 표의 금액은 도입 범위를 정하기 위한 안내이며 최종 금액과 운영 조건은 견적서에서 확정합니다.</p></section>
      <section id="cost"><h2>구축비 외에 어떤 비용을 확인해야 하나요?</h2><ul><li><strong>초기 구축비:</strong> 업무 분석, 화면·기능 개발과 연결 작업의 범위입니다.</li><li><strong>월 운영비:</strong> 모니터링, 장애 대응, 수정·개선의 포함 범위를 확인합니다.</li><li><strong>외부 서비스 이용료:</strong> AI 모델, 서버, 자동화 도구 등의 요금이 견적에 포함되는지 확인합니다.</li><li><strong>추가 작업:</strong> 기능 변경, 데이터 이관과 교육의 별도 비용 여부를 확인합니다.</li></ul><Link href="/pricing">서비스별 가격과 견적 계산 보기 →</Link></section>
      <section id="prepare"><h2>상담 전에 무엇을 준비하면 좋을까요?</h2><ol><li>반복되는 업무 한 가지와 현재 처리 순서를 적어 주세요.</li><li>사용 중인 도구와 연결 가능한 API·데이터가 있는지 확인해 주세요.</li><li>개인정보나 기밀을 제거한 샘플 문서·양식을 준비해 주세요.</li><li>처리량, 오류가 났을 때의 대응 방식, 희망 일정을 알려주세요.</li></ol><p>작은 범위로 먼저 검증하고, 처리 시간·오류·담당자 확인 건수 등 실제 업무 지표를 비교한 뒤 확장하는 방식으로 진행할 수 있습니다.</p></section>
      <section><h2>자주 묻는 질문</h2><Faq items={faqs} path={path} /></section>
      <section><h2>도구의 기능은 어디서 확인할 수 있나요?</h2><p>아래는 구현 도구의 공식 문서입니다. 적용 도구는 업무와 기존 시스템에 따라 선택합니다.</p><ul><li><a href="https://pydantic.dev/docs/ai/overview/">PydanticAI 공식 문서: 에이전트와 응답 데이터 검증</a></li><li><a href="https://code.claude.com/docs/en/agent-sdk/overview">Claude Agent SDK 공식 문서: 도구를 사용하는 에이전트 구성</a></li></ul></section>
      <div className="seo-actions"><Link href="/contact" className="btn btn--primary">현재 업무로 무료 상담하기</Link><Link href="/projects" className="btn btn--ghost">자체 제작 데모 체험</Link></div>
    </article>
  </>;
}
