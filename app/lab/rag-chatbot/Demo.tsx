"use client";

import { useEffect, useRef, useState } from "react";

/* =========================================================
   지식베이스(색인 문서) — 데모용 고정 데이터
   ========================================================= */
type SourceKey = "hr" | "welfare" | "travel";

type KbSource = {
  key: SourceKey;
  file: string;
  icon: string;
  chunks: number;
  desc: string;
};

const SOURCES: KbSource[] = [
  { key: "hr", file: "인사규정.pdf", icon: "📄", chunks: 128, desc: "근태·연차·휴가·복무 규정" },
  { key: "welfare", file: "복리후생_안내.docx", icon: "📘", chunks: 74, desc: "재택근무·경조사·복지 포인트" },
  { key: "travel", file: "출장·경비_지침.pdf", icon: "📑", chunks: 96, desc: "출장 신청·경비 정산 기준" },
];

/* 인용 근거 문단(스니펫) — citationId -> passage */
type Passage = {
  id: number;
  source: SourceKey;
  loc: string;
  text: string;
};

const PASSAGES: Record<number, Passage> = {
  1: {
    id: 1,
    source: "hr",
    loc: "인사규정.pdf · 제32조(연차유급휴가)",
    text: "입사 1년 이상 근속한 직원에게는 연 15일의 연차유급휴가를 부여하며, 3년 이상 근속 시 2년마다 1일씩 가산하여 최대 25일까지 부여한다.",
  },
  2: {
    id: 2,
    source: "hr",
    loc: "인사규정.pdf · 제33조(연차 사용)",
    text: "연차는 사용 희망일 3일 전까지 신청하며, 미사용 연차는 연차수당으로 정산하거나 다음 회계연도로 이월할 수 있다.",
  },
  3: {
    id: 3,
    source: "welfare",
    loc: "복리후생_안내.docx · 3. 유연근무제",
    text: "전 직원은 주 최대 3일까지 재택근무가 가능하며, 재택 시 코어타임(10:00~16:00) 온라인 상태를 유지해야 한다. 재택 신청은 전일 오후 6시까지 팀 리더 승인으로 확정된다.",
  },
  4: {
    id: 4,
    source: "welfare",
    loc: "복리후생_안내.docx · 3.2 근무 장소",
    text: "재택근무 장소는 업무에 집중 가능한 환경이어야 하며, 보안 규정상 공용 와이파이 사용 시 사내 VPN 접속이 필수이다.",
  },
  5: {
    id: 5,
    source: "travel",
    loc: "출장·경비_지침.pdf · 제12조(경비 정산)",
    text: "출장 경비는 복귀 후 5영업일 이내에 경비 시스템에 영수증을 첨부하여 신청하며, 팀장 승인 후 익월 급여일에 지급된다.",
  },
  6: {
    id: 6,
    source: "travel",
    loc: "출장·경비_지침.pdf · 제9조(일비·숙박비)",
    text: "국내 출장 일비는 1일 30,000원, 숙박비는 실비(1박 12만원 한도)로 정산하며, 대중교통·KTX는 실비 전액을 지원한다.",
  },
};

/* =========================================================
   질문 -> 답변(인용 포함) 매핑
   ========================================================= */
type Answer = { text: string; cites: number[] };

const SUGGESTED = ["연차는 며칠인가요?", "재택근무 규정 알려줘", "출장비 정산 방법"] as const;

/* 질문과 키워드 매칭으로 관련 발췌 선별 (없으면 전체 사용) */
const PASSAGE_KEYWORDS: Record<number, string[]> = {
  1: ["연차", "휴가", "근속"],
  2: ["연차", "휴가", "이월", "수당"],
  3: ["재택", "원격", "근무", "유연"],
  4: ["재택", "근무", "장소", "vpn", "보안", "와이파이"],
  5: ["출장", "경비", "정산", "영수증"],
  6: ["출장", "일비", "숙박", "교통", "ktx"],
};

function relevantPassages(qRaw: string): Passage[] {
  const q = qRaw.toLowerCase();
  const hits = Object.values(PASSAGES).filter((p) =>
    (PASSAGE_KEYWORDS[p.id] || []).some((k) => q.includes(k.toLowerCase()))
  );
  return hits.length ? hits : Object.values(PASSAGES);
}

/* 선별된 발췌를 번호가 매겨진 컨텍스트 문자열로 직렬화 */
function buildContext(passages: Passage[]): string {
  return passages.map((p) => `[${p.id}] (${p.loc}) ${p.text}`).join("\n");
}

/* 실시간 답변에서 인용 번호 추출 (없으면 발췌 id로 폴백) */
function extractCites(text: string, fallback: number[]): number[] {
  const found = Array.from(text.matchAll(/\[(\d+)\]/g))
    .map((m) => Number(m[1]))
    .filter((n) => n in PASSAGES);
  const uniq = Array.from(new Set(found));
  return uniq.length ? uniq : fallback;
}

function answerFor(qRaw: string): Answer {
  const q = qRaw.toLowerCase();
  if (q.includes("연차") || q.includes("휴가")) {
    return {
      text:
        "1년 이상 근속 시 연 15일의 연차유급휴가가 부여됩니다 [1]. 3년 이상 근속하면 2년마다 1일씩 가산되어 최대 25일까지 늘어나며, 미사용 연차는 수당 정산 또는 이월이 가능합니다 [2].",
      cites: [1, 2],
    };
  }
  if (q.includes("재택") || q.includes("원격") || q.includes("근무")) {
    return {
      text:
        "주 최대 3일까지 재택근무가 가능하며, 코어타임(10:00~16:00)에는 온라인 상태를 유지해야 합니다 [3]. 재택 신청은 전일 오후 6시까지 팀 리더 승인으로 확정되고, 공용 와이파이 사용 시 사내 VPN 접속이 필수입니다 [4].",
      cites: [3, 4],
    };
  }
  if (q.includes("출장") || q.includes("경비") || q.includes("정산")) {
    return {
      text:
        "출장 경비는 복귀 후 5영업일 이내에 영수증을 첨부해 신청하고, 팀장 승인 후 익월 급여일에 지급됩니다 [5]. 국내 출장 일비는 1일 3만원, 숙박비는 1박 12만원 한도의 실비로 정산됩니다 [6].",
      cites: [5, 6],
    };
  }
  // 자유 입력 폴백
  return {
    text:
      "관련 문서를 찾았습니다. 사내 규정에 따르면 해당 사항은 담당 부서 승인 절차를 거쳐 처리되며, 자세한 기준은 인용된 문단을 참고해 주세요 [1].",
    cites: [1],
  };
}

/* =========================================================
   메시지 모델
   ========================================================= */
type Msg =
  | { id: number; role: "bot"; text: string; cites: number[] }
  | { id: number; role: "user"; text: string; cites?: undefined }
  | { id: number; role: "typing" };

const GREETING: Msg = {
  id: 0,
  role: "bot",
  text:
    "안녕하세요, AXONE 지식봇입니다. 사내 문서를 학습해 근거와 함께 답변드립니다. 아래 추천 질문을 눌러보거나 궁금한 점을 입력해 주세요.",
  cites: [],
};

/* 색상 토큰 (인라인 버블용) */
const VIOLET = "var(--color-dusk-violet)";
const INK = "var(--color-ink)";
const HAIR = "var(--color-hairline)";

export default function Demo() {
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [activeCite, setActiveCite] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [answered, setAnswered] = useState(0);
  const [live, setLive] = useState(false);

  const idRef = useRef(1);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 새 메시지가 붙으면 자동 스크롤
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  /* 봇 답변을 메시지 목록에 반영하는 공통 처리 */
  const commit = (typingId: number, text: string, cites: number[], isLive: boolean) => {
    setMessages((m) =>
      m
        .filter((x) => x.id !== typingId)
        .concat({ id: idRef.current++, role: "bot", text, cites })
    );
    setActiveCite(cites[0] ?? null);
    setAnswered((n) => n + 1);
    setLive(isLive);
    setBusy(false);
  };

  const send = (raw: string) => {
    const q = raw.trim();
    if (!q || busy) return;
    setBusy(true);
    setInput("");

    const userId = idRef.current++;
    const typingId = idRef.current++;
    setMessages((m) => [
      ...m,
      { id: userId, role: "user", text: q },
      { id: typingId, role: "typing" },
    ]);

    const preset = answerFor(q);
    const passages = relevantPassages(q);
    const context = buildContext(passages);
    const fallbackCites = passages.map((p) => p.id);

    // 실시간 AI 시도 → 실패/무키 시 프리셋으로 우아하게 폴백
    (async () => {
      try {
        const res = await fetch("/api/lab/rag-chatbot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: q, context }),
        });
        const data = await res.json();
        if (data.live && typeof data.answer === "string" && data.answer.trim()) {
          commit(typingId, data.answer, extractCites(data.answer, fallbackCites), true);
          return;
        }
      } catch {
        /* 폴백으로 진행 */
      }
      commit(typingId, preset.text, preset.cites, false);
    })();
  };

  const totalChunks = SOURCES.reduce((s, x) => s + x.chunks, 0);
  const activePassage = activeCite != null ? PASSAGES[activeCite] : null;

  /* 새 대화 — 모든 로직 보존, 메시지/상태만 초기화 */
  const resetChat = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMessages([GREETING]);
    setInput("");
    setActiveCite(null);
    setBusy(false);
    setAnswered(0);
    setLive(false);
  };

  /* 인용 칩이 포함된 답변 텍스트를 렌더 */
  const renderWithCites = (text: string) => {
    const parts = text.split(/(\[\d+\])/g);
    return parts.map((p, i) => {
      const mm = p.match(/^\[(\d+)\]$/);
      if (mm) {
        const n = Number(mm[1]);
        const on = activeCite === n;
        return (
          <button
            key={i}
            type="button"
            onClick={() => setActiveCite(n)}
            title="근거 문단 보기"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 20,
              height: 18,
              padding: "0 5px",
              margin: "0 2px",
              verticalAlign: "middle",
              fontFamily: "var(--font-geist)",
              fontSize: 11,
              fontWeight: 700,
              lineHeight: 1,
              cursor: "pointer",
              borderRadius: 6,
              border: `1px solid ${on ? VIOLET : "rgba(107,98,242,0.4)"}`,
              background: on ? VIOLET : "var(--color-violet-soft)",
              color: on ? "#fff" : VIOLET,
              transition: "all .15s ease",
            }}
          >
            {n}
          </button>
        );
      }
      return <span key={i}>{p}</span>;
    });
  };

  return (
    <div className="rag-app lx-win">
      {/* ===== 앱 툴바 (좌: 봇 아이덴티티/온라인 · 우: 라이브 pill + 문서 수 + 새 대화) ===== */}
      <div className="lx-win__bar rag-bar">
        <div className="rag-bar__id">
          <span aria-hidden className="rag-bar__avatar">🤖</span>
          <span className="rag-bar__idtext">
            <b>AXONE 지식봇</b>
            <span className="rag-bar__status">
              <span className="rag-bar__dot" />
              온라인 · 사내 문서 학습 완료
            </span>
          </span>
        </div>
        <div className="rag-bar__actions">
          <span className={`lx-pill ${live ? "lx-pill--ok" : "lx-pill--muted"}`}>
            {live ? "실시간 AI" : "샘플 생성"}
          </span>
          <span className="rag-bar__docs lx-mono" title="색인 문서 · 벡터 청크">
            📚 {SOURCES.length}개 문서 · {totalChunks} 청크
          </span>
          <button type="button" className="lx-btn lx-btn--ghost rag-bar__new" onClick={resetChat}>
            ＋ 새 대화
          </button>
        </div>
      </div>

      {/* ===== 본체: 좌 채팅(전체높이) / 우 지식베이스 ===== */}
      <div className="rag-body">
        {/* ---------- LEFT: 채팅 ---------- */}
        <section className="rag-chat">
          {/* 메시지 영역 */}
          <div ref={scrollRef} className="rag-chat__scroll">
            {messages.map((m) => {
              if (m.role === "typing") {
                return (
                  <div key={m.id} className="rag-row rag-row--bot">
                    <span aria-hidden className="rag-msg-avatar">🤖</span>
                    <div className="rag-bubble rag-bubble--bot rag-bubble--typing">
                      <span className="lx-typing">
                        <i />
                        <i />
                        <i />
                      </span>
                    </div>
                  </div>
                );
              }
              const isUser = m.role === "user";
              return (
                <div key={m.id} className={`rag-row ${isUser ? "rag-row--user" : "rag-row--bot"}`}>
                  {!isUser && <span aria-hidden className="rag-msg-avatar">🤖</span>}
                  <div className={`rag-bubble ${isUser ? "rag-bubble--user" : "rag-bubble--bot"}`}>
                    {isUser ? m.text : renderWithCites(m.text)}
                  </div>
                  {isUser && <span aria-hidden className="rag-msg-avatar rag-msg-avatar--user">나</span>}
                </div>
              );
            })}
          </div>

          {/* 컴포저 (추천 칩 + 입력) */}
          <div className="rag-composer">
            <div className="rag-suggest">
              {SUGGESTED.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="lx-toggle rag-suggest__chip"
                  onClick={() => send(s)}
                  disabled={busy}
                >
                  {s}
                </button>
              ))}
            </div>
            <form
              className="rag-inputbar"
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
            >
              <input
                className="lx-input rag-inputbar__field"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="사내 규정을 물어보세요…"
                aria-label="질문 입력"
              />
              <button type="submit" className="lx-btn lx-btn--primary rag-inputbar__send" disabled={busy || !input.trim()}>
                전송 ↑
              </button>
            </form>
          </div>
        </section>

        {/* ---------- RIGHT: 지식베이스 ---------- */}
        <aside className="rag-kb">
          {/* KPI 스트립 */}
          <div className="rag-kpi">
            <div className="rag-kpi__cell">
              <span className="rag-kpi__val">{SOURCES.length}</span>
              <span className="rag-kpi__lbl">색인 문서</span>
            </div>
            <div className="rag-kpi__cell">
              <span className="rag-kpi__val lx-mono">{totalChunks}</span>
              <span className="rag-kpi__lbl">벡터 청크</span>
            </div>
            <div className="rag-kpi__cell">
              <span className="rag-kpi__val lx-mono">{answered}</span>
              <span className="rag-kpi__lbl">답변한 질문</span>
            </div>
          </div>

          <div className="lx-h">
            색인 문서
            <span className="lx-sub">Vector DB</span>
          </div>

          <div className="rag-sources">
            {SOURCES.map((s) => {
              const isActive = activePassage?.source === s.key;
              return (
                <div
                  key={s.key}
                  className={`lx-card rag-source ${isActive ? "rag-source--active" : ""}`}
                >
                  <span aria-hidden className="rag-source__icon">{s.icon}</span>
                  <div className="rag-source__meta">
                    <b className="rag-source__file">{s.file}</b>
                    <span className="rag-source__desc">{s.desc}</span>
                  </div>
                  <span className="lx-pill lx-pill--muted lx-mono rag-source__count">{s.chunks} 청크</span>
                </div>
              );
            })}
          </div>

          {/* 근거 문단 */}
          <div className="lx-h rag-kb__h2">
            근거 문단
            {activePassage && <span className="lx-pill lx-pill--info">[{activePassage.id}]</span>}
          </div>

          {activePassage ? (
            <div className="lx-card rag-passage">
              <div className="rag-passage__loc">{activePassage.loc}</div>
              <p className="rag-passage__text">“{activePassage.text}”</p>
            </div>
          ) : (
            <div className="lx-card lx-card--tint rag-passage-empty">
              답변의 인용 번호 [1] [2] 를 누르면 근거 문단이 여기에 표시됩니다.
            </div>
          )}

          <p className="rag-kb__note">
            모든 답변은 색인된 사내 문서를 근거로 생성됩니다.
          </p>
        </aside>
      </div>

      {/* 컴포넌트 스코프 스타일 (labx/lx 토큰 재사용, 외부 CSS 미변경) */}
      <style jsx>{`
        .rag-app {
          display: flex;
          flex-direction: column;
          /* 셸 바(52px)+서브라인+푸터를 뺀 뷰포트를 채워 실제 앱처럼 */
          height: min(760px, calc(100vh - 210px));
          min-height: 520px;
        }
        .rag-bar {
          flex: 0 0 auto;
        }
        .rag-bar__id {
          display: flex;
          align-items: center;
          gap: 11px;
          min-width: 0;
        }
        .rag-bar__avatar {
          display: inline-flex;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--color-violet-soft);
          border: 1px solid ${HAIR};
          align-items: center;
          justify-content: center;
          font-size: 19px;
          flex: 0 0 auto;
        }
        .rag-bar__idtext {
          display: flex;
          flex-direction: column;
          line-height: 1.3;
          min-width: 0;
        }
        .rag-bar__idtext b {
          font-family: var(--font-geist);
          font-size: 14px;
          color: ${INK};
        }
        .rag-bar__status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11.5px;
          color: var(--color-slate);
          white-space: nowrap;
        }
        .rag-bar__dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #1f9d57;
          box-shadow: 0 0 0 3px rgba(31, 157, 87, 0.16);
        }
        .rag-bar__actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 0 0 auto;
        }
        .rag-bar__docs {
          font-size: 12px;
          color: var(--color-slate);
          white-space: nowrap;
        }
        .rag-bar__new {
          padding: 7px 13px;
          font-size: 13px;
          border-radius: 10px;
        }

        .rag-body {
          flex: 1;
          min-height: 0;
          display: grid;
          grid-template-columns: 1.55fr 1fr;
          gap: 0;
        }

        /* ---- 채팅 컬럼 ---- */
        .rag-chat {
          display: flex;
          flex-direction: column;
          min-height: 0;
          min-width: 0;
          border-right: 1px solid ${HAIR};
          background: linear-gradient(180deg, #fbfbff 0%, #ffffff 120px);
        }
        .rag-chat__scroll {
          flex: 1;
          overflow-y: auto;
          padding: 20px 22px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .rag-row {
          display: flex;
          align-items: flex-end;
          gap: 9px;
        }
        .rag-row--user {
          justify-content: flex-end;
        }
        .rag-row--bot {
          justify-content: flex-start;
        }
        .rag-msg-avatar {
          flex: 0 0 auto;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #fff;
          border: 1px solid ${HAIR};
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          margin-bottom: 2px;
        }
        .rag-msg-avatar--user {
          background: ${VIOLET};
          border-color: ${VIOLET};
          color: #fff;
          font-family: var(--font-geist);
          font-size: 11px;
          font-weight: 700;
        }
        .rag-bubble {
          max-width: 78%;
          padding: 11px 14px;
          font-size: 13.5px;
          line-height: 1.62;
          word-break: break-word;
          box-shadow: 0 1px 2px rgba(20, 20, 50, 0.04);
        }
        .rag-bubble--bot {
          background: #fff;
          color: ${INK};
          border: 1px solid ${HAIR};
          border-radius: 14px 14px 14px 4px;
        }
        .rag-bubble--user {
          background: ${VIOLET};
          color: #fff;
          border-radius: 14px 14px 4px 14px;
        }
        .rag-bubble--typing {
          padding: 13px 15px;
        }

        /* ---- 컴포저 ---- */
        .rag-composer {
          flex: 0 0 auto;
          border-top: 1px solid ${HAIR};
          background: #fff;
          padding: 12px 16px 14px;
        }
        .rag-suggest {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-bottom: 11px;
        }
        .rag-suggest__chip {
          font-size: 12px;
          padding: 6px 12px;
        }
        .rag-inputbar {
          display: flex;
          gap: 9px;
        }
        .rag-inputbar__field {
          flex: 1;
          border-radius: 12px;
        }
        .rag-inputbar__send {
          flex: 0 0 auto;
          border-radius: 12px;
          padding: 10px 18px;
        }

        /* ---- 지식베이스 컬럼 ---- */
        .rag-kb {
          display: flex;
          flex-direction: column;
          min-height: 0;
          min-width: 0;
          overflow-y: auto;
          padding: 18px;
          gap: 12px;
          background: var(--color-tint);
        }
        .rag-kpi {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          flex: 0 0 auto;
        }
        .rag-kpi__cell {
          background: #fff;
          border: 1px solid ${HAIR};
          border-radius: 11px;
          padding: 11px 10px;
          display: flex;
          flex-direction: column;
          gap: 3px;
          align-items: flex-start;
        }
        .rag-kpi__val {
          font-family: var(--font-geist);
          font-size: 20px;
          font-weight: 800;
          color: ${INK};
          line-height: 1.05;
        }
        .rag-kpi__lbl,
        .rag-kpi__lb {
          font-size: 11px;
          color: var(--color-slate);
        }
        .lx-h {
          margin: 4px 0 2px;
        }
        .rag-kb__h2 {
          margin-top: 6px;
        }
        .rag-sources {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 0 0 auto;
        }
        .rag-source {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
        }
        .rag-source--active {
          border-color: rgba(107, 98, 242, 0.5);
          background: var(--color-violet-soft);
          box-shadow: 0 4px 14px -8px rgba(107, 98, 242, 0.5);
        }
        .rag-source__icon {
          font-size: 18px;
          flex: 0 0 auto;
        }
        .rag-source__meta {
          min-width: 0;
          flex: 1;
        }
        .rag-source__file {
          font-family: var(--font-geist);
          font-size: 13px;
          color: ${INK};
          display: block;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .rag-source__desc {
          font-size: 11.5px;
          color: var(--color-slate);
        }
        .rag-source__count {
          white-space: nowrap;
          flex: 0 0 auto;
        }
        .rag-passage {
          border-color: rgba(107, 98, 242, 0.5);
          background: #fff;
          border-left: 3px solid ${VIOLET};
          flex: 0 0 auto;
        }
        .rag-passage__loc {
          font-size: 11px;
          font-weight: 700;
          color: ${VIOLET};
          margin-bottom: 6px;
          font-family: var(--font-geist);
        }
        .rag-passage__text {
          margin: 0;
          font-size: 13px;
          line-height: 1.65;
          color: var(--color-ash);
        }
        .rag-passage-empty {
          font-size: 12.5px;
          color: var(--color-slate);
          text-align: center;
          padding: 18px;
          flex: 0 0 auto;
        }
        .rag-kb__note {
          margin: auto 0 0;
          padding-top: 6px;
          font-size: 11px;
          color: var(--color-slate);
          line-height: 1.5;
        }

        /* ---- 반응형: 모바일에서 세로 스택 ---- */
        @media (max-width: 780px) {
          .rag-app {
            height: auto;
            min-height: 0;
          }
          .rag-body {
            grid-template-columns: 1fr;
          }
          .rag-chat {
            border-right: none;
            border-bottom: 1px solid ${HAIR};
          }
          .rag-chat__scroll {
            min-height: 320px;
            max-height: 460px;
          }
          .rag-kb {
            overflow: visible;
          }
        }
        @media (max-width: 560px) {
          .rag-bar__docs {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
