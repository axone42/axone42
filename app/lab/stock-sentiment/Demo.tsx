"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/* =========================================================
   실데이터 뉴스 감성분석 데모
   - /api/market?news=SYM 에서 REAL 헤드라인 수집
   - JS 렉시콘(사전) 기반 감성 스코어러로 실제 분석
   ========================================================= */

type NewsRaw = { title: string; publisher: string; link: string; time: number };
type Sentiment = "pos" | "neu" | "neg";

type Scored = NewsRaw & {
  score: number; // -100 ~ 100
  sentiment: Sentiment;
  hits: { word: string; polarity: 1 | -1 }[];
};

type Ticker = { sym: string; name: string; glyph: string; color: string };

const TICKERS: Ticker[] = [
  { sym: "005930.KS", name: "삼성전자", glyph: "S", color: "#1428a0" },
  { sym: "000660.KS", name: "SK하이닉스", glyph: "H", color: "#e5231b" },
  { sym: "035420.KS", name: "NAVER", glyph: "N", color: "#03c75a" },
  { sym: "035720.KS", name: "카카오", glyph: "K", color: "#ffcd00" },
  { sym: "AAPL", name: "Apple", glyph: "", color: "#111" },
  { sym: "TSLA", name: "Tesla", glyph: "T", color: "#e82127" },
];

/* ---------- 감성 렉시콘 (금융 용어 포함) ---------- */
const POSITIVE = new Set<string>([
  "gain", "gains", "gained", "gaining", "surge", "surges", "surged", "surging",
  "beat", "beats", "beating", "upgrade", "upgrades", "upgraded", "record", "records",
  "rally", "rallies", "rallied", "rallying", "profit", "profits", "profitable",
  "growth", "grow", "grows", "growing", "buy", "buys", "outperform", "outperforms",
  "rise", "rises", "rising", "rose", "jump", "jumps", "jumped", "soar", "soars", "soared",
  "boost", "boosts", "boosted", "strong", "stronger", "strength", "bullish", "bull",
  "high", "higher", "top", "tops", "topped", "win", "wins", "winning", "won",
  "success", "successful", "boom", "booming", "recover", "recovery", "recovers", "rebound", "rebounds",
  "optimism", "optimistic", "opportunity", "opportunities", "positive", "advance", "advances",
  "leader", "leading", "expand", "expands", "expansion", "demand", "momentum",
  "breakthrough", "innovative", "innovation", "partnership", "deal", "deals", "approve", "approved",
  "raise", "raised", "raises", "lead", "leads", "climb", "climbs", "climbed", "up", "upside",
  "outperformance", "accelerate", "accelerates", "surpass", "surpasses", "surpassed",
  "milestone", "robust", "solid", "improve", "improves", "improved", "improvement", "gainer",
]);

const NEGATIVE = new Set<string>([
  "fall", "falls", "falling", "fell", "drop", "drops", "dropped", "dropping",
  "miss", "misses", "missed", "downgrade", "downgrades", "downgraded", "loss", "losses",
  "plunge", "plunges", "plunged", "cut", "cuts", "cutting", "lawsuit", "lawsuits",
  "probe", "probes", "weak", "weaker", "weakness", "sell", "sells", "selling", "sold",
  "slump", "slumps", "slumped", "decline", "declines", "declined", "declining",
  "sink", "sinks", "sank", "tumble", "tumbles", "tumbled", "slide", "slides", "slid",
  "crash", "crashes", "crashed", "bearish", "bear", "low", "lower", "down", "downside",
  "fear", "fears", "worry", "worries", "worried", "risk", "risks", "risky", "warning", "warn", "warns",
  "concern", "concerns", "concerned", "trouble", "troubled", "struggle", "struggles", "struggling",
  "recall", "recalls", "delay", "delays", "delayed", "layoff", "layoffs", "fraud", "scandal",
  "investigation", "fine", "fines", "fined", "penalty", "sue", "sued", "sues", "default",
  "bankruptcy", "bankrupt", "slowdown", "slowing", "slows", "shortage", "halt", "halts", "halted",
  "negative", "pressure", "pressured", "disappoint", "disappoints", "disappointing", "disappointed",
  "threat", "threats", "threaten", "curb", "curbs", "ban", "bans", "banned", "shrink", "shrinks",
  "stall", "stalls", "stalled", "underperform", "underperforms", "caution", "cautious", "uncertain",
  "uncertainty", "glut", "oversupply", "hit", "hits", "damage", "damaged", "collapse", "collapses",
]);

/* 불용어 (키워드 추출 시 제외) */
const STOPWORDS = new Set<string>([
  "the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "for", "with", "at", "by",
  "from", "as", "is", "are", "was", "were", "be", "been", "being", "it", "its", "this", "that",
  "these", "those", "s", "t", "isn", "aren", "will", "would", "can", "could", "may", "might",
  "has", "have", "had", "do", "does", "did", "not", "no", "you", "your", "we", "our", "they",
  "their", "he", "she", "his", "her", "i", "me", "my", "up", "down", "out", "over", "into",
  "than", "then", "now", "new", "more", "most", "amid", "after", "before", "about", "vs",
  "isnt", "arent", "stock", "stocks", "shares", "share", "market", "markets", "inc", "corp", "co",
  "why", "how", "what", "who", "when", "where", "here", "there", "video", "news", "report",
  "says", "say", "said", "could", "得", "com", "yahoo", "finance", "against", "still", "just",
]);

const SENT_META: Record<Sentiment, { label: string; pill: string; color: string }> = {
  pos: { label: "긍정", pill: "lx-pill--ok", color: "#1f9d57" },
  neu: { label: "중립", pill: "lx-pill--muted", color: "#8b8b9a" },
  neg: { label: "부정", pill: "lx-pill--danger", color: "#d64545" },
};

type Signal = "buy" | "watch" | "caution";
const SIGNAL_META: Record<Signal, { label: string; pill: string; icon: string }> = {
  buy: { label: "매수", pill: "lx-pill--ok", icon: "▲" },
  watch: { label: "관망", pill: "lx-pill--warn", icon: "●" },
  caution: { label: "주의", pill: "lx-pill--danger", icon: "▼" },
};

/* ---------- 순수 함수: 실제 감성 스코어링 ---------- */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9가-힣\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function scoreHeadline(title: string): { score: number; sentiment: Sentiment; hits: Scored["hits"] } {
  const tokens = tokenize(title);
  const hits: Scored["hits"] = [];
  let pos = 0;
  let neg = 0;
  for (const tk of tokens) {
    if (POSITIVE.has(tk)) {
      pos++;
      hits.push({ word: tk, polarity: 1 });
    } else if (NEGATIVE.has(tk)) {
      neg++;
      hits.push({ word: tk, polarity: -1 });
    }
  }
  const total = pos + neg;
  // (pos - neg) 정규화 → [-100, 100]
  const raw = total === 0 ? 0 : ((pos - neg) / total) * 100;
  const score = Math.round(raw);
  let sentiment: Sentiment = "neu";
  if (score >= 15) sentiment = "pos";
  else if (score <= -15) sentiment = "neg";
  return { score, sentiment, hits };
}

function gaugeColor(score: number): string {
  if (score >= 20) return "#1f9d57";
  if (score >= -20) return "#c98a12";
  return "#d64545";
}
function gaugeLabel(score: number): string {
  if (score >= 20) return "긍정 우세";
  if (score >= -20) return "중립";
  return "부정 우세";
}

function relTime(unixSec: number): string {
  const diff = Date.now() / 1000 - unixSec;
  if (diff < 60) return "방금 전";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

/* ---------- 반원형 게이지 (-100~100 → 반원) ---------- */
function SemiGauge({ score }: { score: number }) {
  const w = 240;
  const h = 132;
  const cx = w / 2;
  const cy = h - 12;
  const r = 92;
  const clamped = Math.max(-100, Math.min(100, score));
  const pct = (clamped + 100) / 2; // -100..100 → 0..100

  const polar = (p: number) => {
    const angle = Math.PI - (p / 100) * Math.PI;
    return { x: cx + r * Math.cos(angle), y: cy - r * Math.sin(angle) };
  };
  const arc = (from: number, to: number) => {
    const a = polar(from);
    const b = polar(to);
    return `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} A ${r} ${r} 0 0 1 ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
  };
  const needle = polar(pct);

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width="100%"
      style={{ maxWidth: w, display: "block", margin: "0 auto" }}
      role="img"
      aria-label={`감성 점수 ${clamped}점`}
    >
      {/* 존: 부정(빨강) 중립(앰버) 긍정(초록) */}
      <path d={arc(0, 40)} fill="none" stroke="#f3c7c7" strokeWidth={14} strokeLinecap="round" />
      <path d={arc(40, 60)} fill="none" stroke="#f4dfb0" strokeWidth={14} />
      <path d={arc(60, 100)} fill="none" stroke="#b6e4c8" strokeWidth={14} strokeLinecap="round" />
      {/* 진행 (중앙 50%에서 현재 값까지) */}
      <path
        d={arc(Math.min(50, pct), Math.max(50, pct))}
        fill="none"
        stroke={gaugeColor(clamped)}
        strokeWidth={14}
        strokeLinecap="round"
        opacity={0.95}
      />
      <line x1={cx} y1={cy} x2={needle.x} y2={needle.y} stroke="#14141d" strokeWidth={3} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={6} fill="#14141d" />
      <text x={cx} y={cy - 34} textAnchor="middle" fontFamily="var(--font-geist)" fontSize={28} fontWeight={800} fill={gaugeColor(clamped)}>
        {clamped > 0 ? "+" : ""}{clamped}
      </text>
      <text x={cx} y={cy - 16} textAnchor="middle" fontFamily="var(--font-geist)" fontSize={11} fill="#8b8b9a">
        −100 ~ +100
      </text>
    </svg>
  );
}

export default function Demo() {
  const [ticker, setTicker] = useState<Ticker>(TICKERS[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Scored[]>([]);
  const [ready, setReady] = useState(false); // 하이드레이션 후 클라이언트 렌더 허용
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const analyze = useCallback(async (sym: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetch(`/api/market?news=${encodeURIComponent(sym)}`).then((r) => r.json());
      if (!mounted.current) return;
      const raw: NewsRaw[] = Array.isArray(data.news) ? data.news : [];
      const scored: Scored[] = raw.map((n) => {
        const s = scoreHeadline(n.title);
        return { ...n, score: s.score, sentiment: s.sentiment, hits: s.hits };
      });
      setItems(scored);
    } catch {
      if (mounted.current) {
        setItems([]);
        setError("뉴스를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  // 최초 마운트: 클라이언트에서만 실행 (하이드레이션 안전)
  useEffect(() => {
    setReady(true);
    analyze(ticker.sym);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectTicker = (t: Ticker) => {
    if (t.sym === ticker.sym) return;
    setTicker(t);
    analyze(t.sym);
  };

  const refresh = () => analyze(ticker.sym);

  /* ---------- 집계 통계 (실제 계산값) ---------- */
  const stats = useMemo(() => {
    if (items.length === 0) return null;
    const pos = items.filter((i) => i.sentiment === "pos").length;
    const neg = items.filter((i) => i.sentiment === "neg").length;
    const neu = items.length - pos - neg;
    const avg = Math.round(items.reduce((a, b) => a + b.score, 0) / items.length);
    const signal: Signal = avg >= 20 ? "buy" : avg <= -20 ? "caution" : "watch";
    return { pos, neg, neu, avg, total: items.length, signal };
  }, [items]);

  /* ---------- 키워드 추출 (빈도 + 감성) ---------- */
  const keywords = useMemo(() => {
    if (items.length === 0) return [];
    const agg = new Map<string, { count: number; scoreSum: number }>();
    for (const it of items) {
      const seen = new Set<string>();
      for (const tk of tokenize(it.title)) {
        if (tk.length < 3 || STOPWORDS.has(tk) || /^\d+$/.test(tk)) continue;
        if (seen.has(tk)) continue;
        seen.add(tk);
        const cur = agg.get(tk) ?? { count: 0, scoreSum: 0 };
        cur.count += 1;
        cur.scoreSum += it.score;
        agg.set(tk, cur);
      }
    }
    return [...agg.entries()]
      .map(([word, v]) => {
        const avg = v.scoreSum / v.count;
        const sentiment: Sentiment = avg >= 15 ? "pos" : avg <= -15 ? "neg" : "neu";
        return { word, count: v.count, sentiment };
      })
      .sort((a, b) => b.count - a.count || b.word.localeCompare(a.word))
      .slice(0, 12);
  }, [items]);

  const maxKw = keywords.length ? keywords[0].count : 1;

  /* ---------- 데이터 기반 브리핑 문장 ---------- */
  const briefing = useMemo(() => {
    if (!stats) return "";
    const tone =
      stats.signal === "buy"
        ? "긍정 심리가 우세합니다. 뉴스 흐름상 매수 관점 접근이 유효해 보입니다."
        : stats.signal === "caution"
        ? "부정 심리가 우세합니다. 반등 신호 확인 전까지 보수적 리스크 관리가 필요합니다."
        : "긍·부정이 팽팽한 중립 국면입니다. 방향성 확인 전까지 관망이 유효합니다.";
    return `최근 헤드라인 총 ${stats.total}건 중 긍정 ${stats.pos} · 중립 ${stats.neu} · 부정 ${stats.neg}건이 감지되었습니다. 평균 감성 점수는 ${stats.avg > 0 ? "+" : ""}${stats.avg}점으로, ${tone}`;
  }, [stats]);

  const showSkeleton = !ready || loading;
  const hasData = !showSkeleton && items.length > 0 && !!stats;

  return (
    <div className="lx-win ss-win">
      {/* ===== 실제 앱 툴바 ===== */}
      <div className="lx-win__bar ss-bar">
        <div className="ss-brand">
          <span className="ss-brand__mark" aria-hidden>
            <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 17l5-5 3 3 7-8" />
              <path d="M14 7h5v5" />
            </svg>
          </span>
          <span className="ss-brand__text">
            <span className="ss-brand__name">SentimentScope</span>
            <span className="ss-brand__sub">뉴스 감성분석 · {ticker.name}</span>
          </span>
        </div>

        <div className="ss-bar__right">
          <span className="ss-live" data-loading={loading ? "1" : undefined}>
            <span className="ss-live__dot" />
            {loading ? "분석 중" : "실시간"}
          </span>
          <button
            type="button"
            className="lx-btn lx-btn--ghost ss-refresh"
            onClick={refresh}
            disabled={loading}
            aria-label="새로고침"
          >
            <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className={loading ? "ss-spin" : undefined}>
              <path d="M21 12a9 9 0 1 1-2.64-6.36" />
              <path d="M21 3v6h-6" />
            </svg>
            <span className="ss-refresh__label">새로고침</span>
          </button>
        </div>
      </div>

      <div className="lx-win__body ss-body">
        {/* ===== 종목 셀렉터 (툴바 하위 스트립) ===== */}
        <div className="ss-tickers" role="tablist" aria-label="종목 선택">
          <span className="ss-tickers__label">종목</span>
          <div className="ss-tickers__row">
            {TICKERS.map((t) => (
              <button
                key={t.sym}
                type="button"
                role="tab"
                aria-selected={ticker.sym === t.sym}
                className={`lx-toggle ss-tick${ticker.sym === t.sym ? " is-on" : ""}`}
                onClick={() => selectTicker(t)}
                disabled={loading}
              >
                <span className="ss-tick__glyph" style={{ background: t.color }}>
                  {t.glyph || t.name[0]}
                </span>
                {t.name}
              </button>
            ))}
          </div>
        </div>

        <div className="ss-content">
          {error && (
            <div className="ss-alert" role="alert">
              <span className="ss-alert__icon" aria-hidden>!</span>
              {error}
            </div>
          )}

          {/* ===== 로딩 스켈레톤 (대시보드 형태) ===== */}
          {showSkeleton && (
            <div className="ss-dash">
              <aside className="ss-col ss-col--side">
                <div className="lx-card ss-card">
                  <div className="lx-skel" style={{ height: 132, borderRadius: 10, marginBottom: 12 }} />
                  <div className="lx-skel" style={{ height: 22, width: "70%", margin: "0 auto", borderRadius: 12 }} />
                </div>
                <div className="lx-card ss-card">
                  <div className="lx-skel" style={{ height: 12, width: "40%", marginBottom: 12 }} />
                  <div className="lx-skel" style={{ height: 11, marginBottom: 8 }} />
                  <div className="lx-skel" style={{ height: 11, marginBottom: 8 }} />
                  <div className="lx-skel" style={{ height: 11, width: "60%" }} />
                </div>
                <div className="lx-card ss-card">
                  <div className="lx-skel" style={{ height: 12, width: "40%", marginBottom: 12 }} />
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {[64, 48, 80, 56, 40, 72].map((w, i) => (
                      <div key={i} className="lx-skel" style={{ height: 22, width: w, borderRadius: 12 }} />
                    ))}
                  </div>
                </div>
              </aside>
              <section className="ss-col ss-col--main">
                <div className="lx-card ss-card">
                  {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="ss-news-skel">
                      <div style={{ flex: 1 }}>
                        <div className="lx-skel" style={{ height: 13, width: `${88 - i * 4}%`, marginBottom: 8 }} />
                        <div className="lx-skel" style={{ height: 10, width: "35%" }} />
                      </div>
                      <div className="lx-skel" style={{ height: 20, width: 44, borderRadius: 12 }} />
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* ===== 빈 결과 ===== */}
          {!showSkeleton && !error && items.length === 0 && (
            <div className="ss-empty">
              <div className="ss-empty__icon" aria-hidden>📭</div>
              <p className="ss-empty__title">표시할 뉴스가 없습니다</p>
              <p className="ss-empty__sub">다른 종목을 선택하거나 잠시 후 새로고침해 주세요.</p>
              <button type="button" className="lx-btn lx-btn--primary" onClick={refresh}>다시 시도</button>
            </div>
          )}

          {/* ===== 결과 대시보드 ===== */}
          {hasData && stats && (
            <div className="ss-dash">
              {/* 좌: 게이지 + 브리핑 + 키워드 */}
              <aside className="ss-col ss-col--side">
                {/* 종합 게이지 */}
                <div className="lx-card lx-card--tint ss-card ss-gauge-card">
                  <div className="lx-h ss-card__h" style={{ justifyContent: "center" }}>
                    <span>종합 감성 점수</span>
                  </div>
                  <SemiGauge score={stats.avg} />
                  <div className="ss-gauge-pills">
                    <span
                      className="lx-pill"
                      style={{
                        color: gaugeColor(stats.avg),
                        background: "#fff",
                        border: `1px solid ${gaugeColor(stats.avg)}33`,
                        fontSize: 12.5,
                      }}
                    >
                      {gaugeLabel(stats.avg)}
                    </span>
                  </div>
                  <div className="ss-breakdown">
                    <div className="ss-break ss-break--pos">
                      <span className="ss-break__num">{stats.pos}</span>
                      <span className="ss-break__lbl">긍정</span>
                    </div>
                    <div className="ss-break ss-break--neu">
                      <span className="ss-break__num">{stats.neu}</span>
                      <span className="ss-break__lbl">중립</span>
                    </div>
                    <div className="ss-break ss-break--neg">
                      <span className="ss-break__num">{stats.neg}</span>
                      <span className="ss-break__lbl">부정</span>
                    </div>
                  </div>
                </div>

                {/* 오늘의 브리핑 */}
                <div className="lx-card ss-card">
                  <div className="lx-h ss-card__h">
                    <span>☀️ 오늘의 브리핑</span>
                    <span className={`lx-pill ${SIGNAL_META[stats.signal].pill}`}>
                      {SIGNAL_META[stats.signal].icon} {SIGNAL_META[stats.signal].label}
                    </span>
                  </div>
                  <p className="ss-brief">{briefing}</p>
                  <p className="ss-brief__meta">
                    <span className="lx-pill lx-pill--info">렉시콘 분석</span>
                    실시간 헤드라인 기반 자동 집계
                  </p>
                </div>

                {/* 키워드 */}
                <div className="lx-card ss-card">
                  <div className="lx-h ss-card__h">
                    <span>🔑 추출 키워드</span>
                    <span className="lx-sub">빈도순</span>
                  </div>
                  {keywords.length === 0 ? (
                    <p className="lx-sub" style={{ margin: 0 }}>추출된 키워드가 없습니다.</p>
                  ) : (
                    <div className="ss-kw">
                      {keywords.map((k) => {
                        const meta = SENT_META[k.sentiment];
                        const weight = k.count / maxKw; // 0~1
                        const fontSize = 11.5 + weight * 4.5;
                        const pad = 2 + weight * 3;
                        return (
                          <span
                            key={k.word}
                            className={`lx-pill ${meta.pill}`}
                            style={{ fontSize, padding: `${pad}px ${6 + weight * 6}px` }}
                            title={`${k.count}회 등장`}
                          >
                            {k.word}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </aside>

              {/* 우: 뉴스 리스트 */}
              <section className="ss-col ss-col--main">
                <div className="lx-card ss-card ss-news-card">
                  <div className="lx-h ss-card__h ss-news-h">
                    <span>📰 {ticker.name} 뉴스 감성</span>
                    <span className="lx-pill lx-pill--muted">{stats.total}건 분석</span>
                  </div>
                  <div className="ss-news">
                    {items.map((n, i) => {
                      const meta = SENT_META[n.sentiment];
                      const barPct = Math.abs(n.score); // 0~100
                      return (
                        <a
                          key={i}
                          href={n.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ss-news__item"
                        >
                          <span className="ss-news__rail" style={{ background: meta.color }} />
                          <div className="ss-news__body">
                            <div className="ss-news__top">
                              <p className="ss-news__title">{n.title}</p>
                              <span className={`lx-pill ${meta.pill} ss-news__pill`}>{meta.label}</span>
                            </div>
                            <div className="ss-news__foot">
                              <span className="lx-pill lx-pill--muted">{n.publisher}</span>
                              <span className="lx-sub ss-news__time">🕐 {relTime(n.time)}</span>
                              <span className="ss-news__spacer" />
                              <span className="lx-mono ss-news__score" style={{ color: meta.color }}>
                                {n.score > 0 ? "+" : ""}
                                {n.score}
                              </span>
                              <span className="ss-news__bar">
                                <span className="lx-track" style={{ height: 6 }}>
                                  <span className="lx-fill" style={{ width: `${barPct}%`, background: meta.color }} />
                                </span>
                              </span>
                            </div>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .ss-win { display: flex; flex-direction: column; }
        /* 툴바 */
        .ss-bar { min-height: 58px; }
        .ss-brand { display: flex; align-items: center; gap: 11px; min-width: 0; }
        .ss-brand__mark {
          display: inline-flex; align-items: center; justify-content: center;
          width: 34px; height: 34px; border-radius: 9px;
          background: linear-gradient(140deg, var(--color-dusk-violet), #8b7cff);
          box-shadow: 0 4px 12px -4px rgba(107, 98, 242, 0.55);
        }
        .ss-brand__text { display: flex; flex-direction: column; line-height: 1.15; min-width: 0; }
        .ss-brand__name { font-family: var(--font-geist); font-size: 15px; font-weight: 800; color: var(--color-ink); letter-spacing: -0.01em; }
        .ss-brand__sub { font-size: 11.5px; color: var(--color-slate); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ss-bar__right { display: flex; align-items: center; gap: 10px; flex: 0 0 auto; }
        .ss-live {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 11.5px; font-weight: 700; color: #1f9d57;
          background: #e7f7ee; border-radius: 20px; padding: 5px 11px;
        }
        .ss-live[data-loading] { color: var(--color-slate); background: var(--color-tint); }
        .ss-live__dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; animation: ss-pulse 1.6s ease-in-out infinite; }
        @keyframes ss-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        .ss-refresh { padding: 7px 13px; font-size: 13px; }
        .ss-spin { animation: ss-rot 0.9s linear infinite; }
        @keyframes ss-rot { to { transform: rotate(360deg); } }

        /* 본문 */
        .ss-body { display: flex; flex-direction: column; }
        .ss-tickers {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 18px; border-bottom: 1px solid var(--color-hairline);
          background: var(--color-tint);
        }
        .ss-tickers__label { font-size: 11.5px; font-weight: 700; color: var(--color-slate); letter-spacing: 0.02em; flex: 0 0 auto; }
        .ss-tickers__row { display: flex; gap: 8px; flex-wrap: wrap; }
        .ss-tick { display: inline-flex; align-items: center; gap: 6px; }
        .ss-tick__glyph {
          display: inline-flex; align-items: center; justify-content: center;
          width: 18px; height: 18px; border-radius: 5px; color: #fff;
          font-size: 11px; font-weight: 700;
        }
        .ss-content { padding: 18px; }

        /* 알림 */
        .ss-alert {
          display: flex; align-items: center; gap: 10px; margin-bottom: 16px;
          padding: 12px 14px; font-size: 13px; color: #d64545;
          background: #fdeaea; border: 1px solid rgba(214, 69, 69, 0.3); border-radius: 12px;
        }
        .ss-alert__icon {
          display: inline-flex; align-items: center; justify-content: center;
          width: 20px; height: 20px; border-radius: 50%; background: #d64545; color: #fff;
          font-weight: 800; font-size: 13px; flex: 0 0 auto;
        }

        /* 대시보드 그리드 */
        .ss-dash { display: grid; grid-template-columns: minmax(300px, 380px) 1fr; gap: 16px; align-items: start; }
        .ss-col { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
        .ss-card { padding: 16px; }
        .ss-card__h { margin: 0 0 14px; }

        /* 게이지 카드 */
        .ss-gauge-card { text-align: center; }
        .ss-gauge-pills { display: flex; gap: 6px; justify-content: center; flex-wrap: wrap; margin-top: 4px; }
        .ss-breakdown { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 14px; }
        .ss-break {
          display: flex; flex-direction: column; align-items: center; gap: 2px;
          padding: 10px 6px; border-radius: 10px; background: #fff; border: 1px solid var(--color-hairline);
        }
        .ss-break__num { font-family: var(--font-geist); font-size: 20px; font-weight: 800; line-height: 1; }
        .ss-break__lbl { font-size: 11px; font-weight: 600; color: var(--color-slate); }
        .ss-break--pos .ss-break__num { color: #1f9d57; }
        .ss-break--neu .ss-break__num { color: #8b8b9a; }
        .ss-break--neg .ss-break__num { color: #d64545; }

        /* 브리핑 */
        .ss-brief { margin: 0; font-size: 13px; line-height: 1.65; color: var(--color-ash); }
        .ss-brief__meta { margin: 12px 0 0; display: flex; align-items: center; gap: 6px; font-size: 12.5px; color: var(--color-slate); }

        /* 키워드 */
        .ss-kw { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }

        /* 뉴스 리스트 */
        .ss-news-card { padding: 16px 16px 10px; }
        .ss-news-h { padding-bottom: 2px; }
        .ss-news { display: flex; flex-direction: column; }
        .ss-news__item {
          position: relative; display: flex; gap: 12px; padding: 13px 6px 13px 14px;
          text-decoration: none; border-radius: 10px;
          border-bottom: 1px solid var(--color-tint); transition: background 0.15s ease;
        }
        .ss-news__item:last-child { border-bottom: none; }
        .ss-news__item:hover { background: #fafaff; }
        .ss-news__rail { position: absolute; left: 0; top: 12px; bottom: 12px; width: 3px; border-radius: 3px; opacity: 0.85; }
        .ss-news__body { flex: 1; min-width: 0; }
        .ss-news__top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
        .ss-news__title { margin: 0; font-size: 13.5px; font-weight: 600; color: var(--color-ink); line-height: 1.45; flex: 1; }
        .ss-news__pill { flex-shrink: 0; }
        .ss-news__foot { display: flex; align-items: center; gap: 8px; margin-top: 9px; flex-wrap: wrap; }
        .ss-news__time { display: inline-flex; align-items: center; }
        .ss-news__spacer { flex: 1; }
        .ss-news__score { font-size: 12.5px; font-weight: 700; }
        .ss-news__bar { width: 84px; }
        .ss-news-skel { display: flex; align-items: center; gap: 12px; padding: 13px 0; border-bottom: 1px solid var(--color-tint); }
        .ss-news-skel:last-child { border-bottom: none; }

        /* 빈 상태 */
        .ss-empty { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 56px 20px; text-align: center; }
        .ss-empty__icon { font-size: 40px; margin-bottom: 4px; }
        .ss-empty__title { margin: 0; font-family: var(--font-geist); font-size: 16px; font-weight: 700; color: var(--color-ink); }
        .ss-empty__sub { margin: 0 0 14px; font-size: 13px; color: var(--color-slate); }

        @media (max-width: 900px) {
          .ss-dash { grid-template-columns: 1fr; }
        }
        @media (max-width: 560px) {
          .ss-brand__sub { display: none; }
          .ss-refresh__label { display: none; }
          .ss-tickers { flex-direction: column; align-items: flex-start; gap: 8px; }
          .ss-news__bar { display: none; }
        }
      `}</style>
    </div>
  );
}
