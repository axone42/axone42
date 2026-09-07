import { NextResponse } from "next/server";
import { aiJSON } from "@/lib/ai";

export const dynamic = "force-dynamic";

type TemplateKey = "official" | "proposal" | "weekly";

const DOC_META: Record<
  TemplateKey,
  { name: string; role: string; b1: string; b2: string; b3: string }
> = {
  official: {
    name: "공문",
    role: "행정 공문",
    b1: "요청 취지 (당 팀/기관이 이 공문을 발송하는 배경과 목적)",
    b2: "요청 사항 (수신처가 이행해야 할 구체적 조치와 기한)",
    b3: "기대 효과 (협조 시 기대되는 성과)",
  },
  proposal: {
    name: "사업 제안서",
    role: "B2B 사업 제안서",
    b1: "제안 배경 (고객사 현황 진단과 문제 정의)",
    b2: "제안 내용 (해결 방안과 핵심 기능·프로세스)",
    b3: "기대 성과 · 비용 (정량 성과와 단계별 구축·비용 개요)",
  },
  weekly: {
    name: "주간 보고서",
    role: "부서 주간 업무 보고",
    b1: "금주 실적 ([완료]로 시작, 정량 지표 포함)",
    b2: "차주 계획 ([예정]으로 시작, 다음 주 착수 항목)",
    b3: "특이사항 ([특이사항]으로 시작, 리스크와 대응)",
  },
};

const DOC_KEY_BY_NAME: Record<string, TemplateKey> = {
  공문: "official",
  "사업 제안서": "proposal",
  제안서: "proposal",
  주간보고서: "weekly",
  "주간 보고서": "weekly",
};

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    body: {
      type: "object",
      additionalProperties: false,
      properties: {
        title: { type: "string" },
        body1: { type: "string" },
        body2: { type: "string" },
        body3: { type: "string" },
      },
      required: ["body1", "body2", "body3"],
    },
  },
  required: ["body"],
};

type Draft = { body: { title?: string; body1: string; body2: string; body3: string } };

export async function POST(req: Request) {
  let raw: { docType?: string; fields?: Record<string, unknown> };
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ live: false, draft: null }, { status: 400 });
  }

  const docType = (raw.docType || "공문").trim();
  const key: TemplateKey = DOC_KEY_BY_NAME[docType] || "official";
  const meta = DOC_META[key];
  const fields = raw.fields && typeof raw.fields === "object" ? raw.fields : {};

  const str = (k: string) => {
    const v = (fields as Record<string, unknown>)[k];
    return typeof v === "string" ? v : "";
  };

  const context = [
    `제목: ${str("title") || "(미입력)"}`,
    `수신: ${str("receiver") || "(미입력)"}`,
    `발신/부서: ${str("sender") || "(미입력)"}`,
    `문서번호: ${str("docNo") || "(미입력)"}`,
    `작성일: ${str("date") || "(미입력)"}`,
    `작성자/담당: ${str("writer") || "(미입력)"}`,
  ].join("\n");

  const system =
    "당신은 대한민국 공공·기업 문서를 작성하는 전문 문서작성자입니다. " +
    `요청된 문서 종류는 '${meta.name}'(${meta.role})입니다. ` +
    "한국어 공문서의 격식과 어투(하십시오체, 간결·명료한 행정 문체)를 지키며, " +
    "과장이나 허위 없이 실무에서 바로 사용할 수 있는 완성된 본문을 작성하세요. " +
    "각 본문 항목은 1~3문장으로 구체적으로 작성하고, 반드시 지정된 JSON 스키마로만 응답합니다.";

  const prompt = `아래 문서 정보를 바탕으로 '${meta.name}'의 본문 3개 항목을 작성하세요.

[문서 정보]
${context}

[작성할 본문 항목]
1. ${meta.b1}
2. ${meta.b2}
3. ${meta.b3}

각 항목을 body1, body2, body3에 담아 반환하세요. 필요하면 다듬은 제목을 title에 함께 제안할 수 있습니다.`;

  const { data, live } = await aiJSON<Draft>({
    system,
    prompt,
    schema: SCHEMA,
    maxTokens: 1400,
  });

  if (!live || !data?.body?.body1) {
    return NextResponse.json({ live: false, draft: null });
  }

  return NextResponse.json({ live: true, draft: data.body });
}
