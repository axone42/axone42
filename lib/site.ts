// 회사 기본 정보 — 사업자등록증 기준
export const site = {
  name: "에이엑스원",
  nameEn: "AXONE",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://axone.ai.kr",
  tagline: "기업의 AX(AI Transformation)를 설계하고 실행합니다",
  description:
    "에이엑스원(AXONE)은 AX 컨설팅을 중심으로 AI 자동화 운영, 홈페이지·프로그램 제작, 실무 교육까지 아우르는 AI 트랜스포메이션 파트너입니다.",
  ceo: "이원희",
  bizNumber: "624-21-01756",
  established: "2022-07-11",
  address:
    "경기도 부천시 원미구 부천로3번길 48, 7층 725호 (심곡동, 심곡동 피노키오 상가)",
  email: "axone042@gmail.com",
  categories: [
    "정보통신업 · 컴퓨터 프로그래밍 서비스업",
    "정보통신업 · 포털 및 기타 인터넷 정보 매개 서비스업",
    "정보통신업 · 홈페이지 제작",
    "전문·과학·기술서비스업 · 경영 컨설팅업",
    "전문·과학·기술서비스업 · 광고 대행업",
    "전문·과학·기술서비스업 · 시각 디자인업",
  ],
  nav: [
    { href: "/", label: "홈" },
    { href: "/services", label: "서비스" },
    { href: "/pricing", label: "가격" },
    { href: "/projects", label: "자체프로젝트" },
    { href: "/about", label: "회사소개" },
  ],
};

export const stats = [
  { num: "올인원", label: "전략·개발·운영을 한 팀이" },
  { num: "맞춤형", label: "업무에 꼭 맞는 1:1 구축" },
  { num: "AI 챗봇", label: "상태를 기억하는 기업형 챗봇" },
  { num: "사후관리", label: "구축 후 운영·개선까지 함께" },
];
