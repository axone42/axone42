// Claude(Anthropic) 연동 서버 헬퍼. 서버 전용.
// ANTHROPIC_API_KEY가 있으면 실제 Claude를 호출하고, 없으면 live=false를 반환해
// 각 데모가 고품질 시뮬레이션(로컬 템플릿)으로 우아하게 폴백하도록 합니다.
// 키를 .env.local에 넣는 즉시 모든 AI 데모가 실연동으로 전환됩니다.
//
//   .env.local 예시:
//     ANTHROPIC_API_KEY=sk-ant-...
//     AI_MODEL=claude-opus-4-8   # (선택) 비용 절감 시 claude-haiku-4-5 등으로 교체 가능

import Anthropic from "@anthropic-ai/sdk";

export const AI_MODEL = process.env.AI_MODEL || "claude-opus-4-8";

export function hasAI(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

let _client: Anthropic | null = null;
export function getAnthropic(): Anthropic {
  if (!_client) _client = new Anthropic(); // ANTHROPIC_API_KEY를 환경에서 읽음
  return _client;
}

function textOf(content: Anthropic.ContentBlock[]): string {
  return content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

/** 단발 텍스트 생성. 키 없거나 실패 시 { text:"", live:false }. */
export async function aiText(opts: {
  system: string;
  prompt: string;
  maxTokens?: number;
}): Promise<{ text: string; live: boolean }> {
  if (!hasAI()) return { text: "", live: false };
  try {
    const res = await getAnthropic().messages.create({
      model: AI_MODEL,
      max_tokens: opts.maxTokens ?? 1200,
      system: opts.system,
      messages: [{ role: "user", content: opts.prompt }],
    });
    return { text: textOf(res.content), live: true };
  } catch {
    return { text: "", live: false };
  }
}

/** 구조화 JSON 생성 (output_config.format). 키 없거나 실패 시 { data:null, live:false }. */
export async function aiJSON<T>(opts: {
  system: string;
  prompt: string;
  schema: Record<string, unknown>;
  maxTokens?: number;
}): Promise<{ data: T | null; live: boolean }> {
  if (!hasAI()) return { data: null, live: false };
  try {
    const res = await getAnthropic().messages.create({
      model: AI_MODEL,
      max_tokens: opts.maxTokens ?? 1600,
      system: opts.system,
      messages: [{ role: "user", content: opts.prompt }],
      // output_config는 구조화 출력용 정식 파라미터(스킬 기준). 타입 정의 버전차 대비 캐스팅.
      ...( { output_config: { format: { type: "json_schema", schema: opts.schema } } } as object),
    } as Anthropic.MessageCreateParamsNonStreaming);
    const text = textOf(res.content).trim();
    return { data: JSON.parse(text) as T, live: true };
  } catch {
    return { data: null, live: false };
  }
}
