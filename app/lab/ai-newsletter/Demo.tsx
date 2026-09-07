"use client";

import { useEffect, useRef, useState } from "react";
import AxoneMark from "@/components/AxoneMark";

/* ---------------- 상수 ---------------- */

const CADENCES = ["주간", "격주", "월간"] as const;
type Cadence = (typeof CADENCES)[number];

const TONES = ["전문적", "친근한", "트렌디"] as const;
type Tone = (typeof TONES)[number];

type StepState = "wait" | "run" | "done";
const STEPS = [
  { key: "collect", label: "소재 수집", icon: "🔍", hint: "웹·트렌드 소스 스캔" },
  { key: "draft", label: "GPT 초안", icon: "🤖", hint: "AI 카피라이팅" },
  { key: "review", label: "자동 검수", icon: "🛡️", hint: "톤·팩트 체크" },
  { key: "send", label: "발송 준비", icon: "📮", hint: "발송 큐 적재" },
] as const;

/* ---------------- 결정적(deterministic) 헬퍼 ---------------- */

/** 문자열 → 안정적 정수 해시 (Math.random 미사용, 하이드레이션 안전) */
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

type Article = { tag: string; headline: string; summary: string };

function buildIssue(topicRaw: string, tone: Tone) {
  const topic = topicRaw.trim() || "AI 업무 자동화";
  const h = hashStr(topic + "|" + tone);

  const toneLead: Record<Tone, string> = {
    전문적: "이번 호에서는 실무에 바로 적용 가능한 인사이트를 정리했습니다.",
    친근한: "이번 주도 알찬 소식만 쏙쏙 골라 담았어요 :)",
    트렌디: "지금 가장 뜨거운 이슈만 빠르게 훑어드립니다 🔥",
  };

  const angles = [
    { tag: "트렌드", h: `${topic}, 지금 시장은 어디로 가고 있나`, s: "최근 4주간의 흐름을 데이터로 짚고, 실무자가 주목해야 할 변화 세 가지를 정리했습니다." },
    { tag: "실전 가이드", h: `실무에서 바로 쓰는 ${topic} 체크리스트`, s: "도입 단계별로 놓치기 쉬운 포인트를 점검표로 만들었습니다. 오늘 바로 적용해 보세요." },
    { tag: "사례", h: `${topic} 도입 4주, 무엇이 달라졌나`, s: "실제 팀의 처리량은 3배, 응대 시간은 72% 줄었습니다. 성과를 만든 핵심 요인을 분석합니다." },
    { tag: "인터뷰", h: `현장의 목소리: ${topic}를 먼저 도입한 팀`, s: "먼저 시도한 팀장이 말하는 시행착오와 배운 점. 처음 시작하는 분께 꼭 필요한 이야기." },
    { tag: "툴", h: `${topic}를 돕는 자동화 워크플로우 5선`, s: "반복 업무를 걷어내는 n8n 워크플로우를 엄선했습니다. 복사해서 바로 쓰는 템플릿 포함." },
  ];

  const a1 = angles[h % angles.length];
  const a2 = angles[(h >> 3) % angles.length];
  const a3 = angles[(h >> 6) % angles.length];
  const pick = [a1, a2, a3];
  // 중복 회피
  const seen = new Set<string>();
  const articles: Article[] = [];
  let idx = 0;
  for (const p of pick) {
    let a = p;
    while (seen.has(a.h)) {
      a = angles[idx % angles.length];
      idx++;
    }
    seen.add(a.h);
    articles.push({ tag: a.tag, headline: a.h, summary: a.s });
  }

  const heroTitle = `${topic}, 이번 호의 핵심만 모았습니다`;

  // 결정적 통계
  const subscribers = 8200 + (h % 4200); // 8.2K ~ 12.4K
  const openRate = 38 + (h % 22); // 38 ~ 59
  const clickRate = 6 + (h % 9); // 6 ~ 14

  return {
    topic,
    lead: toneLead[tone],
    heroTitle,
    articles,
    subscribers,
    openRate,
    clickRate,
  };
}

function fmtK(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return String(n);
}

const SEED_TOPIC = "AI 업무 자동화";
const SEED_TONE: Tone = "전문적";

/* ---------------- 컴포넌트 ---------------- */

export default function Demo() {
  const [topic, setTopic] = useState(SEED_TOPIC);
  const [cadence, setCadence] = useState<Cadence>("주간");
  const [tone, setTone] = useState<Tone>(SEED_TONE);

  const [running, setRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState(4); // 4 = 전체 완료(초기엔 프리뷰 표시)
  const [issue, setIssue] = useState(() => buildIssue(SEED_TOPIC, SEED_TONE));
  const [genMs, setGenMs] = useState<number | null>(null);
  const [live, setLive] = useState(false);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  /** 애니메이션 총 소요시간(ms)만큼 대기 */
  const wait = (ms: number) =>
    new Promise<void>((resolve) => {
      const t = setTimeout(resolve, ms);
      timers.current.push(t);
    });

  // 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      timers.current.forEach((t) => clearTimeout(t));
      timers.current = [];
    };
  }, []);

  const run = async () => {
    if (running) return;
    // 기존 타이머 정리
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];

    setRunning(true);
    setStepIndex(0);
    setGenMs(null);

    const nextIssue = buildIssue(topic, tone);
    // ~1.6s 총합: 4단계 x 400ms
    const stepMs = 400;
    for (let i = 1; i <= STEPS.length; i++) {
      const t = setTimeout(() => setStepIndex(i), stepMs * i);
      timers.current.push(t);
    }

    // 애니메이션과 실제 생성 요청을 병행: 실연동 성공 시 실제 콘텐츠로 교체
    const fetchLive = (async (): Promise<ReturnType<typeof buildIssue> | null> => {
      try {
        const res = await fetch("/api/lab/ai-newsletter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic, cadence, tone }),
        });
        const data = await res.json();
        const nl = data?.newsletter;
        if (
          data?.live &&
          nl &&
          typeof nl.title === "string" &&
          Array.isArray(nl.articles) &&
          nl.articles.length
        ) {
          const articles: Article[] = nl.articles.slice(0, 3).map((a: Article) => ({
            tag: String(a.tag ?? "인사이트"),
            headline: String(a.headline ?? ""),
            summary: String(a.summary ?? ""),
          }));
          return { ...nextIssue, heroTitle: nl.title, lead: nl.intro || nextIssue.lead, articles };
        }
      } catch {
        /* 폴백 */
      }
      return null;
    })();

    // 애니메이션이 끝날 때까지 대기(최소 표시 시간 보장)
    await wait(stepMs * STEPS.length + 60);
    const liveIssue = await fetchLive;

    const finalIssue = liveIssue ?? nextIssue;
    setIssue(finalIssue);
    setLive(!!liveIssue);
    // 결정적 소요시간 표시 (1.4 ~ 1.8s)
    setGenMs(1400 + (hashStr(finalIssue.topic) % 400));
    setRunning(false);
  };

  const showPreview = stepIndex >= STEPS.length;

  const stepStateOf = (i: number): StepState => {
    if (stepIndex > i) return "done";
    if (stepIndex === i) return running ? "run" : "done";
    return "wait";
  };

  const cadenceLabel = cadence === "주간" ? "Weekly" : cadence === "격주" ? "Biweekly" : "Monthly";

  // 파이프라인 진행률 (0~100) — 표시용 파생값 (로직/타이머 미변경)
  const progressPct = Math.round((Math.min(stepIndex, STEPS.length) / STEPS.length) * 100);
  const sendStatus = running ? "발송 대기" : "발송 준비 완료";

  return (
    <div className="lx-win nl-win">
      {/* 앱 툴바 */}
      <div className="lx-win__bar nl-bar">
        <div className="lx-win__title nl-bar__title">
          <span className="nl-bar__icon" aria-hidden>📧</span>
          <span className="nl-bar__titles">
            <span className="nl-bar__name">뉴스레터 스튜디오</span>
            <span className="nl-bar__crumb">AXONE · Newsletter Automation</span>
          </span>
        </div>
        <div className="nl-bar__right">
          <span className={`nl-status ${live ? "is-live" : "is-sample"}`}>
            <i className="nl-dot" aria-hidden />
            {live ? "실시간 AI 연동" : "샘플 생성"}
          </span>
          <span className={`nl-status nl-status--send ${running ? "is-busy" : "is-ready"}`}>
            <i className="nl-dot" aria-hidden />
            {sendStatus}
          </span>
        </div>
      </div>

      {/* 스튜디오 본문 — 좌: 설정/파이프라인/통계 · 우: 이메일 클라이언트 */}
      <div className="lx-win__body nl-body">
        {/* ===================== 좌측: 컨트롤 ===================== */}
        <div className="nl-left">
          {/* 설정 카드 */}
          <div className="nl-card nl-config">
            <div className="nl-card__head">
              <span className="nl-card__title">발행 설정</span>
              <span className="nl-card__meta">{cadenceLabel} · {tone}</span>
            </div>

            <label className="lx-label">뉴스레터 주제 · 키워드</label>
            <input
              className="lx-input"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="예) AI 업무 자동화, 마케팅 트렌드, 스타트업 성장…"
            />

            <div className="nl-field">
              <label className="lx-label">발행 주기</label>
              <div className="nl-seg" role="group">
                {CADENCES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`nl-seg__btn${cadence === c ? " is-on" : ""}`}
                    onClick={() => setCadence(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="nl-field">
              <label className="lx-label">톤 앤 매너</label>
              <div className="nl-chips">
                {TONES.map((tn) => (
                  <button
                    key={tn}
                    type="button"
                    className={`lx-toggle${tone === tn ? " is-on" : ""}`}
                    onClick={() => setTone(tn)}
                  >
                    {tn}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="lx-btn lx-btn--primary nl-run"
              onClick={run}
              disabled={running}
            >
              {running ? (
                <>
                  <span className="nl-run__spin" aria-hidden />
                  생성 중…
                </>
              ) : (
                <>✦ 뉴스레터 생성</>
              )}
            </button>
          </div>

          {/* 파이프라인 스텝퍼 (세로) */}
          <div className="nl-card nl-pipe">
            <div className="nl-card__head">
              <span className="nl-card__title">자동화 파이프라인</span>
              <span className={`lx-pill ${running ? "lx-pill--info" : "lx-pill--ok"}`}>
                {running ? "실행 중…" : "완료"}
              </span>
            </div>

            <div className="nl-pipe__bar" aria-hidden>
              <span className="nl-pipe__fill" style={{ width: `${progressPct}%` }} />
            </div>

            <ol className="nl-steps">
              {STEPS.map((s, i) => {
                const st = stepStateOf(i);
                const on = st === "done" || st === "run";
                return (
                  <li key={s.key} className={`nl-step is-${st}`}>
                    <span className="nl-step__node" aria-hidden>
                      {st === "done" ? (
                        <span className="nl-step__check">✓</span>
                      ) : st === "run" ? (
                        <span className="nl-step__spin" />
                      ) : (
                        <span className="nl-step__icon">{s.icon}</span>
                      )}
                    </span>
                    <span className="nl-step__body">
                      <span className={`nl-step__label${on ? " is-on" : ""}`}>
                        {i + 1}. {s.label}
                      </span>
                      <span className="nl-step__hint">{s.hint}</span>
                    </span>
                    <span
                      className={`lx-pill ${
                        st === "done" ? "lx-pill--ok" : st === "run" ? "lx-pill--info" : "lx-pill--muted"
                      } nl-step__pill`}
                    >
                      {st === "done" ? "완료" : st === "run" ? "진행중" : "대기"}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* 통계 */}
          <div className="nl-stats">
            <div className="lx-stat">
              <span className="lx-stat__label">구독자 수</span>
              <span className="lx-stat__value lx-mono">{fmtK(issue.subscribers)}</span>
              <span className="lx-stat__delta lx-up">▲ 전월 대비 +4.2%</span>
            </div>
            <div className="lx-stat">
              <span className="lx-stat__label">예상 오픈율</span>
              <span className="lx-stat__value lx-mono">{issue.openRate}%</span>
              <span className="lx-stat__delta lx-muted">업계 평균 21%</span>
            </div>
            <div className="lx-stat">
              <span className="lx-stat__label">예상 클릭율</span>
              <span className="lx-stat__value lx-mono">{issue.clickRate}%</span>
              <span className="lx-stat__delta lx-muted">업계 평균 2.6%</span>
            </div>
            <div className="lx-stat">
              <span className="lx-stat__label">생성 소요시간</span>
              <span className="lx-stat__value lx-mono">
                {genMs != null ? (genMs / 1000).toFixed(1) + "s" : "1.6s"}
              </span>
              <span className="lx-stat__delta lx-up">▼ 수작업 대비 -98%</span>
            </div>
          </div>
        </div>

        {/* ===================== 우측: 이메일 클라이언트 ===================== */}
        <div className="nl-right">
          <div className="nl-client">
            {/* 이메일 클라이언트 크롬 */}
            <div className="nl-client__chrome">
              <span className="nl-client__tab">받은편지함</span>
              <span className="nl-client__folder">보관함</span>
              <span className="nl-client__folder">발송함</span>
              <span className="nl-client__grow" />
              <span className={`lx-pill ${showPreview ? "lx-pill--ok" : "lx-pill--muted"} nl-client__flag`}>
                {showPreview ? "검수 통과 ✓" : "생성 중…"}
              </span>
            </div>

            {/* 메일 헤더 라인 (from/subject) */}
            <div className="nl-client__meta">
              <div className="nl-client__from">
                <span className="nl-client__avatar" aria-hidden>
                  <AxoneMark size={22} />
                </span>
                <span className="nl-client__fromtext">
                  <span className="nl-client__sender">AXONE {cadenceLabel}</span>
                  <span className="nl-client__addr">newsletter@axone.ai.kr · {cadence} 발행</span>
                </span>
              </div>
              <span className="nl-client__time">방금 전</span>
            </div>

            {/* 메일 본문 스크롤 영역 */}
            <div className="nl-client__scroll">
              {showPreview ? (
                <div className="nl-mail">
                  {/* 이메일 헤더 */}
                  <div className="nl-mail__banner">
                    <div className="nl-mail__brand">
                      <AxoneMark size={30} />
                      <div>
                        <div className="nl-mail__brandname">AXONE {cadenceLabel}</div>
                        <div className="nl-mail__brandsub">
                          {cadence} 발행 · No. {(hashStr(issue.topic) % 90) + 10}
                        </div>
                      </div>
                    </div>
                    <span className="nl-mail__badge">NEWSLETTER</span>
                  </div>

                  {/* 히어로 */}
                  <div className="nl-mail__hero">
                    <h2 className="nl-mail__title">{issue.heroTitle}</h2>
                    <p className="nl-mail__lead">{issue.lead}</p>
                  </div>

                  {/* 아티클 블록 */}
                  <div className="nl-mail__articles">
                    {issue.articles.map((a, i) => (
                      <div key={i} className={`nl-mail__article${i === 0 ? " is-first" : ""}`}>
                        <span className="lx-pill lx-pill--info nl-mail__tag">{a.tag}</span>
                        <h3 className="nl-mail__headline">{a.headline}</h3>
                        <p className="nl-mail__summary">{a.summary}</p>
                        <span className="nl-mail__more">자세히 →</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA 배너 */}
                  <div className="nl-mail__cta-wrap">
                    <div className="nl-mail__cta">
                      <div className="nl-mail__cta-title">
                        이 워크플로우, 우리 팀에도 도입하고 싶다면?
                      </div>
                      <span className="nl-mail__cta-link">무료 진단 신청하기 →</span>
                    </div>
                  </div>

                  {/* 푸터 */}
                  <div className="nl-mail__footer">
                    <div className="nl-mail__foot-line">© AXONE · 서울특별시 · goodtereobiz@axone.ai.kr</div>
                    <div className="nl-mail__foot-line">
                      본 메일은 구독 신청하신 분께 발송됩니다 ·{" "}
                      <span className="nl-mail__unsub">구독취소</span>
                    </div>
                  </div>
                </div>
              ) : (
                // 생성 중 스켈레톤
                <div className="nl-mail nl-mail--skel">
                  <div className="lx-skel" style={{ height: 28, width: "70%", marginBottom: 16 }} />
                  <div className="lx-skel" style={{ height: 12, marginBottom: 8 }} />
                  <div className="lx-skel" style={{ height: 12, width: "85%", marginBottom: 20 }} />
                  {[0, 1, 2].map((i) => (
                    <div key={i} style={{ marginBottom: 18 }}>
                      <div className="lx-skel" style={{ height: 16, width: "60%", marginBottom: 8 }} />
                      <div className="lx-skel" style={{ height: 11, marginBottom: 6 }} />
                      <div className="lx-skel" style={{ height: 11, width: "75%" }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 로컬 스타일 (전역 CSS 미변경) */}
      <style>{`
        @keyframes nlspin { to { transform: rotate(360deg); } }

        .nl-win { display: flex; flex-direction: column; }

        /* ---------- 툴바 ---------- */
        .nl-bar { min-height: 58px; }
        .nl-bar__title { gap: 11px; }
        .nl-bar__icon {
          width: 34px; height: 34px; border-radius: 10px; display: inline-flex;
          align-items: center; justify-content: center; font-size: 17px;
          background: var(--color-violet-soft); border: 1px solid rgba(107,98,242,0.28);
        }
        .nl-bar__titles { display: flex; flex-direction: column; line-height: 1.2; }
        .nl-bar__name { font-family: var(--font-geist); font-weight: 800; font-size: 15px; color: var(--color-ink); }
        .nl-bar__crumb { font-size: 11px; color: var(--color-slate); font-weight: 500; }
        .nl-bar__right { display: flex; align-items: center; gap: 8px; flex: 0 0 auto; }
        .nl-status {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 11.5px; font-weight: 700; border-radius: 20px;
          padding: 5px 11px; border: 1px solid var(--color-hairline);
          background: var(--color-tint); color: var(--color-slate);
          white-space: nowrap;
        }
        .nl-status .nl-dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; flex: 0 0 auto; }
        .nl-status.is-live { color: #1f9d57; background: #e7f7ee; border-color: rgba(31,157,87,0.28); }
        .nl-status.is-live .nl-dot { animation: nlpulse 1.4s ease-in-out infinite; }
        .nl-status.is-sample { color: var(--color-slate); }
        .nl-status--send.is-ready { color: #2f6bd6; background: #e8f0fd; border-color: rgba(47,107,214,0.24); }
        .nl-status--send.is-busy { color: #c98a12; background: #fdf3e0; border-color: rgba(201,138,18,0.28); }
        .nl-status--send.is-busy .nl-dot { animation: nlpulse 1s ease-in-out infinite; }
        @keyframes nlpulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .35; transform: scale(.7); } }

        /* ---------- 본문 그리드 ---------- */
        .nl-body {
          display: grid;
          grid-template-columns: minmax(0, 400px) minmax(0, 1fr);
          gap: 18px; padding: 18px;
          background:
            radial-gradient(120% 90% at 100% 0%, rgba(107,98,242,0.05), transparent 60%),
            var(--color-tint);
          align-items: start;
        }
        .nl-left { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
        .nl-right { min-width: 0; position: sticky; top: 70px; }

        /* ---------- 카드 ---------- */
        .nl-card { background: #fff; border: 1px solid var(--color-hairline); border-radius: 14px; padding: 16px; box-shadow: 0 1px 2px rgba(20,20,50,0.03); }
        .nl-card__head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 13px; }
        .nl-card__title { font-family: var(--font-geist); font-size: 14px; font-weight: 800; color: var(--color-ink); }
        .nl-card__meta { font-size: 11.5px; color: var(--color-slate); font-weight: 600; }

        .nl-field { margin-top: 13px; }

        /* 세그먼트 (발행 주기) */
        .nl-seg { display: flex; gap: 4px; background: var(--color-tint); border-radius: 11px; padding: 4px; }
        .nl-seg__btn {
          flex: 1; text-align: center; font-size: 13px; font-weight: 700; color: var(--color-slate);
          border-radius: 8px; padding: 8px 6px; cursor: pointer; border: none; background: transparent;
          transition: all .15s ease; font-family: var(--font-dm-sans);
        }
        .nl-seg__btn:hover { color: var(--color-ash); }
        .nl-seg__btn.is-on { background: #fff; color: var(--color-dusk-violet); box-shadow: 0 1px 4px rgba(20,20,50,0.1); }

        .nl-chips { display: flex; gap: 7px; flex-wrap: wrap; }
        .nl-chips .lx-toggle:hover { border-color: rgba(107,98,242,0.4); }

        .nl-run { width: 100%; margin-top: 16px; padding: 12px; }
        .nl-run__spin {
          width: 15px; height: 15px; border-radius: 50%;
          border: 2.5px solid rgba(255,255,255,0.35); border-top-color: #fff;
          display: inline-block; animation: nlspin .7s linear infinite;
        }

        /* ---------- 파이프라인 (세로) ---------- */
        .nl-pipe__bar { height: 6px; border-radius: 4px; background: var(--color-tint); overflow: hidden; margin-bottom: 14px; }
        .nl-pipe__fill { display: block; height: 100%; border-radius: 4px; background: linear-gradient(90deg, var(--color-dusk-violet), #8b7bff); transition: width .35s ease; }
        .nl-steps { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
        .nl-step { display: flex; align-items: center; gap: 12px; padding: 9px 8px; border-radius: 10px; position: relative; transition: background .2s ease; }
        .nl-step.is-run { background: var(--color-violet-soft); }
        .nl-step + .nl-step::before {
          content: ""; position: absolute; left: 24px; top: -8px; height: 8px; width: 2px;
          background: var(--color-hairline-strong);
        }
        .nl-step.is-done::before, .nl-step.is-run::before { background: rgba(31,157,87,0.45); }
        .nl-step__node {
          flex: 0 0 auto; width: 34px; height: 34px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center; font-size: 15px;
          border: 1px solid var(--color-hairline-strong); background: #fff; transition: all .25s ease;
        }
        .nl-step.is-done .nl-step__node { border-color: rgba(31,157,87,0.4); background: #e7f7ee; }
        .nl-step.is-run .nl-step__node { border-color: rgba(107,98,242,0.5); background: #fff; }
        .nl-step__check { color: #1f9d57; font-weight: 800; }
        .nl-step__icon { opacity: .55; }
        .nl-step__spin {
          width: 16px; height: 16px; border-radius: 50%;
          border: 2.5px solid rgba(107,98,242,0.25); border-top-color: var(--color-dusk-violet);
          display: inline-block; animation: nlspin .7s linear infinite;
        }
        .nl-step__body { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1 1 auto; }
        .nl-step__label { font-family: var(--font-geist); font-size: 13px; font-weight: 700; color: var(--color-slate); }
        .nl-step__label.is-on { color: var(--color-ink); }
        .nl-step__hint { font-size: 11px; color: var(--color-slate); }
        .nl-step__pill { flex: 0 0 auto; }

        /* ---------- 통계 ---------- */
        .nl-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .nl-stats .lx-stat { box-shadow: 0 1px 2px rgba(20,20,50,0.03); }

        /* ---------- 이메일 클라이언트 ---------- */
        .nl-client {
          background: #fff; border: 1px solid var(--color-hairline); border-radius: 16px; overflow: hidden;
          box-shadow: 0 24px 60px -34px rgba(20,20,50,0.4);
          display: flex; flex-direction: column; max-height: calc(100vh - 150px);
        }
        .nl-client__chrome {
          display: flex; align-items: center; gap: 6px; padding: 10px 14px;
          border-bottom: 1px solid var(--color-hairline); background: #fafaff;
        }
        .nl-client__tab {
          font-size: 12px; font-weight: 800; color: var(--color-ink); font-family: var(--font-geist);
          background: #fff; border: 1px solid var(--color-hairline); border-radius: 8px; padding: 5px 11px;
        }
        .nl-client__folder { font-size: 12px; font-weight: 600; color: var(--color-slate); padding: 5px 8px; }
        .nl-client__grow { flex: 1; }
        .nl-client__flag { flex: 0 0 auto; }

        .nl-client__meta {
          display: flex; align-items: center; justify-content: space-between; gap: 10px;
          padding: 12px 16px; border-bottom: 1px solid var(--color-hairline);
        }
        .nl-client__from { display: flex; align-items: center; gap: 10px; min-width: 0; }
        .nl-client__avatar {
          width: 36px; height: 36px; border-radius: 10px; flex: 0 0 auto;
          display: inline-flex; align-items: center; justify-content: center;
          background: var(--color-graphite);
        }
        .nl-client__fromtext { display: flex; flex-direction: column; min-width: 0; }
        .nl-client__sender { font-family: var(--font-geist); font-weight: 800; font-size: 13.5px; color: var(--color-ink); }
        .nl-client__addr { font-size: 11.5px; color: var(--color-slate); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .nl-client__time { font-size: 11.5px; color: var(--color-slate); flex: 0 0 auto; }

        .nl-client__scroll { overflow-y: auto; background: var(--color-tint); padding: 20px 18px; }

        /* ---------- 이메일 카드 ---------- */
        .nl-mail {
          max-width: 600px; margin: 0 auto; background: #fff; border-radius: 14px; overflow: hidden;
          border: 1px solid var(--color-hairline); box-shadow: 0 10px 30px -22px rgba(20,20,50,0.35);
        }
        .nl-mail--skel { padding: 24px; }
        .nl-mail__banner {
          background: var(--color-graphite); color: #fff; padding: 20px 24px;
          display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
        }
        .nl-mail__brand { display: flex; align-items: center; gap: 10px; }
        .nl-mail__brandname { font-family: var(--font-geist); font-weight: 800; font-size: 17px; letter-spacing: 0.01em; }
        .nl-mail__brandsub { font-size: 11.5px; color: rgba(255,255,255,0.66); }
        .nl-mail__badge {
          font-size: 10.5px; font-weight: 800; letter-spacing: 0.12em; color: #fff;
          background: var(--color-dusk-violet); border-radius: 20px; padding: 4px 10px;
        }
        .nl-mail__hero { padding: 24px 24px 8px; }
        .nl-mail__title { font-family: var(--font-geist); font-size: 22px; font-weight: 800; color: var(--color-ink); line-height: 1.25; margin: 0 0 8px; }
        .nl-mail__lead { margin: 0; font-size: 14px; color: var(--color-ash); line-height: 1.6; }
        .nl-mail__articles { padding: 8px 24px 4px; }
        .nl-mail__article { padding: 18px 0; border-top: 1px solid var(--color-hairline); }
        .nl-mail__article.is-first { border-top: none; }
        .nl-mail__tag { margin-bottom: 8px; }
        .nl-mail__headline { font-family: var(--font-geist); font-size: 16px; font-weight: 700; color: var(--color-ink); margin: 8px 0 6px; line-height: 1.35; }
        .nl-mail__summary { margin: 0 0 8px; font-size: 13.5px; color: var(--color-ash); line-height: 1.6; }
        .nl-mail__more { font-size: 13px; font-weight: 700; color: var(--color-dusk-violet); }
        .nl-mail__cta-wrap { padding: 8px 24px 20px; }
        .nl-mail__cta { background: var(--color-violet-soft); border-radius: 12px; padding: 16px 18px; text-align: center; }
        .nl-mail__cta-title { font-family: var(--font-geist); font-weight: 700; font-size: 14px; color: var(--color-ink); margin-bottom: 4px; }
        .nl-mail__cta-link { font-size: 13px; font-weight: 700; color: var(--color-dusk-violet); }
        .nl-mail__footer { border-top: 1px solid var(--color-hairline); padding: 16px 24px 20px; text-align: center; background: #fafaff; }
        .nl-mail__foot-line { font-size: 12px; color: var(--color-slate); }
        .nl-mail__foot-line + .nl-mail__foot-line { margin-top: 6px; }
        .nl-mail__unsub { text-decoration: underline; cursor: pointer; }

        /* ---------- 반응형 ---------- */
        @media (max-width: 960px) {
          .nl-body { grid-template-columns: 1fr; }
          .nl-right { position: static; }
          .nl-client { max-height: none; }
        }
        @media (max-width: 520px) {
          .nl-body { padding: 14px; gap: 14px; }
          .nl-stats { grid-template-columns: 1fr; }
          .nl-bar__crumb { display: none; }
        }
      `}</style>
    </div>
  );
}
