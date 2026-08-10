// 자체 프로젝트 — 공개 예정 로드맵
// GitHub에서 꾸준히 인기 있는 주식·금융 / 자동화 / AI 앱 카테고리 기준으로 선정한 예정 리스트입니다.

export type ProjectStatus = "예정" | "진행 중" | "공개";

export const PROJECT_CATEGORIES = ["주식·금융", "자동화", "AI 앱"] as const;
export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

export type Project = {
  id: string;
  title: string;
  en: string;
  category: ProjectCategory;
  status: ProjectStatus;
  recommended?: boolean;
  summary: string;
  highlights: string[];
  stack: string[];
};

export const projects: Project[] = [
  // ── 주식·금융 ─────────────────────────────
  {
    id: "stock-dashboard",
    title: "실시간 주식 대시보드",
    en: "Real-time Stock Dashboard",
    category: "주식·금융",
    status: "예정",
    recommended: true,
    summary: "관심 종목의 시세·차트·재무·뉴스를 한 화면에서 보는 다크 대시보드.",
    highlights: [
      "관심종목 워치리스트",
      "실시간 시세·캔들 차트",
      "종목 뉴스·공시 피드",
      "포트폴리오 손익 요약",
    ],
    stack: ["Next.js", "WebSocket", "Chart", "증권 API"],
  },
  {
    id: "stock-sentiment",
    title: "AI 주식 뉴스 감성분석",
    en: "Stock News Sentiment AI",
    category: "주식·금융",
    status: "예정",
    recommended: true,
    summary: "종목별 뉴스를 수집해 GPT로 긍·부정을 분석하고 시그널을 요약합니다.",
    highlights: [
      "종목별 뉴스 자동 수집",
      "감성 점수화·키워드 추출",
      "매일 아침 브리핑 발송",
      "이상 급등락 알림",
    ],
    stack: ["Python", "GPT", "n8n", "크롤링"],
  },
  {
    id: "backtester",
    title: "전략 백테스팅 엔진",
    en: "Trading Strategy Backtester",
    category: "주식·금융",
    status: "예정",
    summary: "매매 전략을 과거 데이터로 시뮬레이션하고 성과를 검증합니다.",
    highlights: [
      "전략 규칙 정의",
      "수익률·MDD·샤프 지표",
      "리포트 시각화",
      "파라미터 최적화",
    ],
    stack: ["Python", "pandas", "backtest"],
  },
  {
    id: "dividend-tracker",
    title: "배당 포트폴리오 트래커",
    en: "Dividend Portfolio Tracker",
    category: "주식·금융",
    status: "예정",
    summary: "보유 종목의 배당 일정·수익률·현금흐름을 자동으로 추적합니다.",
    highlights: ["배당 캘린더", "예상 배당금 계산", "포트폴리오 비중 분석"],
    stack: ["Next.js", "DB", "증권 API"],
  },
  {
    id: "price-alert-bot",
    title: "코인·환율 알림 봇",
    en: "Crypto & FX Alert Bot",
    category: "주식·금융",
    status: "예정",
    summary: "가격 임계치·변동률에 도달하면 텔레그램·카톡으로 즉시 알립니다.",
    highlights: ["임계치 알림", "급변동 감지", "다중 채널 발송"],
    stack: ["n8n", "Telegram", "시세 API"],
  },

  // ── 자동화 ─────────────────────────────
  {
    id: "n8n-templates",
    title: "n8n 워크플로우 템플릿 갤러리",
    en: "n8n Workflow Template Gallery",
    category: "자동화",
    status: "예정",
    recommended: true,
    summary: "바로 가져다 쓰는 실무 자동화 레시피 모음. 원클릭 임포트로 시작합니다.",
    highlights: [
      "카테고리별 템플릿",
      "원클릭 JSON 임포트",
      "설명·데모 영상",
      "커뮤니티 기여",
    ],
    stack: ["n8n", "JSON 템플릿"],
  },
  {
    id: "ai-newsletter",
    title: "AI 뉴스레터 자동 생성기",
    en: "AI Newsletter Generator",
    category: "자동화",
    status: "예정",
    summary: "주제 소재 수집 → GPT 초안 → 검수 → 발송까지 한 번에 자동화합니다.",
    highlights: ["소재 자동 수집", "GPT 초안 작성", "구독자 발송·성과 집계"],
    stack: ["n8n", "GPT", "Email"],
  },
  {
    id: "price-monitor",
    title: "가격·재고 모니터링 스크래퍼",
    en: "Price & Stock Monitor",
    category: "자동화",
    status: "예정",
    summary: "경쟁사·쇼핑몰의 가격·재고 변동을 감지해 알림을 보냅니다.",
    highlights: ["주기적 스크래핑", "변동 감지 알림", "히스토리 기록"],
    stack: ["Python", "스크래핑", "n8n"],
  },
  {
    id: "ocr-extractor",
    title: "영수증·인보이스 OCR 추출기",
    en: "Receipt/Invoice OCR",
    category: "자동화",
    status: "예정",
    summary: "문서 이미지에서 항목을 추출해 시트·ERP로 자동 입력합니다.",
    highlights: ["OCR 항목 추출", "GPT 정규화", "시트/ERP 연동"],
    stack: ["OCR", "GPT", "Sheets"],
  },

  // ── AI 앱 ─────────────────────────────
  {
    id: "rag-chatbot",
    title: "RAG 사내 지식 챗봇 스타터",
    en: "RAG Knowledge Chatbot",
    category: "AI 앱",
    status: "예정",
    recommended: true,
    summary: "사내 문서를 학습해 근거 기반으로 답하는 챗봇 오픈 템플릿.",
    highlights: [
      "문서 벡터 색인",
      "근거 인용 응답",
      "LangGraph 상태 관리",
      "상담원 이관",
    ],
    stack: ["LangGraph", "RAG", "Vector DB"],
  },
  {
    id: "resume-screener",
    title: "AI 이력서 스크리너",
    en: "AI Resume Screener",
    category: "AI 앱",
    status: "예정",
    summary: "채용 공고 기준으로 지원서를 평가·스코어링해 순위를 매깁니다.",
    highlights: ["요건 기반 평가", "점수·순위화", "요약 카드"],
    stack: ["GPT", "Next.js"],
  },
  {
    id: "langgraph-starter",
    title: "LangGraph 에이전트 스타터킷",
    en: "LangGraph Agent Starter",
    category: "AI 앱",
    status: "예정",
    summary: "도구 호출·상태 관리가 되는 에이전트 뼈대를 빠르게 시작하는 킷.",
    highlights: ["그래프 상태 관리", "도구·API 호출", "예제 에이전트"],
    stack: ["LangGraph", "Python"],
  },
];
