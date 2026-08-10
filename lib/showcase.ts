// ⚠️ 샘플(예시) 데이터입니다. 실제 서비스 오픈 전 실제 실적·후기로 교체하세요.

export type Metric = { value: string; label: string };

export type Evaluation = {
  quote: string;
  name: string;
  role: string;
  rating: number; // 5점 만점
};

export type CaseStudy = {
  id: string;
  client: string;
  industry: string;
  title: string;
  summary: string;
  metrics: Metric[];
  tags: string[];
  approach: string[]; // 구현 방식 (단계)
  evaluation: Evaluation; // 도입 기업 평가
};

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
  company: string;
};

export const clients: string[] = [
  "한빛커머스",
  "그린바이오",
  "에듀랩",
  "모먼트스튜디오",
  "넥스트리테일",
  "코어핀테크",
  "블룸헬스",
  "오늘의공방",
  "세움건설",
  "다온물류",
  "리프트에듀",
  "하나푸드",
  "미래로보틱스",
  "클로버뷰티",
  "온다이닝",
  "스마트팜코리아",
  "제로원소프트",
  "굿데이몰",
  "아틀리에하우스",
  "브릭테크",
];

export const caseStudies: CaseStudy[] = [
  {
    id: "hanbit",
    client: "한빛커머스",
    industry: "이커머스",
    title: "주문·CS 자동화로 운영 인력 절반",
    summary:
      "여러 채널의 주문 수집부터 CS 1차 응대까지 n8n으로 연결해 반복 업무를 자동 처리했습니다.",
    metrics: [
      { value: "-72%", label: "CS 응대 시간" },
      { value: "3배", label: "주문 처리량" },
    ],
    tags: ["n8n", "이커머스", "CS 자동화"],
    approach: [
      "여러 쇼핑몰·채널의 주문을 Webhook으로 실시간 수집",
      "주문 상태를 ERP·시트에 자동 동기화",
      "CS 1차 문의를 GPT가 분류하고 자동 응답",
      "미해결 건만 상담원에게 이관",
    ],
    evaluation: {
      quote: "엑셀로 버티던 업무가 한 번에 정리됐어요. 주문이 몰려도 시스템이 알아서 처리합니다.",
      name: "김○○",
      role: "운영팀장",
      rating: 4.9,
    },
  },
  {
    id: "greenbio",
    client: "그린바이오",
    industry: "제조",
    title: "영수증 OCR로 정산 업무 자동화",
    summary:
      "이메일로 들어오는 영수증·인보이스를 OCR로 추출해 회계 시트에 자동 입력했습니다.",
    metrics: [
      { value: "-80%", label: "입력 공수" },
      { value: "0건", label: "입력 오류" },
    ],
    tags: ["OCR", "재무", "n8n"],
    approach: [
      "이메일 첨부 영수증·인보이스를 자동 수집",
      "OCR로 금액·항목·일자를 추출",
      "GPT가 계정·항목을 정규화",
      "회계 시트에 자동 입력하고 검증",
    ],
    evaluation: {
      quote: "손으로 옮겨 적던 정산이 사라졌습니다. 입력 오류가 0에 수렴해요.",
      name: "이○○",
      role: "재무담당",
      rating: 4.8,
    },
  },
  {
    id: "edulab",
    client: "에듀랩",
    industry: "교육",
    title: "LangGraph 챗봇으로 상담 자동 응대",
    summary:
      "사내 문서 기반 RAG와 LangGraph로 상태를 유지하는 상담 챗봇을 구축했습니다.",
    metrics: [
      { value: "68%", label: "자동 응대율" },
      { value: "24/7", label: "응대 시간" },
    ],
    tags: ["LangGraph", "챗봇", "RAG"],
    approach: [
      "FAQ·규정 문서를 벡터DB로 색인",
      "LangGraph로 대화 상태·분기를 설계",
      "RAG로 근거 기반 답변을 생성",
      "미해결 문의는 상담원 이관·티켓화",
    ],
    evaluation: {
      quote: "단순 FAQ를 넘어 진짜 상담을 합니다. 상담 인력 부담이 확 줄었어요.",
      name: "박○○",
      role: "CX 매니저",
      rating: 5.0,
    },
  },
  {
    id: "moment",
    client: "모먼트스튜디오",
    industry: "뷰티",
    title: "자사몰 구축 + AI 추천으로 매출 성장",
    summary:
      "브랜드 자사몰을 구축하고 AI 상품 추천과 자동 CS를 연계해 전환율을 높였습니다.",
    metrics: [
      { value: "+41%", label: "구매 전환율" },
      { value: "2주", label: "오픈까지" },
    ],
    tags: ["쇼핑몰", "AI 추천", "자사몰"],
    approach: [
      "브랜드 콘셉트에 맞춰 자사몰을 기획·구축",
      "결제(PG)·배송·정산을 연동",
      "AI 상품 추천 엔진을 적용",
      "자동 CS 챗봇을 연계",
    ],
    evaluation: {
      quote: "오픈 2주 만에 매출이 붙었어요. 추천이 전환율을 크게 끌어올렸습니다.",
      name: "최○○",
      role: "대표",
      rating: 4.9,
    },
  },
  {
    id: "daon",
    client: "다온물류",
    industry: "물류",
    title: "배송 알림·정산 자동화로 CS 문의 급감",
    summary:
      "배송 단계별 상태 알림과 정산 마감을 자동화해 고객 문의와 수작업을 크게 줄였습니다.",
    metrics: [
      { value: "-65%", label: "배송 문의" },
      { value: "자동", label: "정산 마감" },
    ],
    tags: ["n8n", "물류", "알림"],
    approach: [
      "운송장 데이터를 실시간으로 수집",
      "배송 단계별 상태 알림을 자동 발송",
      "정산 데이터를 자동 집계·마감",
      "이상 배송은 담당자에게 즉시 알림",
    ],
    evaluation: {
      quote: "배송 문의 전화가 눈에 띄게 줄었어요. 고객이 먼저 알림을 받으니까요.",
      name: "정○○",
      role: "물류팀장",
      rating: 4.7,
    },
  },
  {
    id: "corefin",
    client: "코어핀테크",
    industry: "핀테크",
    title: "지표·리포트 자동화로 마감 시간 단축",
    summary:
      "여러 소스의 데이터를 통합·집계하고 GPT로 리포트를 자동 작성해 마감 업무를 없앴습니다.",
    metrics: [
      { value: "-58%", label: "리포트 시간" },
      { value: "실시간", label: "지표 반영" },
    ],
    tags: ["대시보드", "API연동", "GPT"],
    approach: [
      "여러 소스의 데이터를 API로 통합",
      "지표를 자동 계산하고 검증",
      "GPT가 리포트 초안을 작성",
      "대시보드·리포트를 자동 배포",
    ],
    evaluation: {
      quote: "마감 때마다 야근하던 리포트가 자동으로 나옵니다. 판단에 쓸 시간이 늘었어요.",
      name: "한○○",
      role: "전략기획",
      rating: 4.8,
    },
  },
  {
    id: "bloom",
    client: "블룸헬스",
    industry: "헬스케어",
    title: "예약·리마인더 + 챗봇으로 노쇼 감소",
    summary:
      "예약 확정·리마인더 발송과 상담 챗봇을 연계해 노쇼를 줄이고 예약 관리를 자동화했습니다.",
    metrics: [
      { value: "-47%", label: "노쇼율" },
      { value: "24/7", label: "예약 접수" },
    ],
    tags: ["챗봇", "예약", "리마인더"],
    approach: [
      "예약 폼·채널을 캘린더와 연동",
      "확정·리마인더 문자를 자동 발송",
      "상담 챗봇으로 1차 문의를 응대",
      "노쇼 예상 건은 사전 리마인드",
    ],
    evaluation: {
      quote: "노쇼가 절반으로 줄었습니다. 예약 관리에 사람이 붙지 않아도 돼요.",
      name: "서○○",
      role: "운영실장",
      rating: 4.9,
    },
  },
  {
    id: "mirae",
    client: "미래로보틱스",
    industry: "제조·B2B",
    title: "견적 문의 자동 분류·배정으로 응대 3배",
    summary:
      "쏟아지는 견적·문의 메일을 AI로 분류하고 담당 영업에 자동 배정해 응대 속도를 높였습니다.",
    metrics: [
      { value: "3배", label: "응대 속도" },
      { value: "0건", label: "문의 누락" },
    ],
    tags: ["n8n", "CRM", "GPT"],
    approach: [
      "견적·문의 메일을 자동으로 수집",
      "GPT가 제품·긴급도로 분류",
      "담당 영업에 자동 배정·알림",
      "CRM에 기록하고 팔로업 관리",
    ],
    evaluation: {
      quote: "문의가 새는 일이 없어졌고 응대가 빨라졌어요. 계약 전환율도 올랐습니다.",
      name: "오○○",
      role: "영업총괄",
      rating: 4.8,
    },
  },
];

export const testimonials: Testimonial[] = [
  {
    quote: "엑셀로 버티던 업무가 한 번에 정리됐어요. 사람이 하던 일을 시스템이 대신합니다.",
    name: "김○○",
    role: "운영팀장",
    company: "한빛커머스",
  },
  {
    quote: "컨설팅이 문서로 끝나지 않고 실제 자동화까지 이어진 게 가장 만족스러웠습니다.",
    name: "이○○",
    role: "대표",
    company: "그린바이오",
  },
  {
    quote: "챗봇이 단순 FAQ를 넘어 진짜 상담을 합니다. 상담 인력 부담이 확 줄었어요.",
    name: "박○○",
    role: "CX 매니저",
    company: "에듀랩",
  },
];
