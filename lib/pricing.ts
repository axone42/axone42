// 조합형 견적 — 서비스별 시작가(예시). 실제 계약가는 범위·요구사항에 따라 상담으로 확정.
export type PriceGroup = "컨설팅·전략" | "개발" | "자동화·데이터" | "마케팅·디자인" | "교육";

export type PriceItem = {
  id: string;
  name: string;
  from: number; // 시작가 (KRW)
  unit: string; // 과금 단위
  note?: string;
  group: PriceGroup;
};

// 런칭 프로모션 할인율
export const PROMO_RATE = 0.2;

export const PRICE_GROUPS: PriceGroup[] = [
  "컨설팅·전략",
  "개발",
  "자동화·데이터",
  "마케팅·디자인",
  "교육",
];

export const priceItems: PriceItem[] = [
  { id: "ax-consulting", name: "AX 컨설팅 (진단 + 로드맵)", from: 3_000_000, unit: "프로젝트", group: "컨설팅·전략" },
  { id: "mvp", name: "MVP · 프로토타입 개발", from: 3_000_000, unit: "프로젝트", note: "아이디어 빠른 검증", group: "개발" },
  { id: "chatbot", name: "기업형 챗봇 제작 (LangGraph)", from: 5_000_000, unit: "프로젝트", group: "개발" },
  { id: "shopping", name: "쇼핑몰 구축", from: 4_000_000, unit: "프로젝트", group: "개발" },
  { id: "website", name: "홈페이지 구축", from: 2_000_000, unit: "프로젝트", group: "개발" },
  { id: "erp", name: "ERP / CRM 개발", from: 8_000_000, unit: "범위별", note: "규모에 따라 협의", group: "개발" },
  { id: "automation", name: "AI 자동화 구축", from: 500_000, unit: "건당", note: "+ 운영 월 30만원~", group: "자동화·데이터" },
  { id: "scraping", name: "데이터 수집 · 스크래핑", from: 1_000_000, unit: "프로젝트", group: "자동화·데이터" },
  { id: "marketing", name: "광고 · 마케팅 대행", from: 500_000, unit: "월", note: "매체비 별도", group: "마케팅·디자인" },
  { id: "design", name: "브랜드 · 시각 디자인", from: 500_000, unit: "프로젝트", note: "로고·상세페이지·브로셔", group: "마케팅·디자인" },
  { id: "lecture", name: "실무 강의 (바이브코딩·AI 자동화)", from: 300_000, unit: "회차·인원별", group: "교육" },
];

export function formatKRW(n: number): string {
  return n.toLocaleString("ko-KR");
}
