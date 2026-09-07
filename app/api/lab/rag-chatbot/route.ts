import { NextResponse } from "next/server";
import { aiText } from "@/lib/ai";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { question?: string; context?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ live: false, answer: "" }, { status: 400 });
  }

  const question = (body.question || "").slice(0, 1000);
  const context = (body.context || "").slice(0, 6000);

  if (!question.trim()) {
    return NextResponse.json({ live: false, answer: "" }, { status: 400 });
  }

  const system =
    "당신은 사내 지식 챗봇입니다. 아래 제공된 문서 발췌만 근거로 답하고, 근거가 없으면 모른다고 답하세요. 답변 끝에 사용한 근거 번호를 [1][2] 형식으로 표기하세요.";

  const prompt = `[문서 발췌]
${context}

[질문]
${question}

위 문서 발췌만 근거로 한국어로 간결하게 답변하세요. 사용한 근거 번호를 [1][2] 형식으로 표기하세요.`;

  const { text, live } = await aiText({ system, prompt, maxTokens: 700 });

  if (!live || !text.trim()) {
    return NextResponse.json({ live: false, answer: "" });
  }
  return NextResponse.json({ live: true, answer: text });
}
