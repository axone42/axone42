import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { projects } from "@/lib/projects";
import { services } from "@/lib/services";
import { SEO_UPDATED } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = site.url.replace(/\/$/, "");

  // 마케팅 핵심 페이지 (priority: 홈 > 핵심 랜딩 > 기타)
  const core: { path: string; priority: number; freq: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
    { path: "", priority: 1.0, freq: "weekly" },
    { path: "/services", priority: 0.9, freq: "monthly" },
    { path: "/pricing", priority: 0.8, freq: "monthly" },
    { path: "/projects", priority: 0.8, freq: "weekly" },
    { path: "/about", priority: 0.7, freq: "monthly" },
    { path: "/contact", priority: 0.7, freq: "monthly" },
    { path: "/privacy", priority: 0.3, freq: "yearly" },
    { path: "/terms", priority: 0.3, freq: "yearly" },
    { path: "/guides/ai-adoption", priority: 0.8, freq: "monthly" },
  ];

  // 자체 프로젝트 데모 (/lab/<id>) — 색인 가능한 쇼케이스 콘텐츠
  const demos = projects
    .filter((p) => p.demoUrl)
    .map((p) => ({ path: p.demoUrl as string, priority: 0.6, freq: "monthly" as const }));

  const servicePages = services.map(s => ({ path: `/services/${s.id}`, priority: 0.8, freq: "monthly" as const }));
  return [...core, ...servicePages, ...demos].map((r) => ({
    url: `${base}${r.path}`,
    lastModified: SEO_UPDATED,
    changeFrequency: r.freq,
    priority: r.priority,
  }));
}
