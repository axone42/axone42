import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import LabShell from "@/components/lab/LabShell";
import Demo from "./Demo";

export const metadata: Metadata = pageMetadata({
  title: "LangGraph 에이전트 스타터킷 데모",
  description:
    "도구 호출과 상태 관리가 되는 에이전트 뼈대를 시각화합니다. 상태 그래프와 ReAct 실행 트레이스를 눈으로 확인하는 AXONE 자체 프로젝트 데모.",
  alternates: { canonical: "/lab/langgraph-starter" },
});

export default function Page() {
  return (
    <LabShell
      path="/lab/langgraph-starter"
      category="AI 앱"
      title="LangGraph 에이전트 스타터킷"
      en="LangGraph Agent Starter"
      tagline="도구 호출·상태 관리가 되는 에이전트 뼈대를 빠르게 시작하는 킷. 실행 과정을 눈으로 봅니다."
      stack={["LangGraph", "Python"]}
    >
      <Demo />
    </LabShell>
  );
}
