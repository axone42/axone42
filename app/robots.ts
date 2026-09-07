import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

// GEO 핵심: 검색·AI 봇을 명시적으로 허용해야 인용 대상이 된다.
export default function robots(): MetadataRoute.Robots {
  const base = site.url.replace(/\/$/, "");
  const allowBots = [
    "Googlebot",
    "Bingbot",
    "Yeti", // 네이버
    "GPTBot", // OpenAI 학습/검색
    "OAI-SearchBot", // ChatGPT 검색
    "ChatGPT-User", // ChatGPT 브라우징
    "ClaudeBot", // Anthropic
    "Claude-Web",
    "PerplexityBot",
    "Google-Extended", // Gemini
    "cohere-ai",
  ];
  return {
    rules: [
      ...allowBots.map((userAgent) => ({ userAgent, allow: "/" })),
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin", "/_next/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
