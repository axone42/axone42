"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { serviceGroups } from "@/lib/service-groups";

type Group = (typeof serviceGroups)[number];
const introductions: Record<string, { lead: string; examples: string[]; offerings: string; next: string }> = {
  operations: {
    lead: "매일 반복하는 작업부터 살펴보고, 지금 쓰는 도구를 연결해 사람이 확인할 일과 자동으로 처리할 일을 나눕니다.",
    examples: ["여러 곳의 주문·문의 정보를 엑셀에 옮기는 업무", "비슷한 고객 질문에 답하거나 사내 문서를 찾는 업무", "자료를 주기적으로 수집하고 정리해 보고하는 업무"],
    offerings: "AI 업무 자동화 · 기업형 챗봇 · 데이터 수집",
    next: "현재 쓰는 도구와 반복되는 업무 하나만 정리해 주세요. 연결 가능성과 필요한 범위부터 함께 확인합니다.",
  },
  build: {
    lead: "고객에게 보여줄 웹사이트부터 팀이 매일 사용할 관리 도구까지, 필요한 기능과 사용 흐름을 먼저 정하고 구축합니다.",
    examples: ["회사와 서비스를 소개하고 문의를 받을 홈페이지", "상품 탐색부터 주문까지 이어지는 쇼핑몰", "새 아이디어를 검증할 MVP나 고객·업무를 관리할 시스템"],
    offerings: "홈페이지 · 쇼핑몰 · MVP · ERP/CRM · 브랜드 디자인 · 마케팅",
    next: "누가 사용할지, 꼭 필요한 기능이 무엇인지부터 알려주세요. 디자인과 운영에 필요한 범위도 함께 정합니다.",
  },
  enablement: {
    lead: "AI를 어디부터 적용할지 막막하다면 현재 업무를 진단하고, 실행 계획을 세우거나 팀이 직접 활용할 수 있도록 실습합니다.",
    examples: ["우리 회사에 맞는 AI 도입 우선순위와 실행 계획 수립", "아이디어를 직접 만들어 보는 바이브코딩 실습", "반복 업무에 적용하는 AI 자동화 도구와 흐름 학습"],
    offerings: "AX 진단·로드맵 컨설팅 · 바이브코딩 강의 · AI 자동화 강의",
    next: "도입 방향을 정하는 컨설팅과 직접 만들어 보는 교육 중 필요한 방식을 살펴보세요. 무료 상담에서 먼저 방향을 이야기할 수 있습니다.",
  },
};

export default function ServicePaths() {
  const [active, setActive] = useState<Group | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!active || !dialog.current) return;
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
      trigger.current?.focus({ preventScroll: true });
    };
  }, [active]);

  const content = active ? introductions[active.id] : null;
  return <>
    <div className="service-paths">
      {serviceGroups.map((group, i) => (
        <button className="service-path" type="button" key={group.id} aria-haspopup="dialog"
          onClick={(event) => { trigger.current = event.currentTarget; setActive(group); }}>
          <span className="service-path__number">0{i + 1}</span>
          <span className="eyebrow">{group.label}</span>
          <span className="service-path__title">{group.title}</span>
          <span className="service-path__description">{group.description}</span>
          <span className="card__link">어떤 도움을 받을 수 있나요? +</span>
        </button>
      ))}
    </div>
    <dialog ref={dialog} className="service-intro" aria-labelledby="service-intro-title" aria-describedby="service-intro-description"
      onCancel={() => setActive(null)}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) setActive(null);
      }}>
      {active && content && <>
        <button type="button" className="modal__close" aria-label="설명 닫기" onClick={() => setActive(null)}>✕</button>
        <p className="eyebrow">{active.label}</p>
        <h2 id="service-intro-title">{active.title}</h2>
        <p className="service-intro__lead" id="service-intro-description">{content.lead}</p>
        <div className="service-intro__examples">
          <h3>이런 일이 필요할 때</h3>
          <ul>{content.examples.map((example) => <li key={example}>{example}</li>)}</ul>
        </div>
        <div className="service-intro__offerings"><h3>함께 살펴볼 서비스</h3><p>{content.offerings}</p></div>
        <p className="service-intro__next">{content.next}</p>
        <div className="service-intro__actions">
          <Link href={`/services#${active.id}`} className="btn btn--primary" onClick={() => setActive(null)}>서비스 확인하기 →</Link>
          <Link href="/pricing" className="btn btn--ghost" onClick={() => setActive(null)}>가격 확인하기</Link>
        </div>
      </>}
    </dialog>
  </>;
}
