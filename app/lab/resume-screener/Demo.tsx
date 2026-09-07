"use client";

import { useMemo, useState } from "react";

/* ---------- 직무 & 평가 기준 ---------- */

type RoleKey = "frontend" | "marketer" | "analyst";

const ROLES: { key: RoleKey; name: string; req: string }[] = [
  {
    key: "frontend",
    name: "프론트엔드 개발자",
    req: "React/TypeScript 기반 SPA 개발 3년 이상. 디자인 시스템 구축 경험, 성능 최적화, 협업 툴(Figma/Git) 능숙자 우대. 컴퓨터공학 또는 관련 전공.",
  },
  {
    key: "marketer",
    name: "마케터",
    req: "퍼포먼스 마케팅 및 콘텐츠 기획 경력 3년 이상. GA·메타·구글애즈 운영, 데이터 기반 캠페인 최적화 역량. 브랜드 커뮤니케이션 경험 우대.",
  },
  {
    key: "analyst",
    name: "데이터 분석가",
    req: "SQL·Python 기반 데이터 분석 3년 이상. 대시보드 설계(Tableau/Looker), A/B 테스트 설계, 비즈니스 인사이트 도출 경험. 통계/산업공학 전공 우대.",
  },
];

type CriKey = "career" | "skill" | "edu" | "culture";

const CRITERIA: { key: CriKey; label: string; color: string }[] = [
  { key: "career", label: "경력", color: "#6b62f2" },
  { key: "skill", label: "기술스택", color: "#2f6bd6" },
  { key: "edu", label: "학력", color: "#1f9d57" },
  { key: "culture", label: "문화적합", color: "#c98a12" },
];

/* 기본 가중치 프리셋 (합 100) */
const DEFAULT_WEIGHTS: Record<CriKey, number> = {
  career: 35,
  skill: 35,
  edu: 12,
  culture: 18,
};

/* ---------- 후보 데이터 (직무별, 고정 시드) ---------- */

type Candidate = {
  id: string;
  name: string;
  scores: Record<CriKey, number>; // 0-100 원점수
  skills: string[];
  summary: string;
  strengths: string[];
  concerns: string[];
};

const POOL: Record<RoleKey, Candidate[]> = {
  frontend: [
    {
      id: "f1",
      name: "김○○",
      scores: { career: 92, skill: 95, edu: 80, culture: 88 },
      skills: ["React", "TypeScript", "Next.js", "디자인시스템"],
      summary: "대규모 SPA와 디자인 시스템을 주도한 경험이 공고 요건과 매우 부합합니다.",
      strengths: ["디자인 시스템 구축 리드 경험", "렌더링 성능 40% 개선 사례", "코드 리뷰 문화 정착"],
      concerns: ["백엔드 협업 경험은 다소 제한적"],
    },
    {
      id: "f2",
      name: "이○○",
      scores: { career: 78, skill: 88, edu: 90, culture: 74 },
      skills: ["React", "TypeScript", "GraphQL", "Jest"],
      summary: "탄탄한 CS 기초와 테스트 문화를 갖춘 실무형 개발자입니다.",
      strengths: ["테스트 커버리지 관리 능숙", "컴퓨터공학 학사 전공 부합"],
      concerns: ["대규모 트래픽 서비스 경험 부족", "협업 리딩 경험 적음"],
    },
    {
      id: "f3",
      name: "박○○",
      scores: { career: 85, skill: 72, edu: 68, culture: 92 },
      skills: ["Vue", "React", "Figma", "접근성"],
      summary: "UX 감각과 협업 태도가 뛰어나나 주력 스택 전환 적응이 필요합니다.",
      strengths: ["디자이너와의 협업 강점", "웹 접근성 준수 경험"],
      concerns: ["주력이 Vue로 React 심화 경험 확인 필요"],
    },
    {
      id: "f4",
      name: "최○○",
      scores: { career: 64, skill: 70, edu: 85, culture: 80 },
      skills: ["React", "JavaScript", "Redux"],
      summary: "성장 잠재력은 있으나 요구 경력 대비 시니어리티가 부족합니다.",
      strengths: ["빠른 학습 속도", "긍정적 협업 태도"],
      concerns: ["경력 3년 미달", "TypeScript 실무 경험 부족"],
    },
    {
      id: "f5",
      name: "정○○",
      scores: { career: 88, skill: 60, edu: 74, culture: 66 },
      skills: ["Angular", "RxJS", "SCSS"],
      summary: "경력은 충분하나 요구 기술 스택과의 정합성이 낮습니다.",
      strengths: ["장기 프로젝트 유지보수 경험"],
      concerns: ["Angular 중심으로 스택 불일치", "최신 프론트 생태계 적응 필요"],
    },
  ],
  marketer: [
    {
      id: "m1",
      name: "한○○",
      scores: { career: 90, skill: 92, edu: 76, culture: 85 },
      skills: ["퍼포먼스", "GA4", "메타애즈", "그로스"],
      summary: "데이터 기반 퍼포먼스 마케팅 성과가 명확하게 검증된 후보입니다.",
      strengths: ["ROAS 220% 캠페인 리드", "GA4·메타 운영 능숙"],
      concerns: ["브랜드 캠페인 경험은 상대적으로 적음"],
    },
    {
      id: "m2",
      name: "오○○",
      scores: { career: 82, skill: 78, edu: 88, culture: 90 },
      skills: ["콘텐츠", "브랜드", "카피", "SNS"],
      summary: "브랜드 스토리텔링과 조직 적합도가 높은 콘텐츠형 마케터입니다.",
      strengths: ["바이럴 콘텐츠 다수 기획", "커뮤니케이션 역량 우수"],
      concerns: ["퍼포먼스 광고 최적화 경험 보강 필요"],
    },
    {
      id: "m3",
      name: "서○○",
      scores: { career: 74, skill: 84, edu: 70, culture: 78 },
      skills: ["구글애즈", "SEO", "GA4", "CRM"],
      summary: "채널 운영 폭이 넓고 실행력이 강한 실무형 마케터입니다.",
      strengths: ["멀티채널 운영 경험", "SEO 트래픽 성장 사례"],
      concerns: ["전략 기획 리딩 경험 다소 부족"],
    },
    {
      id: "m4",
      name: "윤○○",
      scores: { career: 60, skill: 66, edu: 82, culture: 88 },
      skills: ["콘텐츠", "SNS", "디자인"],
      summary: "성장 가능성은 높으나 요구 경력과 데이터 역량이 부족합니다.",
      strengths: ["감각적인 콘텐츠 제작", "높은 조직 적합도"],
      concerns: ["경력 3년 미달", "정량 지표 분석 경험 부족"],
    },
    {
      id: "m5",
      name: "임○○",
      scores: { career: 86, skill: 58, edu: 72, culture: 62 },
      skills: ["오프라인", "이벤트", "제휴"],
      summary: "경력은 충분하나 디지털 퍼포먼스 역량과의 정합성이 낮습니다.",
      strengths: ["대형 제휴·이벤트 운영 경험"],
      concerns: ["디지털 광고 운영 경험 부족", "데이터 도구 활용 미흡"],
    },
  ],
  analyst: [
    {
      id: "a1",
      name: "강○○",
      scores: { career: 88, skill: 94, edu: 90, culture: 80 },
      skills: ["SQL", "Python", "Tableau", "A/B테스트"],
      summary: "분석 스택 전반과 실험 설계 역량이 공고와 정확히 일치합니다.",
      strengths: ["A/B 테스트 프레임워크 구축", "통계 전공 기반 해석력"],
      concerns: ["도메인(리테일) 경험은 신규"],
    },
    {
      id: "a2",
      name: "조○○",
      scores: { career: 80, skill: 86, edu: 84, culture: 78 },
      skills: ["SQL", "Python", "Looker", "dbt"],
      summary: "데이터 파이프라인과 대시보드 설계에 강한 실무형 분석가입니다.",
      strengths: ["dbt 기반 모델링 경험", "대시보드 자동화 구축"],
      concerns: ["비즈니스 인사이트 발표 경험 보강 필요"],
    },
    {
      id: "a3",
      name: "신○○",
      scores: { career: 76, skill: 72, edu: 88, culture: 86 },
      skills: ["SQL", "R", "통계", "시각화"],
      summary: "통계적 엄밀성과 협업 태도가 뛰어난 리서치형 분석가입니다.",
      strengths: ["통계 모델링 강점", "명확한 리포팅 커뮤니케이션"],
      concerns: ["Python 실무 활용 경험 다소 부족"],
    },
    {
      id: "a4",
      name: "권○○",
      scores: { career: 62, skill: 74, edu: 80, culture: 82 },
      skills: ["SQL", "Python", "Excel"],
      summary: "잠재력은 있으나 요구 경력과 고급 분석 경험이 부족합니다.",
      strengths: ["빠른 쿼리 작성", "성실한 학습 태도"],
      concerns: ["경력 3년 미달", "실험 설계 경험 부족"],
    },
    {
      id: "a5",
      name: "황○○",
      scores: { career: 84, skill: 60, edu: 70, culture: 64 },
      skills: ["Excel", "SPSS", "리서치"],
      summary: "경력은 충분하나 코드 기반 분석 스택과의 정합성이 낮습니다.",
      strengths: ["설문·리서치 설계 경험"],
      concerns: ["SQL/Python 실무 경험 부족", "대용량 데이터 처리 미흡"],
    },
  ],
};

/* ---------- 점수 계산 (가중 합) ---------- */

function totalScore(scores: Record<CriKey, number>, weights: Record<CriKey, number>): number {
  const wSum = CRITERIA.reduce((s, c) => s + weights[c.key], 0) || 1;
  const raw = CRITERIA.reduce((s, c) => s + scores[c.key] * weights[c.key], 0);
  return Math.round(raw / wSum);
}

const RANK_STYLE: { bg: string; color: string }[] = [
  { bg: "linear-gradient(135deg,#f5d46b,#e0a83a)", color: "#5a3f00" },
  { bg: "linear-gradient(135deg,#dfe3ea,#b9c0cc)", color: "#40454f" },
  { bg: "linear-gradient(135deg,#e7c8a6,#cb9b6e)", color: "#5a3819" },
];

/* ---------- AI 실시간 평가 결과 병합용 ---------- */

type AiEval = {
  name: string;
  total: number;
  breakdown: { 경력: number; 기술: number; 학력: number; 문화적합: number };
  summary: string;
  recommend: "추천" | "보류";
  strengths: string[];
  concerns: string[];
};

type RankedCandidate = Candidate & {
  total: number;
  recommend?: "추천" | "보류";
};

export default function Demo() {
  const [role, setRole] = useState<RoleKey>("frontend");
  const [weights, setWeights] = useState<Record<CriKey, number>>(DEFAULT_WEIGHTS);
  const [loading, setLoading] = useState(false);
  const [ran, setRan] = useState(true); // 첫 렌더에서 결과 표시 (고정 시드)
  const [openId, setOpenId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0.82); // 고정 초기값 (hydration-safe)
  const [live, setLive] = useState(false); // 실시간 AI 평가 여부
  // AI 실시간 결과 (직무 이름 -> 평가). 없으면 로컬 결정론 스코어링으로 폴백.
  const [aiEvals, setAiEvals] = useState<Record<string, AiEval> | null>(null);

  const roleReq = ROLES.find((r) => r.key === role)!.req;

  const ranked = useMemo<RankedCandidate[]>(() => {
    return [...POOL[role]]
      .map((c) => {
        const ai = aiEvals?.[c.name];
        if (ai) {
          // 실시간 AI 점수/요약으로 카드 구성 (breakdown 바 · 상세 UI 유지)
          const scores: Record<CriKey, number> = {
            career: ai.breakdown.경력,
            skill: ai.breakdown.기술,
            edu: ai.breakdown.학력,
            culture: ai.breakdown.문화적합,
          };
          return {
            ...c,
            scores,
            summary: ai.summary || c.summary,
            strengths: ai.strengths?.length ? ai.strengths : c.strengths,
            concerns: ai.concerns?.length ? ai.concerns : c.concerns,
            total: ai.total,
            recommend: ai.recommend,
          } as RankedCandidate;
        }
        return { ...c, total: totalScore(c.scores, weights) } as RankedCandidate;
      })
      .sort((a, b) => b.total - a.total);
  }, [role, weights, aiEvals]);

  const avg = ranked.length
    ? Math.round(ranked.reduce((s, c) => s + c.total, 0) / ranked.length)
    : 0;
  const recommended = ranked.filter((c) => (c.recommend ? c.recommend === "추천" : c.total >= 80)).length;

  const run = async () => {
    setLoading(true);
    setRan(false);
    setOpenId(null);
    const t0 = typeof performance !== "undefined" ? performance.now() : 0;
    try {
      const res = await fetch("/api/lab/resume-screener", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job: ROLES.find((r) => r.key === role)!.name,
          requirements: roleReq,
          candidates: POOL[role].map((c) => ({
            name: c.name,
            skills: c.skills,
            summary: c.summary,
            strengths: c.strengths,
            concerns: c.concerns,
          })),
        }),
      });
      const data = await res.json();
      if (data.live && Array.isArray(data.evaluations) && data.evaluations.length) {
        const map: Record<string, AiEval> = {};
        for (const e of data.evaluations as AiEval[]) {
          if (e && typeof e.name === "string") map[e.name] = e;
        }
        setAiEvals(map);
        setLive(true);
      } else {
        setAiEvals(null);
        setLive(false);
      }
    } catch {
      setAiEvals(null);
      setLive(false);
    } finally {
      const t1 = typeof performance !== "undefined" ? performance.now() : 1000;
      setElapsed(Math.max(0.6, (t1 - t0) / 1000));
      setLoading(false);
      setRan(true);
    }
  };

  const changeRole = (r: RoleKey) => {
    if (r === role) return;
    setRole(r);
    setOpenId(null);
    setAiEvals(null); // 직무 변경 시 AI 결과 초기화 → 로컬 결정론 스코어링
    setLive(false);
    setRan(true); // 재스코어링 (결정론적)
  };

  const setWeight = (k: CriKey, v: number) => {
    setWeights((w) => ({ ...w, [k]: v }));
  };

  const applyPreset = (preset: "balanced" | "skill" | "career") => {
    if (preset === "balanced") setWeights({ career: 25, skill: 25, edu: 25, culture: 25 });
    else if (preset === "skill") setWeights({ career: 25, skill: 50, edu: 10, culture: 15 });
    else setWeights({ career: 50, skill: 25, edu: 10, culture: 15 });
  };

  const activePreset =
    weights.career === 25 && weights.skill === 25 && weights.edu === 25 && weights.culture === 25
      ? "balanced"
      : weights.career === 25 && weights.skill === 50 && weights.edu === 10 && weights.culture === 15
      ? "skill"
      : weights.career === 50 && weights.skill === 25 && weights.edu === 10 && weights.culture === 15
      ? "career"
      : "";

  const roleName = ROLES.find((r) => r.key === role)!.name;

  return (
    <div className="lx-win rs-win">
      {/* 실제 앱 툴바 */}
      <div className="lx-win__bar rs-bar">
        <div className="rs-brand">
          <span className="rs-brand__icon" aria-hidden>📋</span>
          <div className="rs-brand__text">
            <span className="rs-brand__title">이력서 스크리너</span>
            <span className="rs-brand__sub">ATS · AI 지원자 평가</span>
          </div>
        </div>
        <div className="rs-toolbar">
          <label className="rs-toolbar__field">
            <span className="rs-toolbar__label">직무</span>
            <select
              className="lx-select rs-toolbar__select"
              value={role}
              onChange={(e) => changeRole(e.target.value as RoleKey)}
              aria-label="모집 직무 선택"
            >
              {ROLES.map((r) => (
                <option key={r.key} value={r.key}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="lx-btn lx-btn--primary rs-toolbar__run"
            onClick={run}
            disabled={loading}
          >
            {loading ? "평가 중…" : "✦ 재평가"}
          </button>
          <span
            className={`lx-pill rs-livepill ${live ? "lx-pill--ok" : "lx-pill--muted"}`}
            title={live ? "Claude 실시간 평가 결과" : "로컬 샘플 스코어링"}
          >
            <i className={`rs-dot ${live ? "rs-dot--live" : ""}`} aria-hidden />
            {live ? "실시간 AI" : "샘플 모드"}
          </span>
        </div>
      </div>

      <div className="lx-win__body rs-body">
        <div className="rs-layout">
          {/* ── 왼쪽: 채용 공고 · 가중치 · 통계 ── */}
          <aside className="rs-side">
            <div className="lx-panel rs-panel">
              <div className="lx-h">
                채용 공고
                <span className="lx-sub">기준 변경 시 즉시 재계산</span>
              </div>

              <label className="lx-label">모집 직무</label>
              <select
                className="lx-select"
                value={role}
                onChange={(e) => changeRole(e.target.value as RoleKey)}
              >
                {ROLES.map((r) => (
                  <option key={r.key} value={r.key}>
                    {r.name}
                  </option>
                ))}
              </select>

              <label className="lx-label" style={{ marginTop: 14 }}>
                채용 요건
              </label>
              <textarea className="lx-textarea rs-req" value={roleReq} readOnly />
            </div>

            <div className="lx-panel rs-panel">
              <div className="lx-h">
                평가 가중치
                <span className="lx-sub">합계 {weights.career + weights.skill + weights.edu + weights.culture}%</span>
              </div>

              <div className="rs-weights">
                {CRITERIA.map((c) => (
                  <div key={c.key} className="rs-weight">
                    <div className="rs-weight__head">
                      <span className="rs-weight__label">
                        <i className="rs-swatch" style={{ background: c.color }} aria-hidden />
                        {c.label}
                      </span>
                      <b className="lx-mono rs-weight__val">{weights[c.key]}%</b>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={60}
                      step={1}
                      value={weights[c.key]}
                      onChange={(e) => setWeight(c.key, Number(e.target.value))}
                      className="rs-range"
                      style={{ accentColor: c.color }}
                      aria-label={`${c.label} 가중치`}
                    />
                  </div>
                ))}
              </div>

              <div className="rs-presets">
                <button
                  type="button"
                  className={`lx-toggle ${activePreset === "balanced" ? "is-on" : ""}`}
                  onClick={() => applyPreset("balanced")}
                >
                  균형
                </button>
                <button
                  type="button"
                  className={`lx-toggle ${activePreset === "skill" ? "is-on" : ""}`}
                  onClick={() => applyPreset("skill")}
                >
                  기술 중시
                </button>
                <button
                  type="button"
                  className={`lx-toggle ${activePreset === "career" ? "is-on" : ""}`}
                  onClick={() => applyPreset("career")}
                >
                  경력 중시
                </button>
              </div>

              <button
                type="button"
                className="lx-btn lx-btn--primary rs-runwide"
                onClick={run}
                disabled={loading}
              >
                {loading ? "평가 중…" : "✦ 지원서 일괄 평가"}
              </button>
            </div>
          </aside>

          {/* ── 오른쪽: 통계 + 후보 목록 ── */}
          <section className="rs-main">
            <div className="rs-stats">
              <div className="lx-stat rs-stat">
                <span className="lx-stat__label">지원자</span>
                <span className="lx-stat__value">{ranked.length}<em className="rs-unit">명</em></span>
              </div>
              <div className="lx-stat rs-stat">
                <span className="lx-stat__label">평균 점수</span>
                <span className="lx-stat__value">{loading ? "…" : avg}</span>
              </div>
              <div className="lx-stat rs-stat">
                <span className="lx-stat__label">추천 인원</span>
                <span className="lx-stat__value" style={{ color: "var(--color-dusk-violet)" }}>
                  {loading ? "…" : recommended}<em className="rs-unit">명</em>
                </span>
              </div>
              <div className="lx-stat rs-stat">
                <span className="lx-stat__label">처리 시간</span>
                <span className="lx-stat__value lx-mono">{loading ? "…" : `${elapsed.toFixed(2)}s`}</span>
              </div>
            </div>

            <div className="rs-list-head">
              <span className="lx-h" style={{ margin: 0 }}>지원자 순위</span>
              <span className="lx-sub">
                {roleName} · 가중 종합 점수 기준 정렬
              </span>
            </div>

            {/* 로딩 스켈레톤 */}
            {loading && (
              <div className="rs-list">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="lx-card rs-cand rs-cand--skel">
                    <div className="rs-cand__top">
                      <div className="lx-skel" style={{ height: 40, width: 40, borderRadius: 10 }} />
                      <div style={{ flex: 1 }}>
                        <div className="lx-skel" style={{ height: 14, width: "34%", marginBottom: 9 }} />
                        <div className="lx-skel" style={{ height: 10, marginBottom: 7 }} />
                        <div className="lx-skel" style={{ height: 10, width: "72%" }} />
                      </div>
                      <div className="lx-skel" style={{ height: 42, width: 54, borderRadius: 8 }} />
                    </div>
                    <div className="rs-bars">
                      {CRITERIA.map((cr) => (
                        <div key={cr.key} className="lx-skel" style={{ height: 30, borderRadius: 7 }} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 빈 상태 */}
            {!loading && ran && ranked.length === 0 && (
              <div className="rs-empty">
                <div className="rs-empty__icon" aria-hidden>🗂️</div>
                <p className="rs-empty__title">평가할 지원자가 없습니다</p>
                <p className="rs-empty__sub">직무를 선택하고 일괄 평가를 실행해 주세요.</p>
              </div>
            )}

            {/* 후보 목록 */}
            {!loading && ran && ranked.length > 0 && (
              <div className="rs-list">
                {ranked.map((c, idx) => {
                  const rankStyle = RANK_STYLE[idx];
                  const isOpen = openId === c.id;
                  const isRec = c.recommend ? c.recommend === "추천" : c.total >= 80;
                  return (
                    <div
                      key={c.id}
                      className={`lx-card rs-cand ${isOpen ? "is-open" : ""} ${isRec ? "is-rec" : ""}`}
                      onClick={() => setOpenId((o) => (o === c.id ? null : c.id))}
                    >
                      <div className="rs-cand__top">
                        {/* 순위 배지 */}
                        <span
                          className="rs-rank"
                          style={
                            rankStyle
                              ? { background: rankStyle.bg, color: rankStyle.color }
                              : { background: "var(--color-tint)", color: "var(--color-slate)" }
                          }
                        >
                          {idx + 1}
                        </span>

                        {/* 이름 + 요약 */}
                        <div className="rs-cand__info">
                          <div className="rs-cand__name">
                            <b>{c.name}</b>
                            <span className={`lx-pill ${isRec ? "lx-pill--ok" : "lx-pill--warn"}`}>
                              {isRec ? "추천" : "보류"}
                            </span>
                          </div>
                          <p className="rs-cand__summary">{c.summary}</p>
                        </div>

                        {/* 총점 도넛 */}
                        <div className="rs-score">
                          <div
                            className="rs-score__ring"
                            style={{
                              background: `conic-gradient(${isRec ? "var(--color-dusk-violet)" : "#9aa0b4"} ${c.total * 3.6}deg, var(--color-tint) 0deg)`,
                            }}
                          >
                            <div className="rs-score__inner">
                              <span
                                className="lx-mono rs-score__num"
                                style={{ color: isRec ? "var(--color-dusk-violet)" : "var(--color-ink)" }}
                              >
                                {c.total}
                              </span>
                            </div>
                          </div>
                          <span className="rs-score__cap">종합점수</span>
                        </div>
                      </div>

                      {/* 기준별 breakdown 바 */}
                      <div className="rs-bars">
                        {CRITERIA.map((cr) => (
                          <div key={cr.key} className="rs-bar">
                            <div className="rs-bar__head">
                              <span className="rs-bar__label">{cr.label}</span>
                              <b className="lx-mono rs-bar__val">{c.scores[cr.key]}</b>
                            </div>
                            <div className="lx-track rs-bar__track">
                              <span
                                className="lx-fill"
                                style={{ width: `${c.scores[cr.key]}%`, background: cr.color }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* 스킬 칩 */}
                      <div className="rs-chips">
                        {c.skills.map((s) => (
                          <span key={s} className="lx-pill lx-pill--muted rs-chip">
                            {s}
                          </span>
                        ))}
                        <span className="rs-toggle-detail">
                          {isOpen ? "접기 ▲" : "상세 보기 ▼"}
                        </span>
                      </div>

                      {/* 상세 */}
                      {isOpen && (
                        <div
                          className="lx-card lx-card--tint rs-detail"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="rs-detail__cols">
                            <div>
                              <div className="lx-label rs-detail__title rs-detail__title--good">강점</div>
                              <ul className="rs-detail__list">
                                {c.strengths.map((s, i) => (
                                  <li key={i}>{s}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <div className="lx-label rs-detail__title rs-detail__title--warn">우려 사항</div>
                              <ul className="rs-detail__list">
                                {c.concerns.map((s, i) => (
                                  <li key={i}>{s}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          <div className="rs-detail__foot">
                            <span className="lx-label" style={{ margin: 0 }}>추천 여부</span>
                            <span className={`lx-pill ${isRec ? "lx-pill--ok" : "lx-pill--warn"}`}>
                              {isRec ? "✓ 면접 추천" : "△ 보류 / 추가 검토"}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      <style jsx>{`
        .rs-win { display: flex; flex-direction: column; }

        /* ── 툴바 ── */
        .rs-bar {
          min-height: 58px;
          background: linear-gradient(180deg, #ffffff, #fbfbfe);
        }
        .rs-brand { display: flex; align-items: center; gap: 11px; min-width: 0; }
        .rs-brand__icon {
          display: inline-flex; align-items: center; justify-content: center;
          width: 34px; height: 34px; font-size: 17px; border-radius: 9px;
          background: var(--color-violet-soft); flex: none;
        }
        .rs-brand__text { display: flex; flex-direction: column; line-height: 1.15; min-width: 0; }
        .rs-brand__title { font-family: var(--font-geist); font-weight: 800; font-size: 14.5px; color: var(--color-ink); }
        .rs-brand__sub { font-size: 11px; color: var(--color-slate); }

        .rs-toolbar { display: flex; align-items: center; gap: 10px; flex: 0 0 auto; }
        .rs-toolbar__field { display: flex; align-items: center; gap: 7px; }
        .rs-toolbar__label { font-size: 12px; font-weight: 600; color: var(--color-slate); }
        .rs-toolbar__select {
          width: auto; padding: 8px 30px 8px 12px; font-size: 13px; font-weight: 600;
          border-radius: 9px;
        }
        .rs-toolbar__run { padding: 9px 16px; font-size: 13px; }

        .rs-livepill {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 11px; padding: 5px 11px;
        }
        .rs-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--color-slate); flex: none; }
        .rs-dot--live { background: #1f9d57; box-shadow: 0 0 0 0 rgba(31,157,87,0.5); animation: rs-pulse 1.8s infinite; }
        @keyframes rs-pulse {
          0% { box-shadow: 0 0 0 0 rgba(31,157,87,0.5); }
          70% { box-shadow: 0 0 0 6px rgba(31,157,87,0); }
          100% { box-shadow: 0 0 0 0 rgba(31,157,87,0); }
        }

        /* ── 레이아웃 ── */
        .rs-body { padding: 18px; background: var(--color-tint); }
        .rs-layout { display: grid; grid-template-columns: 340px minmax(0, 1fr); gap: 18px; align-items: start; }
        .rs-side { display: flex; flex-direction: column; gap: 14px; position: sticky; top: 66px; }
        .rs-panel { padding: 16px; }
        .rs-req { min-height: 96px; font-size: 12.5px; line-height: 1.55; background: var(--color-tint); }

        /* 가중치 */
        .rs-weights { display: flex; flex-direction: column; gap: 13px; }
        .rs-weight__head { display: flex; justify-content: space-between; align-items: center; font-size: 12.5px; margin-bottom: 6px; }
        .rs-weight__label { display: inline-flex; align-items: center; gap: 7px; font-weight: 600; color: var(--color-ash); }
        .rs-swatch { width: 9px; height: 9px; border-radius: 3px; display: inline-block; }
        .rs-weight__val { color: var(--color-ink); font-size: 12.5px; }
        .rs-range { width: 100%; cursor: pointer; }
        .rs-presets { display: flex; gap: 7px; flex-wrap: wrap; margin-top: 14px; }
        .rs-runwide { width: 100%; margin-top: 14px; }

        /* 통계 */
        .rs-main { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
        .rs-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .rs-stat { padding: 13px 15px; }
        .rs-stat .lx-stat__value { font-size: 24px; }
        .rs-unit { font-size: 13px; font-weight: 600; font-style: normal; color: var(--color-slate); margin-left: 2px; }

        .rs-list-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding: 2px 2px; }

        /* 후보 리스트 */
        .rs-list { display: flex; flex-direction: column; gap: 12px; }
        .rs-cand { padding: 16px; transition: box-shadow .18s ease, border-color .18s ease, transform .18s ease; cursor: pointer; }
        .rs-cand:hover { border-color: var(--color-hairline-strong); box-shadow: 0 12px 26px -20px rgba(20,20,50,0.3); transform: translateY(-1px); }
        .rs-cand.is-open { border-color: rgba(107,98,242,0.5); box-shadow: 0 12px 30px -20px rgba(107,98,242,0.5); }
        .rs-cand.is-rec { border-left: 3px solid var(--color-dusk-violet); }
        .rs-cand--skel { cursor: default; }

        .rs-cand__top { display: flex; gap: 14px; align-items: center; }
        .rs-rank {
          display: inline-flex; align-items: center; justify-content: center;
          width: 40px; height: 40px; flex: none;
          font-family: var(--font-geist); font-weight: 800; font-size: 17px;
          border-radius: 11px;
        }
        .rs-cand__info { flex: 1; min-width: 0; }
        .rs-cand__name { display: flex; align-items: center; gap: 8px; }
        .rs-cand__name b { font-family: var(--font-geist); font-size: 15.5px; color: var(--color-ink); }
        .rs-cand__summary { margin: 5px 0 0; font-size: 12.5px; line-height: 1.5; color: var(--color-slate); }

        .rs-score { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: none; }
        .rs-score__ring {
          width: 56px; height: 56px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
        }
        .rs-score__inner {
          width: 44px; height: 44px; border-radius: 50%; background: #fff;
          display: flex; align-items: center; justify-content: center;
        }
        .rs-score__num { font-family: var(--font-geist); font-weight: 800; font-size: 19px; line-height: 1; }
        .rs-score__cap { font-size: 10px; color: var(--color-slate); }

        /* breakdown 바 */
        .rs-bars { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 14px; }
        .rs-bar__head { display: flex; justify-content: space-between; align-items: baseline; font-size: 11px; margin-bottom: 5px; }
        .rs-bar__label { color: var(--color-slate); }
        .rs-bar__val { color: var(--color-ink); font-size: 12px; }
        .rs-bar__track { height: 7px; }

        /* 칩 */
        .rs-chips { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; margin-top: 14px; }
        .rs-chip { font-size: 11px; }
        .rs-toggle-detail { margin-left: auto; font-size: 11.5px; font-weight: 600; color: var(--color-dusk-violet); }

        /* 상세 */
        .rs-detail { margin-top: 13px; padding: 15px; cursor: default; }
        .rs-detail__cols { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .rs-detail__title { margin-bottom: 8px; }
        .rs-detail__title--good { color: #1f9d57; }
        .rs-detail__title--warn { color: #c98a12; }
        .rs-detail__list { margin: 0; padding-left: 17px; font-size: 12.5px; color: var(--color-ash); line-height: 1.7; }
        .rs-detail__foot {
          display: flex; align-items: center; gap: 10px; margin-top: 14px; padding-top: 12px;
          border-top: 1px solid var(--color-hairline);
        }

        /* 빈 상태 */
        .rs-empty {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          text-align: center; gap: 6px; padding: 60px 20px;
          background: #fff; border: 1px dashed var(--color-hairline-strong); border-radius: 12px;
        }
        .rs-empty__icon { font-size: 34px; }
        .rs-empty__title { margin: 4px 0 0; font-family: var(--font-geist); font-weight: 700; font-size: 15px; color: var(--color-ink); }
        .rs-empty__sub { margin: 0; font-size: 12.5px; color: var(--color-slate); }

        /* ── 반응형 ── */
        @media (max-width: 900px) {
          .rs-layout { grid-template-columns: 1fr; }
          .rs-side { position: static; }
        }
        @media (max-width: 620px) {
          .rs-bars { grid-template-columns: repeat(2, 1fr); }
          .rs-stats { grid-template-columns: repeat(2, 1fr); }
          .rs-toolbar__field { display: none; }
          .rs-detail__cols { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
