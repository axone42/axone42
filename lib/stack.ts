// 우리가 사용하는 프로그램/기술 스택 — 아이콘(브랜드 색 + 약자 모노그램)과 함께 표시
export type Tool = {
  name: string;
  mark: string; // 아이콘 타일에 표시할 짧은 글자/기호
  bg: string;
  fg?: string; // 기본 흰색
  border?: boolean; // 어두운 배경일 때 테두리
};

export const tools: Tool[] = [
  // 자동화 · AI
  { name: "n8n", mark: "n8n", bg: "#EA4B71" },
  { name: "OpenAI", mark: "AI", bg: "#10A37F" },
  { name: "Claude", mark: "C", bg: "#D97757" },
  { name: "LangGraph", mark: "LG", bg: "#1C3C3C", fg: "#4ade80" },
  { name: "Python", mark: "Py", bg: "#3776AB" },
  { name: "Whisper", mark: "W", bg: "#7C3AED" },
  // 개발 · 배포
  { name: "Next.js", mark: "N", bg: "#0a0a0a", fg: "#ffffff", border: true },
  { name: "React", mark: "R", bg: "#149ECA" },
  { name: "TypeScript", mark: "TS", bg: "#3178C6" },
  { name: "Vercel", mark: "▲", bg: "#0a0a0a", fg: "#ffffff", border: true },
  { name: "GitHub", mark: "GH", bg: "#181717", fg: "#ffffff", border: true },
  { name: "Cursor", mark: "Cu", bg: "#0a0a0a", fg: "#ffffff", border: true },
  { name: "Docker", mark: "D", bg: "#2496ED" },
  // 데이터 · 협업
  { name: "Notion", mark: "N", bg: "#ffffff", fg: "#111111" },
  { name: "Slack", mark: "S", bg: "#4A154B" },
  { name: "Gmail", mark: "M", bg: "#EA4335" },
  { name: "Google Sheets", mark: "GS", bg: "#0F9D58" },
  { name: "Supabase", mark: "SB", bg: "#1F1F1F", fg: "#3ECF8E", border: true },
  { name: "PostgreSQL", mark: "PG", bg: "#4169E1" },
  { name: "Telegram", mark: "T", bg: "#26A5E4" },
];
