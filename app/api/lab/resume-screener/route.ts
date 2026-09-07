import { NextResponse } from "next/server";
import { aiJSON } from "@/lib/ai";

export const dynamic = "force-dynamic";

type CandidateIn = {
  name?: string;
  skills?: string[];
  summary?: string;
  strengths?: string[];
  concerns?: string[];
};

type Evaluation = {
  name: string;
  total: number;
  breakdown: { 경력: number; 기술: number; 학력: number; 문화적합: number };
  summary: string;
  recommend: "추천" | "보류";
  strengths: string[];
  concerns: string[];
};

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    evaluations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          total: { type: "integer", minimum: 0, maximum: 100 },
          breakdown: {
            type: "object",
            additionalProperties: false,
            properties: {
              경력: { type: "integer", minimum: 0, maximum: 100 },
              기술: { type: "integer", minimum: 0, maximum: 100 },
              학력: { type: "integer", minimum: 0, maximum: 100 },
              문화적합: { type: "integer", minimum: 0, maximum: 100 },
            },
            required: ["경력", "기술", "학력", "문화적합"],
          },
          summary: { type: "string" },
          recommend: { type: "string", enum: ["추천", "보류"] },
          strengths: { type: "array", items: { type: "string" } },
          concerns: { type: "array", items: { type: "string" } },
        },
        required: ["name", "total", "breakdown", "summary", "recommend", "strengths", "concerns"],
      },
    },
  },
  required: ["evaluations"],
};

export async function POST(req: Request) {
  let body: { job?: string; requirements?: string; candidates?: CandidateIn[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ live: false, evaluations: [] }, { status: 400 });
  }

  const job = (body.job || "").slice(0, 200);
  const requirements = (body.requirements || "").slice(0, 1000);
  const candidates = (Array.isArray(body.candidates) ? body.candidates : []).slice(0, 12);

  if (!candidates.length) {
    return NextResponse.json({ live: false, evaluations: [] });
  }

  const candidateBrief = candidates
    .map((c, i) => {
      const skills = Array.isArray(c.skills) ? c.skills.join(", ") : "";
      const strengths = Array.isArray(c.strengths) ? c.strengths.join("; ") : "";
      const concerns = Array.isArray(c.concerns) ? c.concerns.join("; ") : "";
      return `${i + 1}. 이름: ${c.name || `지원자${i + 1}`}
   기술스택: ${skills}
   프로필 요약: ${c.summary || ""}
   강점: ${strengths}
   우려: ${concerns}`;
    })
    .join("\n\n");

  const system =
    "당신은 공정하고 편향 없는 시니어 기술 채용 담당자입니다. " +
    "주어진 채용 요건을 기준으로 각 지원자를 객관적으로 평가합니다. " +
    "경력·기술·학력·문화적합 네 가지 항목을 각각 0~100으로 채점하고, 이를 종합해 총점(0~100)을 산정합니다. " +
    "요건과의 정합성을 최우선으로 보되, 과장이나 근거 없는 추정은 하지 않습니다. " +
    "총점 80 이상이면 '추천', 그 미만이면 '보류'로 판단합니다. " +
    "요약과 강점·우려는 한국어로 간결하고 구체적으로 작성합니다. 반드시 지정된 JSON 스키마로만 응답하세요.";

  const prompt = `[모집 직무] ${job}

[채용 요건]
${requirements}

[지원자 목록]
${candidateBrief}

각 지원자를 위 요건에 비추어 평가하세요. evaluations 배열에는 위 지원자 전원(${candidates.length}명)을 동일한 이름으로 포함하고, 각 항목 점수와 총점, 추천/보류, 요약, 강점(2~3개), 우려(1~3개)를 채워주세요.`;

  const { data, live } = await aiJSON<{ evaluations: Evaluation[] }>({
    system,
    prompt,
    schema: SCHEMA,
    maxTokens: 2000,
  });

  if (!live || !data?.evaluations?.length) {
    return NextResponse.json({ live: false, evaluations: [] });
  }
  return NextResponse.json({ live: true, evaluations: data.evaluations });
}
