"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

/* =========================================================
   타입 & 목 데이터 (고정 시드 — 하이드레이션 안전)
   ========================================================= */
type Category = "CS·고객응대" | "마케팅" | "데이터·리포트" | "영업·CRM" | "개발";

type NodeTile = { label: string; icon: string; color: string };

type Template = {
  id: string;
  title: string;
  desc: string;
  category: Category;
  tags: string[];
  imports: string; // 예: "1.2k"
  nodes: NodeTile[]; // 미니 노드 다이어그램 (2~4개)
  steps: string[]; // 상세 모달 단계
};

const CATS: Category[] = ["CS·고객응대", "마케팅", "데이터·리포트", "영업·CRM", "개발"];

// 색상 팔레트 (노드 아이콘 타일)
const C = {
  form: "#6b62f2",
  slack: "#4a154b",
  notion: "#111111",
  sheet: "#22a565",
  gpt: "#10a37f",
  mail: "#ea4335",
  db: "#2f6bd6",
  crm: "#f2802b",
  git: "#f05133",
  webhook: "#c98a12",
  schedule: "#7a5cf0",
};

const TEMPLATES: Template[] = [
  {
    id: "lead-slack",
    title: "신규 리드 → Slack 알림",
    desc: "웹폼으로 새 리드가 들어오면 담당 채널에 즉시 알림을 보냅니다.",
    category: "영업·CRM",
    tags: ["Webhook", "Slack", "리드"],
    imports: "1.2k",
    nodes: [
      { label: "웹폼", icon: "📝", color: C.form },
      { label: "정제", icon: "⚙", color: C.gpt },
      { label: "Slack", icon: "#", color: C.slack },
    ],
    steps: [
      "웹폼(또는 랜딩) 제출을 Webhook 트리거로 수신",
      "이름·연락처·회사 필드를 정규화하고 중복 리드 확인",
      "담당 영업 채널로 Slack 메시지 전송 (버튼 포함)",
      "CRM에 리드 레코드 자동 생성",
    ],
  },
  {
    id: "form-notion",
    title: "폼 응답 → Notion 저장",
    desc: "구글폼/타입폼 응답을 Notion 데이터베이스에 자동 정리합니다.",
    category: "데이터·리포트",
    tags: ["Form", "Notion", "정리"],
    imports: "980",
    nodes: [
      { label: "폼", icon: "🧾", color: C.form },
      { label: "매핑", icon: "⚙", color: C.gpt },
      { label: "Notion", icon: "N", color: C.notion },
    ],
    steps: [
      "폼 제출 이벤트를 트리거로 수신",
      "응답 항목을 Notion 속성에 매핑",
      "태그·상태를 규칙에 따라 자동 분류",
      "Notion 데이터베이스에 새 페이지 생성",
    ],
  },
  {
    id: "daily-sales",
    title: "매일 매출 리포트 자동 발송",
    desc: "매일 아침 시트 데이터를 집계해 요약 리포트를 메일로 보냅니다.",
    category: "데이터·리포트",
    tags: ["Schedule", "Sheets", "Email"],
    imports: "2.4k",
    nodes: [
      { label: "매일 8시", icon: "⏰", color: C.schedule },
      { label: "시트", icon: "▦", color: C.sheet },
      { label: "요약", icon: "✦", color: C.gpt },
      { label: "메일", icon: "✉", color: C.mail },
    ],
    steps: [
      "매일 오전 8시 스케줄 트리거 실행",
      "구글 시트에서 전일 매출 데이터 조회",
      "채널별·전일 대비 증감을 자동 집계",
      "AI로 3줄 요약 생성 후 리포트 메일 발송",
    ],
  },
  {
    id: "cs-triage",
    title: "고객 문의 자동 분류 → 담당 배정",
    desc: "들어온 문의를 유형별로 분류하고 담당자에게 자동 배정합니다.",
    category: "CS·고객응대",
    tags: ["GPT", "분류", "Slack"],
    imports: "1.6k",
    nodes: [
      { label: "문의", icon: "💬", color: C.webhook },
      { label: "AI 분류", icon: "🤖", color: C.gpt },
      { label: "배정", icon: "#", color: C.slack },
    ],
    steps: [
      "문의 인입(메일/채팅/폼)을 트리거로 수신",
      "AI가 문의 유형(환불·배송·기술 등) 분류",
      "우선순위·감정 점수 산출",
      "담당 팀 채널로 라우팅 및 티켓 생성",
    ],
  },
  {
    id: "review-reply",
    title: "리뷰 감성분석 → 자동 응대 초안",
    desc: "신규 리뷰의 긍·부정을 판별하고 응대 초안을 만들어 알립니다.",
    category: "CS·고객응대",
    tags: ["리뷰", "GPT", "Notion"],
    imports: "740",
    nodes: [
      { label: "리뷰", icon: "★", color: C.crm },
      { label: "감성분석", icon: "🤖", color: C.gpt },
      { label: "초안", icon: "N", color: C.notion },
    ],
    steps: [
      "신규 리뷰 수집 (스토어/플랫폼 API)",
      "AI 감성분석으로 긍정·부정·중립 판별",
      "부정 리뷰는 응대 초안 자동 작성",
      "담당자 검수용으로 Notion에 정리",
    ],
  },
  {
    id: "campaign-utm",
    title: "광고 성과 수집 → 주간 마케팅 리포트",
    desc: "채널별 광고 지표를 모아 주간 성과 리포트를 자동 생성합니다.",
    category: "마케팅",
    tags: ["Ads", "Sheets", "리포트"],
    imports: "1.1k",
    nodes: [
      { label: "매주 월", icon: "⏰", color: C.schedule },
      { label: "광고 API", icon: "📈", color: C.db },
      { label: "집계", icon: "▦", color: C.sheet },
      { label: "리포트", icon: "✉", color: C.mail },
    ],
    steps: [
      "매주 월요일 스케줄 트리거 실행",
      "광고 채널 API에서 지표(노출·클릭·전환) 수집",
      "CAC·ROAS 자동 계산 및 시트 누적",
      "주간 요약 리포트를 팀에 발송",
    ],
  },
  {
    id: "content-repurpose",
    title: "블로그 발행 → SNS 자동 리퍼포징",
    desc: "새 글이 올라오면 채널별 톤으로 변환해 예약 발행합니다.",
    category: "마케팅",
    tags: ["RSS", "GPT", "SNS"],
    imports: "860",
    nodes: [
      { label: "RSS", icon: "📰", color: C.webhook },
      { label: "리라이팅", icon: "🤖", color: C.gpt },
      { label: "예약", icon: "✦", color: C.crm },
    ],
    steps: [
      "블로그 RSS 신규 글을 트리거로 감지",
      "AI로 채널별(LinkedIn·X·Threads) 톤 변환",
      "해시태그·요약 자동 생성",
      "예약 발행 큐에 등록",
    ],
  },
  {
    id: "pr-review",
    title: "GitHub PR → AI 리뷰 코멘트",
    desc: "새 PR이 열리면 변경점을 요약하고 리뷰 코멘트를 자동으로 답니다.",
    category: "개발",
    tags: ["GitHub", "GPT", "Webhook"],
    imports: "1.9k",
    nodes: [
      { label: "PR 오픈", icon: "", color: C.git },
      { label: "diff 분석", icon: "🤖", color: C.gpt },
      { label: "코멘트", icon: "", color: C.git },
    ],
    steps: [
      "GitHub PR 오픈 Webhook 수신",
      "변경 파일 diff를 AI로 분석·요약",
      "잠재 이슈·개선점 코멘트 초안 작성",
      "PR에 리뷰 코멘트 자동 게시",
    ],
  },
];

/* =========================================================
   미니 노드 다이어그램 (인라인 SVG)
   ========================================================= */
function NodeDiagram({ nodes, large = false }: { nodes: NodeTile[]; large?: boolean }) {
  const n = nodes.length;
  const boxW = large ? 118 : 82;
  const boxH = large ? 54 : 42;
  const gap = large ? 34 : 20;
  const padX = large ? 14 : 8;
  const padY = large ? 12 : 8;
  const W = padX * 2 + n * boxW + (n - 1) * gap;
  const H = padY * 2 + boxH;
  const tile = large ? 26 : 20;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      style={{ maxWidth: W, height: "auto", display: "block" }}
      role="img"
      aria-label="워크플로우 노드 다이어그램"
    >
      {/* 연결선 */}
      {nodes.slice(0, -1).map((_, i) => {
        const x1 = padX + i * (boxW + gap) + boxW;
        const x2 = padX + (i + 1) * (boxW + gap);
        const y = padY + boxH / 2;
        return (
          <g key={`c${i}`}>
            <line x1={x1} y1={y} x2={x2} y2={y} stroke="#c9c9dc" strokeWidth={large ? 2 : 1.5} />
            <polygon
              points={`${x2},${y} ${x2 - (large ? 8 : 6)},${y - (large ? 4 : 3)} ${x2 - (large ? 8 : 6)},${y + (large ? 4 : 3)}`}
              fill="#c9c9dc"
            />
          </g>
        );
      })}
      {/* 노드 박스 */}
      {nodes.map((node, i) => {
        const x = padX + i * (boxW + gap);
        const y = padY;
        return (
          <g key={`n${i}`}>
            <rect
              x={x}
              y={y}
              width={boxW}
              height={boxH}
              rx={large ? 12 : 9}
              fill="#ffffff"
              stroke="#e2e2ef"
              strokeWidth="1.5"
            />
            <rect x={x + (large ? 9 : 6)} y={y + (boxH - tile) / 2} width={tile} height={tile} rx={large ? 7 : 5} fill={node.color} />
            <text
              x={x + (large ? 9 : 6) + tile / 2}
              y={y + boxH / 2}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={large ? 13 : 10}
              fill="#ffffff"
              fontWeight="700"
            >
              {node.icon}
            </text>
            <text
              x={x + (large ? 9 : 6) + tile + (large ? 9 : 6)}
              y={y + boxH / 2}
              dominantBaseline="central"
              fontSize={large ? 12.5 : 9.5}
              fill="#45455a"
              fontWeight="600"
            >
              {node.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* =========================================================
   상세 모달
   ========================================================= */
function DetailModal({
  tpl,
  imported,
  onImport,
  onClose,
}: {
  tpl: Template;
  imported: boolean;
  onImport: () => void;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div className="n8t-overlay" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={tpl.title}
        onClick={(e) => e.stopPropagation()}
        className="n8t-modal"
      >
        {/* 헤더 */}
        <div className="n8t-modal__head">
          <div>
            <span className="lx-pill lx-pill--info" style={{ marginBottom: 8 }}>
              {tpl.category}
            </span>
            <h3 className="n8t-modal__title">{tpl.title}</h3>
            <p className="n8t-modal__desc">{tpl.desc}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="lx-btn lx-btn--ghost n8t-modal__x"
          >
            ✕
          </button>
        </div>

        {/* 큰 다이어그램 */}
        <div className="n8t-modal__diagram">
          <span className="n8t-diagram__cap">워크플로우 미리보기</span>
          <div className="n8t-diagram__frame">
            <NodeDiagram nodes={tpl.nodes} large />
          </div>
        </div>

        {/* 단계 리스트 */}
        <div style={{ padding: "18px 20px 0" }}>
          <div className="lx-label">워크플로우 단계</div>
          <ol className="n8t-steps">
            {tpl.steps.map((s, i) => (
              <li key={i} className="n8t-steps__item">
                <span className="n8t-steps__num">{i + 1}</span>
                <span className="n8t-steps__text">{s}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* 태그 */}
        <div className="n8t-modal__tags">
          {tpl.tags.map((t) => (
            <span key={t} className="lx-pill lx-pill--muted">
              {t}
            </span>
          ))}
        </div>

        {/* 푸터 */}
        <div className="n8t-modal__foot">
          <span className="lx-muted" style={{ fontSize: 12.5, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <DownloadIcon /> {tpl.imports} 임포트
          </span>
          <button
            type="button"
            className={`lx-btn ${imported ? "lx-btn--ghost" : "lx-btn--primary"}`}
            onClick={onImport}
            disabled={imported}
          >
            {imported ? "임포트됨 ✓" : "임포트"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* 작은 인라인 아이콘 (다운로드/임포트) */
function DownloadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ display: "block" }}>
      <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="m20 20-3.2-3.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* =========================================================
   메인 데모
   ========================================================= */
export default function Demo() {
  const [cat, setCat] = useState<"전체" | Category>("전체");
  const [query, setQuery] = useState("");
  const [imported, setImported] = useState<Record<string, boolean>>({});
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TEMPLATES.filter((t) => {
      const catOk = cat === "전체" || t.category === cat;
      const qOk = q === "" || t.title.toLowerCase().includes(q);
      return catOk && qOk;
    });
  }, [cat, query]);

  const markImported = (id: string) => setImported((s) => ({ ...s, [id]: true }));

  const importedCount = Object.values(imported).filter(Boolean).length;

  const openTpl = openId ? TEMPLATES.find((t) => t.id === openId) ?? null : null;

  return (
    <div className="lx-win n8t-win">
      <style>{SCOPED_CSS}</style>

      {/* 앱 툴바 */}
      <div className="lx-win__bar n8t-bar">
        <div className="lx-win__title n8t-bar__title">
          <span className="n8t-bar__logo" aria-hidden="true">n8</span>
          <span>템플릿 갤러리</span>
          <span className="n8t-bar__sub">Workflow Templates</span>
        </div>
        <div className="n8t-bar__right">
          <span className="n8t-bar__stat">
            <span className="n8t-bar__stat-n">{TEMPLATES.length}</span> 템플릿
          </span>
          <span className="n8t-bar__mine">
            <DownloadIcon />
            내 워크플로우 <b>{importedCount}</b>
          </span>
        </div>
      </div>

      <div className="lx-win__body n8t-body">
        {/* 히어로 / 서브 헤더 */}
        <div className="n8t-hero">
          <div>
            <h1 className="n8t-hero__h">바로 가져다 쓰는 자동화 레시피</h1>
            <p className="n8t-hero__p">검증된 n8n 워크플로우를 검색하고 원클릭으로 임포트하세요.</p>
          </div>
          <div className="n8t-hero__badges">
            <span className="n8t-hero__badge"><b>10.7k+</b> 누적 임포트</span>
            <span className="n8t-hero__badge"><b>{CATS.length}</b> 카테고리</span>
          </div>
        </div>

        {/* 스티키 툴바: 검색 + 카테고리 칩 + 결과 수 */}
        <div className="n8t-toolbar">
          <div className="n8t-toolbar__top">
            <div className="n8t-search">
              <span className="n8t-search__icon"><SearchIcon /></span>
              <input
                className="lx-input n8t-search__input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="템플릿 검색 — 리포트, Slack, 리드…"
                aria-label="템플릿 검색"
              />
              {query && (
                <button
                  type="button"
                  className="n8t-search__clear"
                  onClick={() => setQuery("")}
                  aria-label="검색어 지우기"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="n8t-count" aria-live="polite">
              <b>{filtered.length}</b>개 결과
            </div>
          </div>

          <div className="n8t-chips" role="tablist" aria-label="카테고리">
            {(["전체", ...CATS] as const).map((c) => (
              <button
                key={c}
                type="button"
                role="tab"
                aria-selected={cat === c}
                className={`lx-toggle n8t-chip${cat === c ? " is-on" : ""}`}
                onClick={() => setCat(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* 카드 그리드 */}
        {filtered.length > 0 ? (
          <div className="n8t-grid">
            {filtered.map((t) => {
              const done = !!imported[t.id];
              return (
                <div
                  key={t.id}
                  className={`lx-card n8t-card${done ? " is-imported" : ""}`}
                  onClick={() => setOpenId(t.id)}
                  role="button"
                  tabIndex={0}
                  aria-label={`${t.title} 상세 보기`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setOpenId(t.id);
                    }
                  }}
                >
                  {done && <span className="n8t-card__ribbon">임포트됨</span>}

                  {/* 미니 다이어그램 */}
                  <div className="n8t-card__diagram">
                    <NodeDiagram nodes={t.nodes} />
                  </div>

                  <div className="n8t-card__catrow">
                    <span className="lx-pill lx-pill--muted">{t.category}</span>
                  </div>
                  <b className="n8t-card__title">{t.title}</b>
                  <p className="n8t-card__desc">{t.desc}</p>

                  <div className="n8t-card__tags">
                    {t.tags.map((tag) => (
                      <span key={tag} className="n8t-tag">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="n8t-card__foot">
                    <span className="lx-muted n8t-card__imports">
                      <DownloadIcon /> {t.imports}
                    </span>
                    <button
                      type="button"
                      className={`lx-btn ${done ? "lx-btn--ghost" : "lx-btn--primary"} n8t-card__cta`}
                      disabled={done}
                      onClick={(e) => {
                        e.stopPropagation();
                        markImported(t.id);
                      }}
                    >
                      {done ? "임포트됨 ✓" : "원클릭 임포트"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="n8t-empty">
            <div className="n8t-empty__icon" aria-hidden="true">
              <SearchIcon />
            </div>
            <p className="n8t-empty__title">조건에 맞는 템플릿이 없습니다</p>
            <p className="n8t-empty__sub">다른 카테고리나 검색어를 시도해 보세요.</p>
            {(query || cat !== "전체") && (
              <button
                type="button"
                className="lx-btn lx-btn--ghost"
                onClick={() => {
                  setQuery("");
                  setCat("전체");
                }}
              >
                필터 초기화
              </button>
            )}
          </div>
        )}
      </div>

      {openTpl && (
        <DetailModal
          tpl={openTpl}
          imported={!!imported[openTpl.id]}
          onImport={() => markImported(openTpl.id)}
          onClose={() => setOpenId(null)}
        />
      )}
    </div>
  );
}

/* =========================================================
   스코프 스타일 (이 데모 전용 — 공유 파일 미변경)
   ========================================================= */
const SCOPED_CSS = `
.n8t-win { display: flex; flex-direction: column; }

/* ---- 툴바 ---- */
.n8t-bar {
  padding: 0 18px; min-height: 54px;
  background: linear-gradient(180deg, #ffffff, #fbfbff);
}
.n8t-bar__title { gap: 10px; }
.n8t-bar__logo {
  display: inline-flex; align-items: center; justify-content: center;
  width: 26px; height: 26px; border-radius: 8px;
  background: linear-gradient(135deg, #6b62f2, #8f7bff);
  color: #fff; font-family: var(--font-geist); font-weight: 800; font-size: 12px;
  box-shadow: 0 4px 12px -4px rgba(107,98,242,0.6);
}
.n8t-bar__sub {
  font-family: var(--font-dm-sans); font-weight: 500; font-size: 11.5px;
  color: var(--color-slate); border-left: 1px solid var(--color-hairline-strong);
  padding-left: 10px; margin-left: 2px;
}
.n8t-bar__right { display: flex; align-items: center; gap: 12px; }
.n8t-bar__stat { font-size: 12px; color: var(--color-slate); }
.n8t-bar__stat-n { font-family: var(--font-geist); font-weight: 800; color: var(--color-ink); }
.n8t-bar__mine {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 12px; color: var(--color-ash);
  background: var(--color-violet-soft); border: 1px solid rgba(107,98,242,0.28);
  border-radius: 20px; padding: 5px 11px;
}
.n8t-bar__mine b { color: var(--color-dusk-violet); font-family: var(--font-geist); }

/* ---- body ---- */
.n8t-body { padding: 20px 22px 26px; background: var(--color-tint); }

/* ---- 히어로 ---- */
.n8t-hero {
  display: flex; align-items: flex-end; justify-content: space-between; gap: 16px;
  flex-wrap: wrap; margin-bottom: 18px;
}
.n8t-hero__h {
  margin: 0; font-family: var(--font-geist); font-weight: 800;
  font-size: 21px; letter-spacing: -0.02em; color: var(--color-ink);
}
.n8t-hero__p { margin: 6px 0 0; font-size: 13.5px; color: var(--color-ash); }
.n8t-hero__badges { display: flex; gap: 8px; flex-wrap: wrap; }
.n8t-hero__badge {
  font-size: 12px; color: var(--color-ash); background: #fff;
  border: 1px solid var(--color-hairline); border-radius: 20px; padding: 6px 12px;
}
.n8t-hero__badge b { color: var(--color-ink); font-family: var(--font-geist); }

/* ---- 스티키 툴바 ---- */
.n8t-toolbar {
  position: sticky; top: 0; z-index: 20;
  background: rgba(245,245,251,0.86);
  -webkit-backdrop-filter: saturate(1.4) blur(8px);
  backdrop-filter: saturate(1.4) blur(8px);
  padding: 12px 0 14px; margin: 0 0 4px;
  border-bottom: 1px solid var(--color-hairline);
}
.n8t-toolbar__top { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.n8t-search { position: relative; flex: 1; min-width: 0; }
.n8t-search__icon {
  position: absolute; left: 13px; top: 50%; transform: translateY(-50%);
  color: var(--color-slate); pointer-events: none; display: flex;
}
.n8t-search__input { padding-left: 40px; padding-right: 38px; }
.n8t-search__clear {
  position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
  width: 24px; height: 24px; border-radius: 7px; border: none; cursor: pointer;
  background: var(--color-tint); color: var(--color-slate); font-size: 12px; line-height: 1;
  display: inline-flex; align-items: center; justify-content: center;
}
.n8t-search__clear:hover { background: var(--color-hairline); color: var(--color-ink); }
.n8t-count {
  flex: 0 0 auto; font-size: 13px; color: var(--color-slate); white-space: nowrap;
}
.n8t-count b { color: var(--color-ink); font-family: var(--font-geist); font-size: 15px; }

.n8t-chips {
  display: flex; gap: 7px; flex-wrap: wrap;
}
.n8t-chip { padding: 6px 13px; font-size: 12.5px; }

/* ---- 그리드 ---- */
.n8t-grid {
  display: grid; gap: 16px; margin-top: 16px;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
}

/* ---- 카드 ---- */
.n8t-card {
  position: relative; display: flex; flex-direction: column; cursor: pointer;
  padding: 14px; transition: transform .16s ease, box-shadow .16s ease, border-color .16s ease;
  outline: none;
}
.n8t-card:hover, .n8t-card:focus-visible {
  transform: translateY(-3px);
  box-shadow: 0 16px 32px -18px rgba(20,20,50,0.35);
  border-color: var(--color-hairline-strong);
}
.n8t-card:focus-visible { box-shadow: 0 0 0 3px rgba(107,98,242,0.28), 0 16px 32px -18px rgba(20,20,50,0.35); }
.n8t-card.is-imported { border-color: rgba(107,98,242,0.35); }
.n8t-card__ribbon {
  position: absolute; top: 12px; right: 12px; z-index: 2;
  font-size: 10.5px; font-weight: 800; letter-spacing: 0.02em;
  color: var(--color-dusk-violet); background: var(--color-violet-soft);
  border: 1px solid rgba(107,98,242,0.35); border-radius: 20px; padding: 3px 9px;
}
.n8t-card__diagram {
  border-radius: 11px; padding: 12px; margin-bottom: 13px;
  overflow-x: auto; display: flex; justify-content: center;
  background: linear-gradient(180deg, #fbfbff, #f4f4fb);
  border: 1px solid var(--color-hairline);
}
.n8t-card__catrow { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
.n8t-card__title {
  font-family: var(--font-geist); font-size: 15px; color: var(--color-ink);
  margin-bottom: 6px; line-height: 1.35;
}
.n8t-card__desc {
  margin: 0; font-size: 12.5px; color: var(--color-ash); line-height: 1.55; flex: 1;
}
.n8t-card__tags { display: flex; flex-wrap: wrap; gap: 5px; margin: 12px 0; }
.n8t-tag {
  font-size: 11px; color: var(--color-slate); background: var(--color-tint);
  border: 1px solid var(--color-hairline); border-radius: 16px; padding: 3px 9px;
}
.n8t-card__foot {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  margin-top: auto; padding-top: 12px; border-top: 1px solid var(--color-hairline);
}
.n8t-card__imports { font-size: 11.5px; display: inline-flex; align-items: center; gap: 5px; }
.n8t-card__cta { padding: 7px 13px; font-size: 12.5px; }

/* ---- 빈 상태 ---- */
.n8t-empty {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  text-align: center; padding: 56px 20px;
  background: #fff; border: 1px dashed var(--color-hairline-strong); border-radius: 14px;
  margin-top: 16px;
}
.n8t-empty__icon {
  width: 46px; height: 46px; border-radius: 12px; margin-bottom: 4px;
  display: inline-flex; align-items: center; justify-content: center;
  background: var(--color-violet-soft); color: var(--color-dusk-violet);
}
.n8t-empty__title { margin: 0; font-family: var(--font-geist); font-weight: 700; font-size: 15px; color: var(--color-ink); }
.n8t-empty__sub { margin: 0 0 8px; font-size: 13px; color: var(--color-slate); }

/* ---- 모달 ---- */
.n8t-overlay {
  position: fixed; inset: 0; background: rgba(20,20,50,0.5);
  display: flex; align-items: center; justify-content: center; padding: 16px; z-index: 1000;
  -webkit-backdrop-filter: blur(3px); backdrop-filter: blur(3px);
  animation: n8t-fade .16s ease;
}
.n8t-modal {
  background: #fff; border: 1px solid var(--color-hairline-strong); border-radius: 18px;
  width: 100%; max-width: 580px; max-height: 88vh; overflow-y: auto;
  box-shadow: 0 40px 90px -30px rgba(20,20,50,0.55);
  animation: n8t-pop .18s cubic-bezier(.2,.9,.3,1.2);
}
@keyframes n8t-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes n8t-pop { from { opacity: 0; transform: translateY(10px) scale(.98); } to { opacity: 1; transform: none; } }
.n8t-modal__head {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
  padding: 20px 20px 0;
}
.n8t-modal__title { margin: 8px 0 4px; font-family: var(--font-geist); font-size: 20px; color: var(--color-ink); letter-spacing: -0.01em; }
.n8t-modal__desc { margin: 0; font-size: 13.5px; color: var(--color-ash); line-height: 1.55; }
.n8t-modal__x { padding: 4px 11px; font-size: 15px; line-height: 1; }
.n8t-modal__diagram { margin: 18px 20px 0; }
.n8t-diagram__cap {
  display: block; font-size: 11.5px; font-weight: 700; color: var(--color-slate);
  text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 8px;
}
.n8t-diagram__frame {
  background: linear-gradient(180deg, #fbfbff, #f2f2fb);
  border: 1px solid var(--color-hairline); border-radius: 14px;
  padding: 18px 14px; overflow-x: auto; display: flex; justify-content: center;
}
.n8t-steps { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 9px; }
.n8t-steps__item { display: flex; gap: 11px; align-items: flex-start; }
.n8t-steps__num {
  flex: 0 0 auto; width: 23px; height: 23px; border-radius: 8px;
  background: var(--color-violet-soft); color: var(--color-dusk-violet);
  font-size: 12px; font-weight: 800; display: inline-flex; align-items: center;
  justify-content: center; font-family: var(--font-geist);
}
.n8t-steps__text { font-size: 13.5px; color: var(--color-ash); line-height: 1.55; padding-top: 2px; }
.n8t-modal__tags { display: flex; flex-wrap: wrap; gap: 6px; padding: 16px 20px 0; }
.n8t-modal__foot {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 18px 20px; margin-top: 8px; border-top: 1px solid var(--color-hairline);
}

/* ---- 반응형 ---- */
@media (max-width: 720px) {
  .n8t-body { padding: 16px 14px 22px; }
  .n8t-bar__sub, .n8t-bar__stat { display: none; }
  .n8t-grid { grid-template-columns: 1fr; gap: 13px; }
  .n8t-toolbar__top { flex-wrap: wrap; }
  .n8t-count { order: -1; }
}
`;
