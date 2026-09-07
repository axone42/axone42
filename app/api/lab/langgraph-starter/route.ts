import { NextResponse } from "next/server";
import { aiText } from "@/lib/ai";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { task?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ live: false, answer: "" }, { status: 400 });
  }

  const task = (body.task || "서울 날씨와 옷차림 추천").slice(0, 300);

  const system =
    "당신은 한국어로 답하는 유능한 AI 에이전트입니다. " +
    "사용자의 태스크를 이해하고, 웹검색·계산기 같은 도구를 사용할 수 있는 에이전트처럼 추론한 뒤 " +
    "간결하고 실용적인 '최종 답변'만 작성합니다. 사고 과정이나 도구 호출 로그는 출력하지 말고, " +
    "바로 사용할 수 있는 완성된 답변을 2~4문장으로 제시하세요. 과장이나 허위 없이 자연스럽게 답합니다. " +
    "실시간 데이터가 필요한 경우 합리적인 예시 값을 사용해 자연스럽게 설명하세요.";

  const prompt = `태스크: "${task}"

이 태스크에 대한 최종 답변을 작성하세요.`;

  const { text, live } = await aiText({ system, prompt, maxTokens: 400 });

  if (!live || !text.trim()) {
    return NextResponse.json({ live: false, answer: "" });
  }
  return NextResponse.json({ live: true, answer: text.trim() });
}
