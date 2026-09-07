import type { Metadata } from "next";
import LabShell from "@/components/lab/LabShell";
import Demo from "./Demo";

export const metadata: Metadata = {
  title: "RAG 사내 지식 챗봇 데모",
  description:
    "사내 문서를 벡터 색인해 근거 기반으로 답하고 답변마다 출처를 인용하는 AXONE 자체 프로젝트 데모. 인사규정·복리후생·경비 지침을 학습한 지식 챗봇을 체험해 보세요.",
  alternates: { canonical: "/lab/rag-chatbot" },
};

export default function Page() {
  return (
    <LabShell
      category="AI 앱"
      title="RAG 사내 지식 챗봇 스타터"
      en="RAG Knowledge Chatbot"
      tagline="사내 문서를 학습해 근거 기반으로 답하는 챗봇. 답변마다 출처를 인용합니다."
      stack={["LangGraph", "RAG", "Vector DB"]}
    >
      <Demo />
    </LabShell>
  );
}
