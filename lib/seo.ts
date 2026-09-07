import type { Metadata } from "next";
import { site } from "@/lib/site";

export const siteName = `${site.name}(${site.nameEn})`;
export const absoluteUrl = (path = "/") => new URL(path, `${site.url.replace(/\/$/, "")}/`).toString();

export function pageMetadata(input: { title: string; description: string; alternates: { canonical: string } }): Metadata {
  const title = `${input.title} | ${siteName}`;
  const image = { url: absoluteUrl("/opengraph-image"), width: 1200, height: 630, alt: `${siteName} AI 자동화·AX 컨설팅·개발 서비스` };
  return {
    ...input,
    title: { absolute: title },
    openGraph: { type: "website", locale: "ko_KR", siteName, title, description: input.description, url: absoluteUrl(input.alternates.canonical), images: [image] },
    twitter: { card: "summary_large_image", title, description: input.description, images: [image] },
  };
}

// 실제 콘텐츠 개편일입니다. 배포 시각으로 자동 갱신하지 않습니다.
export const SEO_UPDATED = "2026-09-07";
