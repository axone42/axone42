// 우리가 사용하는 프로그램/기술 스택 — 실제 브랜드 로고(simple-icons) + 일부 모노그램 대체
// slug: simple-icons export 이름(있으면 실제 로고), null이면 mark(모노그램)로 대체
export type Tool = {
  name: string;
  slug: string | null;
  color: string; // 로고/모노그램 색 (브랜드 컬러)
  mark?: string; // slug 없을 때 표시할 짧은 글자
};

export const tools: Tool[] = [
  // AI · LLM
  { name: "OpenAI", slug: null, color: "#10A37F", mark: "AI" },
  { name: "Claude", slug: "siClaude", color: "#D97757" },
  { name: "LangChain", slug: "siLangchain", color: "#1C3C3C" },
  { name: "LangGraph", slug: null, color: "#2F6F5E", mark: "LG" },
  { name: "Hugging Face", slug: "siHuggingface", color: "#FF9D00" },

  // 자동화
  { name: "n8n", slug: "siN8n", color: "#EA4B71" },

  // 언어 · 런타임
  { name: "Python", slug: "siPython", color: "#3776AB" },
  { name: "TypeScript", slug: "siTypescript", color: "#3178C6" },
  { name: "JavaScript", slug: "siJavascript", color: "#C9A800" },
  { name: "Node.js", slug: "siNodedotjs", color: "#5FA04E" },

  // 프론트엔드
  { name: "React", slug: "siReact", color: "#149ECA" },
  { name: "Next.js", slug: "siNextdotjs", color: "#14141d" },
  { name: "Tailwind CSS", slug: "siTailwindcss", color: "#06B6D4" },
  { name: "Vite", slug: "siVite", color: "#646CFF" },

  // 백엔드 · 데이터베이스
  { name: "PostgreSQL", slug: "siPostgresql", color: "#4169E1" },
  { name: "Supabase", slug: "siSupabase", color: "#3FCF8E" },
  { name: "Redis", slug: "siRedis", color: "#FF4438" },
  { name: "MongoDB", slug: "siMongodb", color: "#47A248" },
  { name: "Prisma", slug: "siPrisma", color: "#2D3748" },

  // 인프라 · 배포
  { name: "AWS", slug: null, color: "#FF9900", mark: "aws" },
  { name: "Vercel", slug: "siVercel", color: "#14141d" },
  { name: "Railway", slug: "siRailway", color: "#6b62f2" },
  { name: "Cloudflare", slug: "siCloudflare", color: "#F38020" },
  { name: "Docker", slug: "siDocker", color: "#2496ED" },
  { name: "Nginx", slug: "siNginx", color: "#009639" },

  // 개발 도구 · 협업
  { name: "GitHub", slug: "siGithub", color: "#14141d" },
  { name: "Git", slug: "siGit", color: "#F05032" },
  { name: "Cursor", slug: "siCursor", color: "#14141d" },
  { name: "VS Code", slug: null, color: "#007ACC", mark: "VS" },
  { name: "Orca", slug: null, color: "#6b62f2", mark: "Or" },
  { name: "Figma", slug: "siFigma", color: "#F24E1E" },
  { name: "Notion", slug: "siNotion", color: "#14141d" },
  { name: "Slack", slug: null, color: "#4A154B", mark: "#" },

  // 서비스 · 연동
  { name: "Stripe", slug: "siStripe", color: "#635BFF" },
  { name: "Telegram", slug: "siTelegram", color: "#26A5E4" },
  { name: "Gmail", slug: "siGmail", color: "#EA4335" },
  { name: "Google Sheets", slug: "siGooglesheets", color: "#0F9D58" },
];
