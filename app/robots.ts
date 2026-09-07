import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

// 검색·AI 검색의 공개 페이지 접근을 허용하고, 모든 그룹에 같은 제외 경로를 적용합니다.
export default function robots(): MetadataRoute.Robots {
  const base = site.url.replace(/\/$/, "");
  const allowBots = [
    "Googlebot",
    "Bingbot",
    "Yeti", // 네이버
    "GPTBot", // OpenAI 학습 크롤러. 검색용 OAI-SearchBot과 구분합니다.
    "OAI-SearchBot", // ChatGPT 검색
    "ChatGPT-User", // ChatGPT 브라우징
    "ClaudeBot", // Anthropic
    "Claude-SearchBot",
    "Claude-User",
    "PerplexityBot",
    "Google-Extended", // Gemini
    "cohere-ai",
  ];
  return {
    rules: [
      ...allowBots.map((userAgent) => ({ userAgent, allow: "/", disallow: ["/api/", "/admin"] })),
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
