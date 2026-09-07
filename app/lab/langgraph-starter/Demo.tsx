"use client";

import { useEffect, useRef, useState } from "react";

/* =========================================================
   그래프 노드 정의 (인라인 SVG 좌표계 480 x 360)
   ========================================================= */
type NodeId = "start" | "agent" | "search" | "calc" | "end";

type GraphNode = {
  id: NodeId;
  x: number;
  y: number;
  icon: string;
  label: string;
  sub: string;
  tone: "start" | "agent" | "tool" | "end";
};

const NW = 160; // 노드 너비
const NH = 54; // 노드 높이

const NODES: GraphNode[] = [
  { id: "start", x: 160, y: 14, icon: "▶", label: "START", sub: "진입점", tone: "start" },
  { id: "agent", x: 160, y: 100, icon: "🧠", label: "Agent (LLM)", sub: "추론·도구 선택", tone: "agent" },
  { id: "search", x: 20, y: 196, icon: "🔎", label: "Tool: 웹검색", sub: "web_search()", tone: "tool" },
  { id: "calc", x: 300, y: 196, icon: "🧮", label: "Tool: 계산기", sub: "calculator()", tone: "tool" },
  { id: "end", x: 160, y: 292, icon: "✅", label: "END", sub: "최종 응답", tone: "end" },
];

const TONE_COLOR: Record<GraphNode["tone"], { bg: string; border: string; ico: string }> = {
  start: { bg: "#eef7f0", border: "#bfe3ca", ico: "#1f9d57" },
  agent: { bg: "var(--color-violet-soft)", border: "rgba(107,98,242,0.5)", ico: "var(--color-dusk-violet)" },
  tool: { bg: "#eef3fd", border: "#c7dafa", ico: "#2f6bd6" },
  end: { bg: "#f4f2ff", border: "#d6cffb", ico: "#6b62f2" },
};

function nodeById(id: NodeId): GraphNode {
  return NODES.find((n) => n.id === id)!;
}

/** 노드 하단 중앙 → 노드 상단 중앙 곡선 경로 */
function curve(from: GraphNode, to: GraphNode): string {
  const x1 = from.x + NW / 2;
  const y1 = from.y + NH;
  const x2 = to.x + NW / 2;
  const y2 = to.y;
  const my = (y1 + y2) / 2;
  return `M ${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`;
}

type Edge = { from: NodeId; to: NodeId };
const EDGES: Edge[] = [
  { from: "start", to: "agent" },
  { from: "agent", to: "search" },
  { from: "agent", to: "calc" },
  { from: "search", to: "agent" },
  { from: "calc", to: "agent" },
  { from: "agent", to: "end" },
];

/* =========================================================
   트레이스(ReAct) 프리셋 — 태스크별
   ========================================================= */
type TraceKind = "thought" | "action" | "observation" | "final";

type Step = {
  node: NodeId;
  kind: TraceKind;
  title: string;
  body: string;
  tool?: string; // tool_calls 카운트 대상
};

type Task = {
  key: string;
  chip: string;
  steps: Step[];
};

const TASKS: Task[] = [
  {
    key: "weather",
    chip: "서울 날씨와 옷차림 추천",
    steps: [
      { node: "start", kind: "thought", title: "요청 수신", body: "사용자 질문: “서울 오늘 날씨와 옷차림 추천해줘”" },
      {
        node: "agent",
        kind: "thought",
        title: "Thought",
        body: "날씨는 실시간 정보라 웹검색 도구가 필요하다. web_search를 호출하자.",
      },
      {
        node: "search",
        kind: "action",
        title: "Action · web_search",
        body: 'web_search(query="서울 오늘 날씨 기온")',
        tool: "web_search",
      },
      {
        node: "agent",
        kind: "observation",
        title: "Observation",
        body: "결과: 맑음, 최고 27°C / 최저 19°C, 오후 바람 약간.",
      },
      {
        node: "end",
        kind: "final",
        title: "Final Answer",
        body: "서울은 맑고 낮 27°C입니다. 얇은 셔츠에 가벼운 가디건을 겹쳐 입으세요. 저녁엔 바람이 있어 겉옷을 챙기면 좋아요.",
      },
    ],
  },
  {
    key: "sales",
    chip: "매출 데이터 요약",
    steps: [
      { node: "start", kind: "thought", title: "요청 수신", body: "사용자 질문: “3분기 채널별 매출을 요약해줘”" },
      {
        node: "agent",
        kind: "thought",
        title: "Thought",
        body: "합계·비중 계산이 필요하다. calculator 도구로 집계하자.",
      },
      {
        node: "calc",
        kind: "action",
        title: "Action · calculator",
        body: 'calculator(expr="4820+3120+1980 // 채널 합계")',
        tool: "calculator",
      },
      {
        node: "agent",
        kind: "observation",
        title: "Observation",
        body: "결과: 총합 9,920만원 · 자사몰 48.6% / 네이버 31.4% / 쿠팡 20.0%.",
      },
      {
        node: "end",
        kind: "final",
        title: "Final Answer",
        body: "3분기 총매출 9,920만원. 자사몰이 48.6%로 최다이며, 네이버(31.4%)·쿠팡(20.0%) 순입니다. 자사몰 집중 전략이 유효합니다.",
      },
    ],
  },
  {
    key: "fx",
    chip: "환율 계산",
    steps: [
      { node: "start", kind: "thought", title: "요청 수신", body: "사용자 질문: “1,500 USD는 원화로 얼마야?”" },
      {
        node: "agent",
        kind: "thought",
        title: "Thought",
        body: "최신 환율을 먼저 조회한 뒤 곱셈이 필요하다. web_search로 환율부터 확인하자.",
      },
      {
        node: "search",
        kind: "action",
        title: "Action · web_search",
        body: 'web_search(query="USD KRW 환율 오늘")',
        tool: "web_search",
      },
      {
        node: "agent",
        kind: "observation",
        title: "Observation",
        body: "결과: 1 USD ≈ 1,378 KRW.",
      },
      {
        node: "calc",
        kind: "action",
        title: "Action · calculator",
        body: 'calculator(expr="1500 * 1378")',
        tool: "calculator",
      },
      {
        node: "end",
        kind: "final",
        title: "Final Answer",
        body: "1,500 USD는 오늘 환율(1,378원) 기준 약 2,067,000원입니다.",
      },
    ],
  },
];

const KIND_META: Record<TraceKind, { icon: string; label: string; pill: string }> = {
  thought: { icon: "🧠", label: "Thought", pill: "lx-pill--muted" },
  action: { icon: "🔧", label: "Action", pill: "lx-pill--info" },
  observation: { icon: "👁", label: "Observation", pill: "lx-pill--warn" },
  final: { icon: "✅", label: "Final Answer", pill: "lx-pill--ok" },
};

const STEP_MS = 550;

export default function Demo() {
  const [taskKey, setTaskKey] = useState<string>(TASKS[0].key);
  const [running, setRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState<number>(-1); // -1 = idle
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 실제 Claude가 생성한 최종 답변 (없으면 프리셋으로 폴백)
  const [liveAnswer, setLiveAnswer] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const fetchedKeyRef = useRef<string | null>(null); // 이번 실행에 대한 fetch 중복 방지

  const task = TASKS.find((t) => t.key === taskKey) ?? TASKS[0];
  const totalSteps = task.steps.length;

  // 현재까지 실행된(로그에 표시된) 스텝들
  const shownSteps = stepIndex >= 0 ? task.steps.slice(0, stepIndex + 1) : [];
  const activeNode: NodeId | null = stepIndex >= 0 && stepIndex < totalSteps ? task.steps[stepIndex].node : null;
  const done = stepIndex >= totalSteps - 1 && !running;

  // 상태 패널 값 (실행된 스텝 기준으로 파생 — 렌더 중 랜덤/시간 사용 안 함)
  const messagesCount = 1 + shownSteps.length; // system + 진행 스텝
  const toolCalls = shownSteps.filter((s) => s.tool).length;
  const currentNodeLabel =
    activeNode != null ? nodeById(activeNode).label : done ? "END" : "idle";

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // 스텝 진행: running 중이고 아직 마지막이 아니면 다음 스텝 예약
  useEffect(() => {
    if (!running) return;
    if (stepIndex >= totalSteps - 1) {
      setRunning(false);
      return;
    }
    timerRef.current = setTimeout(() => {
      setStepIndex((i) => i + 1);
    }, STEP_MS);
    return clearTimer;
  }, [running, stepIndex, totalSteps]);

  // 언마운트 시 타이머 정리
  useEffect(() => clearTimer, []);

  // 마지막(Final Answer) 스텝에 도달하면 실제 Claude 답변을 요청.
  // 애니메이션 트레이스는 그대로 두고 최종 답변만 실연동으로 교체.
  useEffect(() => {
    if (stepIndex < totalSteps - 1) return;
    if (fetchedKeyRef.current === task.key) return; // 이번 실행 이미 요청함
    fetchedKeyRef.current = task.key;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/lab/langgraph-starter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ task: task.chip }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (data.live && typeof data.answer === "string" && data.answer.trim()) {
          setLiveAnswer(data.answer.trim());
          setLive(true);
        } else {
          setLiveAnswer(null);
          setLive(false);
        }
      } catch {
        if (!cancelled) {
          setLiveAnswer(null);
          setLive(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [stepIndex, totalSteps, task.key, task.chip]);

  const run = () => {
    clearTimer();
    fetchedKeyRef.current = null;
    setLiveAnswer(null);
    setLive(false);
    setRunning(true);
    setStepIndex(0);
  };

  const reset = () => {
    clearTimer();
    fetchedKeyRef.current = null;
    setLiveAnswer(null);
    setLive(false);
    setRunning(false);
    setStepIndex(-1);
  };

  const pickTask = (key: string) => {
    clearTimer();
    fetchedKeyRef.current = null;
    setLiveAnswer(null);
    setLive(false);
    setRunning(false);
    setStepIndex(-1);
    setTaskKey(key);
  };

  const runState: "running" | "complete" | "idle" = running ? "running" : done ? "complete" : "idle";
  const runStateLabel = running ? "실행 중" : done ? "완료" : "대기";
  const runStatePill = running ? "lx-pill--info" : done ? "lx-pill--ok" : "lx-pill--muted";
  const progressPct = stepIndex < 0 ? 0 : Math.round(((stepIndex + 1) / totalSteps) * 100);

  return (
    <div className="lgx">
      {/* ===== 앱 툴바 ===== */}
      <div className="lx-win__bar lgx__bar">
        <div className="lgx__brand">
          <span className="lgx__brand-icon" aria-hidden>🕸️</span>
          <div className="lgx__brand-text">
            <span className="lgx__brand-title">LangGraph 에이전트</span>
            <span className="lgx__brand-sub">agent runtime · StateGraph</span>
          </div>
        </div>
        <div className="lgx__toolbar-right">
          <span className="lgx__runstate" data-state={runState}>
            <i className="lgx__dot" />
            {runStateLabel}
            {running && <span className="lgx__runstate-step">{stepIndex + 1}/{totalSteps}</span>}
          </span>
          <span className={`lx-pill ${live ? "lx-pill--ok" : "lx-pill--muted"} lgx__source`}>
            {live ? "● 실시간 AI" : "○ 샘플 생성"}
          </span>
        </div>
      </div>

      {/* ===== 명령 스트립 (태스크 + 실행) ===== */}
      <div className="lgx__cmdbar">
        <div className="lgx__cmdbar-tasks">
          <span className="lgx__cmdbar-label">태스크</span>
          <div className="lgx__chips">
            {TASKS.map((t) => (
              <button
                key={t.key}
                type="button"
                className={`lx-toggle${taskKey === t.key ? " is-on" : ""}`}
                onClick={() => pickTask(t.key)}
              >
                {t.chip}
              </button>
            ))}
          </div>
        </div>
        <div className="lgx__cmdbar-actions">
          <button type="button" className="lx-btn lx-btn--ghost" onClick={reset} disabled={running || stepIndex < 0}>
            초기화
          </button>
          <button type="button" className="lx-btn lx-btn--primary lgx__run" onClick={run} disabled={running}>
            {running ? "실행 중…" : "▶ 에이전트 실행"}
          </button>
        </div>
      </div>

      {/* 진행 바 */}
      <div className="lgx__progress">
        <span className="lgx__progress-fill" style={{ width: `${progressPct}%`, opacity: stepIndex < 0 ? 0 : 1 }} />
      </div>

      {/* ===== IDE 분할 뷰: 좌 그래프+상태 / 우 트레이스 ===== */}
      <div className="lgx__split">
          {/* LEFT: 상태 그래프 */}
          <div className="lgx__col lgx__col--graph">
            <div className="lx-h lgx__panel-h">
              <span>상태 그래프 <span className="lx-sub">StateGraph</span></span>
              <span className={`lx-pill ${runStatePill} lgx__panel-badge`}>{runStateLabel}</span>
            </div>

            <div className="lgx__graph-wrap">
              <svg
                viewBox="0 0 480 360"
                width="100%"
                role="img"
                aria-label="에이전트 상태 그래프: START → Agent → 도구(웹검색/계산기) → Agent → END"
                style={{ display: "block", maxWidth: "100%" }}
              >
                <defs>
                  <marker id="lgArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M0 0 L10 5 L0 10 z" fill="#c3c3d6" />
                  </marker>
                  <marker id="lgArrowOn" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7.5" markerHeight="7.5" orient="auto-start-reverse">
                    <path d="M0 0 L10 5 L0 10 z" fill="#6b62f2" />
                  </marker>
                </defs>

                {/* 엣지 */}
                {EDGES.map((e, i) => {
                  const from = nodeById(e.from);
                  const to = nodeById(e.to);
                  // 이 엣지가 방금 실행된 전이인지: 이전 활성노드 -> 현재 활성노드
                  const prevNode = stepIndex > 0 ? task.steps[stepIndex - 1].node : null;
                  const on =
                    activeNode != null &&
                    prevNode != null &&
                    e.from === prevNode &&
                    e.to === activeNode;
                  return (
                    <path
                      key={`${e.from}-${e.to}-${i}`}
                      d={curve(from, to)}
                      fill="none"
                      stroke={on ? "#6b62f2" : "#d6d6e4"}
                      strokeWidth={on ? 2.6 : 1.6}
                      strokeDasharray={on ? "6 5" : undefined}
                      markerEnd={on ? "url(#lgArrowOn)" : "url(#lgArrow)"}
                      style={on ? { animation: "lgdash 0.6s linear infinite" } : undefined}
                    />
                  );
                })}

                {/* 노드 */}
                {NODES.map((n) => {
                  const c = TONE_COLOR[n.tone];
                  const isActive = activeNode === n.id;
                  const wasVisited = shownSteps.some((s) => s.node === n.id);
                  return (
                    <g key={n.id} transform={`translate(${n.x} ${n.y})`}>
                      <rect
                        x={0}
                        y={0}
                        rx={12}
                        width={NW}
                        height={NH}
                        fill={c.bg}
                        stroke={isActive ? "#6b62f2" : c.border}
                        strokeWidth={isActive ? 2.4 : 1.4}
                        style={
                          isActive
                            ? { filter: "drop-shadow(0 4px 12px rgba(107,98,242,0.35))", animation: "lgpulse 1s ease-in-out infinite" }
                            : { opacity: wasVisited || activeNode == null ? 1 : 0.65, transition: "opacity .2s ease" }
                        }
                      />
                      {/* 아이콘 타일 */}
                      <rect x={10} y={12} rx={8} width={30} height={30} fill="#fff" stroke={c.border} strokeWidth={1} />
                      <text x={25} y={33} textAnchor="middle" fontSize={15}>
                        {n.icon}
                      </text>
                      {/* 라벨 */}
                      <text x={50} y={24} fontSize={12.5} fontWeight={700} fill="var(--color-ink)" style={{ fontFamily: "var(--font-geist)" }}>
                        {n.label}
                      </text>
                      <text x={50} y={40} fontSize={10.5} fill="var(--color-slate)">
                        {n.sub}
                      </text>
                    </g>
                  );
                })}

                {/* 분기 라벨 */}
                <text x={78} y={168} fontSize={10} fill="var(--color-slate)" textAnchor="middle">
                  분기: 도구 선택
                </text>
              </svg>
            </div>

            {/* 상태 패널 */}
            <div className="lgx__state">
              <div className="lgx__state-head">
                <b className="lgx__state-title">state</b>
                <span className={`lx-pill ${runStatePill}`}>
                  {running ? "running" : done ? "complete" : "idle"}
                </span>
              </div>
              <div className="lgx__state-grid">
                <div className="lgx__state-cell">
                  <span className="lgx__state-label">messages</span>
                  <span className="lgx__state-value lx-mono">{messagesCount}</span>
                </div>
                <div className="lgx__state-cell">
                  <span className="lgx__state-label">tool_calls</span>
                  <span className="lgx__state-value lx-mono">{toolCalls}</span>
                </div>
                <div className="lgx__state-cell">
                  <span className="lgx__state-label">current_node</span>
                  <span className="lgx__state-value lgx__state-value--node">{currentNodeLabel}</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: 실행 트레이스 로그 */}
          <div className="lgx__col lgx__col--trace">
            <div className="lx-h lgx__panel-h">
              <span>실행 트레이스 <span className="lx-sub">ReAct trace</span></span>
              <span className="lgx__trace-count">{shownSteps.length} steps</span>
            </div>

            <div className="lgx__trace-scroll">
              {shownSteps.length === 0 && (
                <div className="lgx__empty">
                  <span className="lgx__empty-icon" aria-hidden>🕸️</span>
                  <b>아직 실행 이력이 없습니다.</b>
                  <span className="lgx__empty-sub">“▶ 에이전트 실행”을 눌러 트레이스를 확인하세요.</span>
                </div>
              )}

              {shownSteps.map((s, i) => {
                const m = KIND_META[s.kind];
                const isLatest = i === shownSteps.length - 1;
                // 최종 답변 스텝은 실제 Claude 응답이 있으면 그 내용으로 교체
                const bodyText = s.kind === "final" && liveAnswer ? liveAnswer : s.body;
                const isLiveFinal = s.kind === "final" && !!liveAnswer;
                return (
                  <div
                    key={i}
                    className={`lgx__trace-item lgx__trace-item--${s.kind}${isLatest && running ? " is-active" : ""}`}
                    style={{ animation: "lgfade .28s ease" }}
                  >
                    <span className="lgx__trace-rail" aria-hidden />
                    <div className="lgx__trace-body">
                      <div className="lgx__trace-head">
                        <span className="lgx__trace-ico">{m.icon}</span>
                        <span className={`lx-pill ${m.pill}`}>{m.label}</span>
                        {isLiveFinal && <span className="lx-pill lx-pill--ok lgx__trace-live">실시간 AI</span>}
                        <span className="lgx__trace-node">{nodeById(s.node).label}</span>
                      </div>
                      <div className="lgx__trace-title">{s.title}</div>
                      {s.kind === "action" ? (
                        <code className="lgx__trace-code">{s.body}</code>
                      ) : (
                        <p className="lgx__trace-text">{bodyText}</p>
                      )}
                    </div>
                  </div>
                );
              })}

              {running && (
                <div className="lgx__trace-typing">
                  <span className="lx-typing">
                    <i />
                    <i />
                    <i />
                  </span>
                  <span className="lgx__trace-typing-label">
                    {activeNode != null ? `${nodeById(activeNode).label} 실행 중…` : "실행 중…"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

      {/* 로컬 스타일 (전역 CSS 미수정 — 스코프 클래스 lgx__*) */}
      <style>{`
        @keyframes lgpulse { 0%,100% { opacity: 1; } 50% { opacity: 0.82; } }
        @keyframes lgdash { to { stroke-dashoffset: -11; } }
        @keyframes lgfade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
        @keyframes lgblink { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }

        /* ===== 셸: IDE형 앱 카드 ===== */
        .lgx {
          display: flex; flex-direction: column;
          height: calc(100vh - 52px - 42px - 62px);
          min-height: 560px;
          border: 1px solid var(--color-hairline); border-radius: 16px; overflow: hidden;
          background: #fff; box-shadow: 0 18px 48px -30px rgba(20,20,50,0.35);
        }

        /* ===== 툴바 ===== */
        .lgx__bar {
          background: linear-gradient(180deg, #fff, #fbfbff);
          min-height: 54px;
        }
        .lgx__brand { display: flex; align-items: center; gap: 11px; min-width: 0; }
        .lgx__brand-icon {
          display: inline-flex; align-items: center; justify-content: center;
          width: 34px; height: 34px; border-radius: 10px; font-size: 17px;
          background: var(--color-violet-soft); border: 1px solid rgba(107,98,242,0.28);
        }
        .lgx__brand-text { display: flex; flex-direction: column; line-height: 1.15; min-width: 0; }
        .lgx__brand-title { font-family: var(--font-geist); font-weight: 800; font-size: 14.5px; color: var(--color-ink); }
        .lgx__brand-sub { font-family: var(--font-geist); font-size: 10.5px; color: var(--color-slate); letter-spacing: 0.02em; }
        .lgx__toolbar-right { display: flex; align-items: center; gap: 10px; flex: 0 0 auto; }
        .lgx__runstate {
          display: inline-flex; align-items: center; gap: 7px;
          font-family: var(--font-geist); font-size: 12px; font-weight: 700; color: var(--color-ash);
          background: var(--color-tint); border: 1px solid var(--color-hairline);
          border-radius: 20px; padding: 5px 12px;
        }
        .lgx__runstate-step { color: var(--color-slate); font-variant-numeric: tabular-nums; }
        .lgx__dot { width: 8px; height: 8px; border-radius: 50%; background: #c3c3d6; }
        .lgx__runstate[data-state="running"] { color: #2f6bd6; background: #eef3fd; border-color: #d3e2fb; }
        .lgx__runstate[data-state="running"] .lgx__dot { background: #2f6bd6; animation: lgblink 1s ease-in-out infinite; }
        .lgx__runstate[data-state="complete"] { color: #1f9d57; background: #e9f8f0; border-color: #c9ecd8; }
        .lgx__runstate[data-state="complete"] .lgx__dot { background: #1f9d57; }
        .lgx__source { font-size: 10.5px; letter-spacing: 0.02em; }

        /* ===== 명령 스트립 ===== */
        .lgx__cmdbar {
          display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
          padding: 11px 18px; background: var(--color-tint);
          border-bottom: 1px solid var(--color-hairline);
        }
        .lgx__cmdbar-tasks { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; min-width: 0; flex: 1; }
        .lgx__cmdbar-label {
          font-family: var(--font-geist); font-size: 10.5px; font-weight: 800; letter-spacing: 0.12em;
          text-transform: uppercase; color: var(--color-slate);
        }
        .lgx__chips { display: flex; gap: 7px; flex-wrap: wrap; }
        .lgx__cmdbar-actions { display: flex; gap: 9px; flex: 0 0 auto; }
        .lgx__run { box-shadow: 0 6px 16px -8px rgba(107,98,242,0.7); }

        /* ===== 진행 바 ===== */
        .lgx__progress { height: 3px; background: var(--color-tint); }
        .lgx__progress-fill {
          display: block; height: 100%;
          background: linear-gradient(90deg, #6b62f2, #8a7ff7);
          transition: width .45s cubic-bezier(.4,0,.2,1), opacity .2s ease;
        }

        /* ===== 분할 뷰 ===== */
        .lgx__split {
          flex: 1; display: grid; grid-template-columns: 1.35fr 1fr; gap: 0;
          min-height: 0; overflow: hidden;
        }
        .lgx__col { display: flex; flex-direction: column; min-height: 0; padding: 16px 18px; }
        .lgx__col--graph { border-right: 1px solid var(--color-hairline); background: #fff; overflow-y: auto; }
        .lgx__col--trace { background: #fbfbfe; min-height: 0; }

        .lgx__panel-h { margin-bottom: 12px; }
        .lgx__panel-badge { text-transform: capitalize; }
        .lgx__trace-count {
          font-family: var(--font-geist); font-size: 11px; font-weight: 700; color: var(--color-slate);
          background: #fff; border: 1px solid var(--color-hairline); border-radius: 20px; padding: 2px 9px;
        }

        /* 그래프 */
        .lgx__graph-wrap {
          width: 100%; overflow: hidden; border-radius: 12px;
          background:
            radial-gradient(circle at 1px 1px, rgba(107,98,242,0.09) 1px, transparent 0) 0 0 / 18px 18px,
            linear-gradient(180deg, #fdfdff, #f7f7fd);
          border: 1px solid var(--color-hairline); padding: 8px;
        }

        /* 상태 패널 */
        .lgx__state { margin-top: 14px; background: var(--color-tint); border: 1px solid var(--color-hairline); border-radius: 12px; padding: 14px; }
        .lgx__state-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 11px; }
        .lgx__state-title { font-family: var(--font-geist); font-size: 12px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: var(--color-ash); }
        .lgx__state-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .lgx__state-cell {
          background: #fff; border: 1px solid var(--color-hairline); border-radius: 10px;
          padding: 11px 12px; display: flex; flex-direction: column; gap: 5px;
        }
        .lgx__state-label { font-size: 10.5px; font-weight: 700; letter-spacing: 0.03em; color: var(--color-slate); font-family: var(--font-geist); }
        .lgx__state-value { font-family: var(--font-geist); font-size: 21px; font-weight: 800; color: var(--color-ink); line-height: 1.05; }
        .lgx__state-value--node { font-size: 13.5px; color: var(--color-dusk-violet); word-break: break-word; }

        /* ===== 트레이스 로그 ===== */
        .lgx__trace-scroll {
          flex: 1; min-height: 0; overflow-y: auto;
          display: flex; flex-direction: column; gap: 10px;
          padding-right: 4px;
        }
        .lgx__trace-scroll::-webkit-scrollbar { width: 8px; }
        .lgx__trace-scroll::-webkit-scrollbar-thumb { background: var(--color-hairline-strong); border-radius: 8px; }
        .lgx__trace-scroll::-webkit-scrollbar-track { background: transparent; }

        .lgx__empty {
          margin: auto; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 7px;
          color: var(--color-slate); padding: 40px 16px;
        }
        .lgx__empty-icon { font-size: 30px; opacity: 0.55; }
        .lgx__empty b { color: var(--color-ash); font-size: 13.5px; }
        .lgx__empty-sub { font-size: 12px; }

        .lgx__trace-item {
          position: relative; display: flex; gap: 12px;
          background: #fff; border: 1px solid var(--color-hairline); border-radius: 12px;
          padding: 13px 15px 13px 13px;
          box-shadow: 0 1px 2px rgba(20,20,50,0.03);
          transition: border-color .18s ease, box-shadow .18s ease;
        }
        .lgx__trace-item.is-active {
          border-color: rgba(107,98,242,0.55);
          box-shadow: 0 6px 18px -10px rgba(107,98,242,0.55);
        }
        .lgx__trace-rail { flex: 0 0 3px; width: 3px; border-radius: 3px; background: var(--color-hairline-strong); }
        .lgx__trace-item--thought .lgx__trace-rail { background: #c3c3d6; }
        .lgx__trace-item--action .lgx__trace-rail { background: #2f6bd6; }
        .lgx__trace-item--observation .lgx__trace-rail { background: #c98a12; }
        .lgx__trace-item--final .lgx__trace-rail { background: #1f9d57; }
        .lgx__trace-body { min-width: 0; flex: 1; }
        .lgx__trace-head { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
        .lgx__trace-ico { font-size: 15px; }
        .lgx__trace-live { font-size: 10px; }
        .lgx__trace-node { margin-left: auto; font-size: 11px; color: var(--color-slate); font-family: var(--font-geist); }
        .lgx__trace-title { font-size: 12.5px; font-weight: 700; color: var(--color-ink); margin-bottom: 4px; font-family: var(--font-geist); }
        .lgx__trace-text { margin: 0; font-size: 13px; line-height: 1.6; color: var(--color-ash); }
        .lgx__trace-item--final .lgx__trace-text { color: var(--color-ink); }
        .lgx__trace-code {
          display: block; font-family: var(--font-geist); font-size: 12px; color: #2f6bd6;
          background: #eef3fd; border: 1px solid #dbe6fb; border-radius: 8px;
          padding: 9px 11px; white-space: pre-wrap; word-break: break-word;
        }
        .lgx__trace-typing {
          display: flex; align-items: center; gap: 10px;
          background: var(--color-violet-soft); border: 1px solid rgba(107,98,242,0.28);
          border-radius: 12px; padding: 12px 15px;
        }
        .lgx__trace-typing-label { font-size: 12.5px; color: var(--color-dusk-violet); font-weight: 600; }

        /* ===== 반응형 ===== */
        @media (max-width: 900px) {
          .lgx { height: auto; }
          .lgx__split { grid-template-columns: 1fr; }
          .lgx__col--graph { border-right: none; border-bottom: 1px solid var(--color-hairline); }
          .lgx__trace-scroll { max-height: 460px; }
        }
        @media (max-width: 520px) {
          .lgx__cmdbar-actions { width: 100%; }
          .lgx__cmdbar-actions .lx-btn { flex: 1; }
          .lgx__state-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
