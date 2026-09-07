import { NextResponse } from "next/server";
import { aiJSON } from "@/lib/ai";

export const dynamic = "force-dynamic";

type Article = { headline: string; summary: string; tag: string };
type Newsletter = { title: string; intro: string; articles: Article[] };

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    intro: { type: "string" },
    articles: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          headline: { type: "string" },
          summary: { type: "string" },
          tag: { type: "string" },
        },
        required: ["headline", "summary", "tag"],
      },
    },
  },
  required: ["title", "intro", "articles"],
};

export async function POST(req: Request) {
  let body: { topic?: string; cadence?: string; tone?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ live: false, newsletter: null }, { status: 400 });
  }

  const topic = (body.topic || "AI 업무 자동화").slice(0, 500);
  const cadence = body.cadence || "주간";
  const tone = body.tone || "전문적";

  const system =
    "당신은 한국어 뉴스레터 편집장입니다. 주어진 주제로 실제 발행 가능한 완성도 높은 뉴스레터를 만듭니다. " +
    "과장·허위 없이 실무자가 바로 읽을 수 있는 매력적인 제목과 도입부, 그리고 서로 다른 관점의 아티클 3개를 작성하세요. " +
    "각 아티클에는 짧은 태그(예: 트렌드, 실전 가이드, 사례, 인터뷰, 툴), 후킹하는 헤드라인, 2~3문장 요약이 필요합니다. " +
    "반드시 지정된 JSON 스키마로만 응답합니다.";

  const prompt = `주제·키워드: "${topic}"
발행 주기: ${cadence}
톤앤매너: ${tone}

위 조건으로 뉴스레터 한 호를 작성하세요.
- title: 이번 호를 대표하는 매력적인 한 줄 제목
- intro: 톤에 맞는 2~3문장 도입부(인사말 겸 이번 호 소개)
- articles: 서로 다른 관점의 아티클 정확히 3개 (각각 headline, summary, tag)`;

  const { data, live } = await aiJSON<Newsletter>({
    system,
    prompt,
    schema: SCHEMA,
    maxTokens: 1600,
  });

  if (!live || !data || !Array.isArray(data.articles) || data.articles.length === 0) {
    return NextResponse.json({ live: false, newsletter: null });
  }

  return NextResponse.json({
    live: true,
    newsletter: { ...data, articles: data.articles.slice(0, 3) },
  });
}
