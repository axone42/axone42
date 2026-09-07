import { NextResponse } from "next/server";
import { aiJSON } from "@/lib/ai";

export const dynamic = "force-dynamic";

const CHANNEL_META: Record<string, { name: string; limit: number; style: string }> = {
  linkedin: { name: "LinkedIn", limit: 3000, style: "전문적이고 인사이트 중심, 3~4개 핵심 포인트, 마지막에 부드러운 CTA, 해시태그 3~4개" },
  threads: { name: "Threads", limit: 500, style: "친근하고 후킹하는 짧은 문단, 이모지 1~2개, 해시태그 2~3개" },
  x: { name: "X(트위터)", limit: 280, style: "280자 이내로 임팩트 있게, 핵심만, 해시태그 1~2개" },
  instagram: { name: "Instagram", limit: 2200, style: "캡션형, 줄바꿈으로 가독성, 이모지 활용, 해시태그 6~8개" },
};

type Variant = { channel: string; text: string };

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    variants: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          channel: { type: "string", enum: ["linkedin", "threads", "x", "instagram"] },
          text: { type: "string" },
        },
        required: ["channel", "text"],
      },
    },
  },
  required: ["variants"],
};

export async function POST(req: Request) {
  let body: { topic?: string; tone?: string; channels?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ live: false, variants: [] }, { status: 400 });
  }

  const topic = (body.topic || "AI 자동화로 반복 업무를 없앤 경험").slice(0, 500);
  const tone = body.tone || "전문적";
  const channels = (Array.isArray(body.channels) ? body.channels : ["linkedin", "threads", "x", "instagram"]).filter(
    (c) => c in CHANNEL_META
  );

  const channelBrief = channels
    .map((c) => `- ${c} (${CHANNEL_META[c].name}, 최대 ${CHANNEL_META[c].limit}자): ${CHANNEL_META[c].style}`)
    .join("\n");

  const system =
    "당신은 한국어 개인 브랜딩·소셜 콘텐츠 전문 카피라이터입니다. " +
    "입력된 하나의 주제를 각 채널의 톤과 형식에 맞게 자연스럽고 매력적으로 리라이팅합니다. " +
    "과장·허위 없이, 실무자가 바로 발행할 수 있는 완성된 글을 작성하세요. 반드시 지정된 JSON 스키마로만 응답합니다.";

  const prompt = `주제: "${topic}"
톤앤매너: ${tone}

아래 각 채널에 맞춰 게시글을 작성하세요(각 채널 글자 수 제한 준수):
${channelBrief}

요청한 채널: ${channels.join(", ")}`;

  const { data, live } = await aiJSON<{ variants: Variant[] }>({
    system,
    prompt,
    schema: SCHEMA,
    maxTokens: 1800,
  });

  if (!live || !data?.variants?.length) {
    return NextResponse.json({ live: false, variants: [] });
  }
  return NextResponse.json({ live: true, variants: data.variants });
}
