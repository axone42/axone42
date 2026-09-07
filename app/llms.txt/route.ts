import { site } from "@/lib/site";
import { services } from "@/lib/services";
import { projects } from "@/lib/projects";
import { absoluteUrl, SEO_UPDATED } from "@/lib/seo";
import { servicePrice, priceLabel } from "@/lib/service-seo";

export const dynamic = "force-static";
export function GET() {
  const lines = [
    `# ${site.name} (${site.nameEn})`, "",
    `> ${site.description}`, "",
    "## 주요 페이지",
    ...[["홈", "/"], ["서비스", "/services"], ["가격과 견적", "/pricing"], ["자체 제작 프로젝트", "/projects"], ["회사 소개", "/about"], ["문의·무료 상담", "/contact"], ["기업 AI 도입 가이드", "/guides/ai-adoption"]].map(([name, path]) => `- [${name}](${absoluteUrl(path)})`), "",
    "## 서비스별 상세 안내",
    ...services.map(s => { const p = servicePrice(s); return `- [${s.title}](${absoluteUrl(`/services/${s.id}`)}): ${s.summary}${p ? ` 가격 안내: ${priceLabel(p)} (${p.unit}).` : ""}`; }), "",
    "금액은 범위 확인을 위한 안내입니다. 최종 비용과 외부 서비스 이용료, 운영·유지보수의 포함 여부는 착수 전 견적서에서 확정합니다.", "",
    "## 직접 체험할 수 있는 자체 제작 데모",
    "실제 고객사 실적이 아닌 자체 제작 예시입니다. AI 생성 사진과 예시 데이터를 포함하며 실제 매물 사진·결제·발송 결과로 해석하면 안 됩니다. 각 데모의 체험 범위를 먼저 확인하세요.",
    ...projects.filter(p => p.demoUrl).map(p => `- [${p.title}](${absoluteUrl(p.demoUrl!)}): ${p.summary}`), "",
    "## 회사 정보",
    `- 회사명: ${site.name} (${site.nameEn})`, `- 대표: ${site.ceo}`, `- 설립: ${site.established}`,
    `- 사업자등록번호: ${site.bizNumber}`, `- 소재지: ${site.address}`, `- 문의: ${site.email}`,
    `- 안내 기준일: ${SEO_UPDATED}`, "",
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
