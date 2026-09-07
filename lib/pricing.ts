export type PriceGroup = "컨설팅·전략" | "개발" | "자동화·데이터" | "마케팅·디자인" | "교육";
export type PriceItem = { id: string; name: string; from: number; unit: string; group: PriceGroup; exact?: boolean; billing?: "monthly"; monthlyFrom?: number; note?: string; scope: string; confirm: string };
export const PRICE_GROUPS: PriceGroup[] = ["컨설팅·전략", "개발", "자동화·데이터", "마케팅·디자인", "교육"];
export const priceItems: PriceItem[] = [
  { id: "ax-consulting", name: "AX 컨설팅 (진단 + 로드맵)", from: 5_000_000, unit: "프로젝트", group: "컨설팅·전략", exact: true, scope: "업무 진단·도입 우선순위·실행 로드맵", confirm: "인터뷰 대상, 조사 기간, 보고서 범위와 실행 지원 여부" },
  { id: "mvp", name: "MVP · 프로토타입 개발", from: 6_000_000, unit: "프로젝트", group: "개발", scope: "핵심 기능 정의·프로토타입 개발·배포", confirm: "핵심 기능 수, 연동 범위, 검증 일정" },
  { id: "chatbot", name: "기업형 챗봇 제작", from: 8_000_000, unit: "프로젝트", group: "개발", scope: "사내 문서 답변·대화 흐름·상담원 연결 설계", confirm: "문서량, 외부 시스템 연동, 이용량과 운영 범위" },
  { id: "shopping", name: "쇼핑몰 구축", from: 10_000_000, unit: "프로젝트", group: "개발", scope: "상품·주문 관리·결제·배송 연동", confirm: "솔루션 선택, 상품·화면 수, 디자인과 연동 범위" },
  { id: "website", name: "홈페이지 구축", from: 3_500_000, unit: "프로젝트", group: "개발", scope: "반응형 디자인·페이지 개발·문의 폼", confirm: "페이지 수, 관리자 기능, 수정 횟수와 유지보수" },
  { id: "erp", name: "ERP / CRM 개발", from: 15_000_000, unit: "프로젝트", group: "개발", scope: "업무 분석·관리 화면·권한·데이터 연동", confirm: "업무 모듈, 데이터 이관, 사용자 수와 운영 범위" },
  { id: "automation", name: "AI 자동화 구축", from: 1_500_000, unit: "건당", group: "자동화·데이터", exact: true, monthlyFrom: 200_000, note: "운영 월 20만원 별도", scope: "업무 흐름 설계·자동화 구축·운영", confirm: "1건의 업무 범위, 연동 도구 수, 처리량, 장애 대응과 수정 범위" },
  { id: "scraping", name: "데이터 수집 · 스크래핑", from: 2_500_000, unit: "프로젝트", group: "자동화·데이터", scope: "데이터 수집·정제·시트 또는 DB 적재", confirm: "수집 대상, 항목 수, 갱신 주기와 유지보수" },
  { id: "marketing", name: "광고 · 마케팅 대행", from: 1_500_000, unit: "월", group: "마케팅·디자인", billing: "monthly", exact: true, note: "광고 매체비 별도", scope: "광고 기획·운영·성과 리포트", confirm: "채널 수, 소재 제작량, 계약 기간과 매체 예산" },
  { id: "design", name: "브랜드 · 시각 디자인", from: 1_500_000, unit: "프로젝트", group: "마케팅·디자인", exact: true, scope: "로고·상세페이지·브로셔 등 선택 제작", confirm: "제작물 종류·수량, 시안과 수정 횟수, 원본 제공 범위" },
  { id: "lecture", name: "실무 강의 (바이브코딩·AI 자동화)", from: 1_000_000, unit: "4회차 기준", group: "교육", exact: true, note: "참여 인원에 따라 견적 확정", scope: "도구 세팅·업무 실습·결과물 완성", confirm: "기업 단체·개인 수강 구분, 인원, 회차당 시간과 실습 도구 비용" },
];
export function formatKRW(n: number): string { return n.toLocaleString("ko-KR"); }
export function selectedItems(ids: readonly string[]): PriceItem[] { return priceItems.filter((p) => ids.includes(p.id)); }
export function estimateItems(ids: readonly string[]) {
  const items = selectedItems(ids);
  const initialItems = items.filter((p) => p.billing !== "monthly");
  return {
    items, initial: initialItems.reduce((s,p) => s+p.from, 0),
    monthly: items.reduce((s,p) => s+(p.billing === "monthly" ? p.from : 0)+(p.monthlyFrom ?? 0),0),
    hasInitial: initialItems.length > 0, initialVariable: initialItems.some((p) => !p.exact),
    hasMonthly: items.some((p) => p.billing === "monthly" || p.monthlyFrom),
    monthlyVariable: items.some((p) => p.billing === "monthly" && !p.exact),
  };
}
export function estimateText(ids: readonly string[]): string {
  const e = estimateItems(ids);
  return [e.hasInitial && `초기 비용 ${formatKRW(e.initial)}원${e.initialVariable ? "부터" : " (기준 금액)"}`,
    e.hasMonthly && `월 운영·대행료 ${formatKRW(e.monthly)}원${e.monthlyVariable ? "부터" : " (기준 금액)"}`].filter(Boolean).join(" / ");
}
export const serviceIntents: Record<string, {item: string; title: string}> = {
  "ai-automation": {item:"automation",title:"AI 자동화 운영서비스"},
  "ax-consulting": {item:"ax-consulting",title:"AX 컨설팅"},
  "shopping-mall": {item:"shopping",title:"쇼핑몰 구축"},
  chatbot: {item:"chatbot",title:"챗봇 개발"},
  "erp-crm": {item:"erp",title:"ERP / CRM 개발"},
  website: {item:"website",title:"홈페이지 구축"},
  mvp: {item:"mvp",title:"MVP · 프로토타입 개발"},
  scraping: {item:"scraping",title:"데이터 수집 · 스크래핑"},
  marketing: {item:"marketing",title:"광고 · 마케팅 대행"},
  design: {item:"design",title:"브랜드 · 시각 디자인"},
  "vibe-coding": {item:"lecture",title:"바이브코딩 강의"},
  "ai-automation-course": {item:"lecture",title:"AI 자동화 강의"},
};
export function contactForService(id: string): string {
  const intent = serviceIntents[id];
  return intent ? `/contact?items=${intent.item}&service=${encodeURIComponent(id)}` : "/contact";
}
export function resolveIntent(params: URLSearchParams) {
  const source = params.get("service") ?? "";
  const intent = serviceIntents[source] ?? Object.values(serviceIntents).find((s) => s.title === source);
  const ids = params.has("items") ? selectedItems((params.get("items") ?? "").split(",")).map((p) => p.id) : intent ? [intent.item] : [];
  return { ids, topic: intent && ids.includes(intent.item) ? intent.title : "" };
}
