"use client";

import { useState } from "react";

type ChannelKey = "linkedin" | "threads" | "x" | "instagram";

const CHANNELS: { key: ChannelKey; name: string; glyph: string; color: string; limit: number }[] = [
  { key: "linkedin", name: "LinkedIn", glyph: "in", color: "#0a66c2", limit: 3000 },
  { key: "threads", name: "Threads", glyph: "@", color: "#000000", limit: 500 },
  { key: "x", name: "X (Twitter)", glyph: "𝕏", color: "#111111", limit: 280 },
  { key: "instagram", name: "Instagram", glyph: "◎", color: "#c13584", limit: 2200 },
];

const TONES = ["전문적", "친근한", "설득력 있게", "스토리텔링"] as const;
type Tone = (typeof TONES)[number];

function hashtags(topic: string): string[] {
  const base = ["AX전환", "AI자동화", "업무자동화", "생산성", "n8n", "AXONE"];
  const extra = topic.length > 10 ? ["실무팁", "일잘러"] : ["스타트업"];
  return [...base, ...extra];
}

/** 채널별 카피 생성 (데모용 클라이언트 템플릿) */
function generate(topic: string, tone: Tone, ch: ChannelKey): string {
  const t = topic.trim() || "AI 자동화로 반복 업무를 없앤 경험";
  const tags = hashtags(t);
  const tagStr = (n: number) => tags.slice(0, n).map((h) => "#" + h).join(" ");
  const toneLead: Record<Tone, string> = {
    전문적: "실무에서 검증된 인사이트를 공유합니다.",
    친근한: "요즘 이거 하나로 진짜 편해졌어요 👀",
    "설득력 있게": "아직도 이걸 수작업으로 하고 계신가요?",
    스토리텔링: "6개월 전만 해도 매일 야근이었습니다.",
  };

  switch (ch) {
    case "linkedin":
      return `${toneLead[tone]}

주제: ${t}

핵심 3가지
· 반복 업무를 워크플로우로 자동화해 담당자는 '판단'에만 집중
· 데이터 수집→분류→응답→리포트까지 무인 처리
· 도입 4주 만에 처리량 3배, 응대 시간 72% 단축

작게 시작해도 효과는 즉시 나타납니다. 우리 팀의 어떤 업무부터 자동화하면 좋을지 고민 중이라면 편하게 남겨주세요.

${tagStr(4)}`;

    case "threads":
      return `${toneLead[tone]}

${t} — 이거 자동화하고 나서 팀 분위기가 바뀌었어요.

사람이 하던 단순 반복을 시스템이 대신하니까
진짜 중요한 일에 쓸 시간이 생기더라고요 ⚡

${tagStr(3)}`;

    case "x":
      return `${t}.
반복 업무는 자동화, 사람은 판단에 집중.
도입 4주 → 처리량 3배 / 응대시간 -72% 🚀
${tagStr(2)}`;

    case "instagram":
      return `${toneLead[tone]} ✨

📌 ${t}

오늘의 인사이트
① 반복은 자동화
② 사람은 판단에 집중
③ 성과는 숫자로 증명

.
.
${tagStr(8)}`;
  }
}

const BEST_TIME: Record<ChannelKey, string> = {
  linkedin: "화 오전 8:30",
  threads: "수 오후 9:00",
  x: "목 오전 7:30",
  instagram: "금 오후 6:00",
};

function predict(ch: ChannelKey) {
  // 데모용 예측치 (채널별 고정 시드)
  const map: Record<ChannelKey, { reach: string; eng: number }> = {
    linkedin: { reach: "3.2K", eng: 74 },
    threads: { reach: "5.8K", eng: 61 },
    x: { reach: "4.1K", eng: 52 },
    instagram: { reach: "6.5K", eng: 68 },
  };
  return map[ch];
}

export default function Demo() {
  const [topic, setTopic] = useState("AI 자동화로 반복 업무를 없앤 경험");
  const [tone, setTone] = useState<Tone>("전문적");
  const [selected, setSelected] = useState<Record<ChannelKey, boolean>>({
    linkedin: true,
    threads: true,
    x: true,
    instagram: true,
  });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ ch: ChannelKey; text: string }[]>(
    CHANNELS.map((c) => ({ ch: c.key, text: generate("AI 자동화로 반복 업무를 없앤 경험", "전문적", c.key) }))
  );
  const [live, setLive] = useState(false);
  const [copied, setCopied] = useState<ChannelKey | null>(null);

  const activeChannels = CHANNELS.filter((c) => selected[c.key]);

  const run = async () => {
    if (activeChannels.length === 0) return;
    setLoading(true);
    setResults([]);
    const keys = activeChannels.map((c) => c.key);
    try {
      const res = await fetch("/api/lab/personal-branding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, tone, channels: keys }),
      });
      const data = await res.json();
      if (data.live && Array.isArray(data.variants) && data.variants.length) {
        const byCh = new Map<string, string>(data.variants.map((v: { channel: string; text: string }) => [v.channel, v.text]));
        setResults(keys.map((k) => ({ ch: k, text: byCh.get(k) ?? generate(topic, tone, k) })));
        setLive(true);
      } else {
        setResults(keys.map((k) => ({ ch: k, text: generate(topic, tone, k) })));
        setLive(false);
      }
    } catch {
      setResults(keys.map((k) => ({ ch: k, text: generate(topic, tone, k) })));
      setLive(false);
    } finally {
      setLoading(false);
    }
  };

  const copy = (ch: ChannelKey, text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopied(ch);
    setTimeout(() => setCopied((c) => (c === ch ? null : c)), 1500);
  };

  const charCount = topic.trim().length;

  return (
    <div className="lx-win pb-win">
      <style>{PB_CSS}</style>

      {/* ===== 앱 툴바 ===== */}
      <div className="lx-win__bar pb-bar">
        <div className="lx-win__title pb-brand">
          <span className="pb-brand__mark" aria-hidden>✍️</span>
          <span className="pb-brand__name">개인 브랜딩 스튜디오</span>
          <span className="pb-brand__tag">Content Studio</span>
        </div>
        <div className="pb-bar__right">
          <span className="pb-chanrow" aria-hidden>
            {CHANNELS.map((c) => (
              <span
                key={c.key}
                className={`pb-chandot${selected[c.key] ? " is-on" : ""}`}
                style={{ background: selected[c.key] ? c.color : undefined }}
                title={c.name}
              >
                {c.glyph}
              </span>
            ))}
          </span>
          <span className={`pb-live ${live ? "is-live" : "is-sample"}`}>
            <span className="pb-live__dot" />
            {live ? "실시간 AI" : "샘플 생성"}
          </span>
        </div>
      </div>

      {/* ===== 스튜디오 본체 (composer | results) ===== */}
      <div className="pb-studio">
        {/* ---- 컴포저 (좌측 sticky) ---- */}
        <aside className="pb-composer">
          <div className="pb-composer__inner">
            <div className="pb-step">
              <span className="pb-step__no">1</span>
              <label className="pb-step__label" htmlFor="pb-source">소스 한 편</label>
              <span className="pb-step__hint">한 번만 쓰면 채널별로 자동 변환됩니다</span>
            </div>
            <div className="pb-source">
              <textarea
                id="pb-source"
                className="lx-textarea pb-textarea"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="예) AI 자동화로 반복 업무를 없앤 경험, 이번 주 배운 인사이트…"
              />
              <span className="pb-source__count lx-mono">{charCount}자</span>
            </div>

            <div className="pb-step pb-step--mt">
              <span className="pb-step__no">2</span>
              <label className="pb-step__label">톤 앤 매너</label>
            </div>
            <div className="pb-chips">
              {TONES.map((tn) => (
                <button key={tn} type="button" className={`lx-toggle pb-chip${tone === tn ? " is-on" : ""}`} onClick={() => setTone(tn)}>
                  {tn}
                </button>
              ))}
            </div>

            <div className="pb-step pb-step--mt">
              <span className="pb-step__no">3</span>
              <label className="pb-step__label">발행 채널</label>
              <span className="pb-step__hint">{activeChannels.length}개 선택됨</span>
            </div>
            <div className="pb-chanlist">
              {CHANNELS.map((c) => {
                const on = selected[c.key];
                return (
                  <button
                    key={c.key}
                    type="button"
                    className={`pb-chan${on ? " is-on" : ""}`}
                    style={on ? ({ ["--pb-accent" as string]: c.color }) : undefined}
                    onClick={() => setSelected((s) => ({ ...s, [c.key]: !s[c.key] }))}
                  >
                    <span className="pb-chan__glyph" style={{ background: c.color }}>{c.glyph}</span>
                    <span className="pb-chan__name">{c.name}</span>
                    <span className="pb-chan__lim lx-mono">{c.limit.toLocaleString()}자</span>
                    <span className="pb-chan__check" aria-hidden>{on ? "✓" : ""}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              className="lx-btn lx-btn--primary pb-run"
              onClick={run}
              disabled={loading || activeChannels.length === 0}
            >
              {loading ? (
                <>
                  <span className="lx-typing" aria-hidden><i /><i /><i /></span>
                  채널별 변환 중…
                </>
              ) : (
                <>✦ AI로 채널별 변환</>
              )}
            </button>
            <p className="pb-run__note">
              {activeChannels.length === 0
                ? "변환할 채널을 하나 이상 선택하세요"
                : `${activeChannels.length}개 채널 · ${tone} 톤으로 리라이팅`}
            </p>
          </div>
        </aside>

        {/* ---- 결과 (우측) ---- */}
        <section className="pb-results">
          <div className="pb-results__head">
            <h2 className="pb-results__title">채널별 결과물</h2>
            <span className="pb-results__meta">
              {loading ? "생성 중" : `${results.length}개 채널 · 성과 예측 포함`}
            </span>
          </div>

          <div className="pb-grid">
            {loading &&
              activeChannels.map((c) => (
                <div key={c.key} className="lx-card pb-card pb-card--skel" style={{ ["--pb-accent" as string]: c.color }}>
                  <div className="pb-card__top">
                    <div className="pb-card__id">
                      <span className="pb-card__glyph" style={{ background: c.color }}>{c.glyph}</span>
                      <b className="pb-card__name">{c.name}</b>
                    </div>
                    <span className="lx-skel" style={{ height: 18, width: 54, borderRadius: 20 }} />
                  </div>
                  <div className="lx-skel" style={{ height: 12, marginBottom: 9 }} />
                  <div className="lx-skel" style={{ height: 12, marginBottom: 9 }} />
                  <div className="lx-skel" style={{ height: 12, marginBottom: 9 }} />
                  <div className="lx-skel" style={{ height: 12, width: "62%" }} />
                </div>
              ))}

            {!loading &&
              results.map(({ ch, text }) => {
                const meta = CHANNELS.find((c) => c.key === ch)!;
                const p = predict(ch);
                const over = text.length > meta.limit;
                const pct = Math.min(100, Math.round((text.length / meta.limit) * 100));
                return (
                  <article key={ch} className="lx-card pb-card" style={{ ["--pb-accent" as string]: meta.color }}>
                    <div className="pb-card__top">
                      <div className="pb-card__id">
                        <span className="pb-card__glyph" style={{ background: meta.color }}>{meta.glyph}</span>
                        <b className="pb-card__name">{meta.name}</b>
                      </div>
                      <span className={`lx-pill pb-count ${over ? "lx-pill--danger" : "lx-pill--ok"}`}>
                        {text.length.toLocaleString()}/{meta.limit.toLocaleString()}
                      </span>
                    </div>

                    <div className="pb-card__body">
                      <pre className="pb-copy">{text}</pre>
                      <span className="pb-card__len" aria-hidden style={{ width: `${pct}%`, background: meta.color }} />
                    </div>

                    <div className="pb-metrics">
                      <div className="pb-metric">
                        <span className="pb-metric__label">예상 도달</span>
                        <b className="pb-metric__val lx-mono">{p.reach}</b>
                      </div>
                      <div className="pb-metric">
                        <span className="pb-metric__label">추천 발행</span>
                        <b className="pb-metric__val">{BEST_TIME[ch]}</b>
                      </div>
                      <div className="pb-metric pb-metric--eng">
                        <div className="pb-metric__engtop">
                          <span className="pb-metric__label">예상 참여도</span>
                          <b className="pb-metric__val lx-mono">{p.eng}%</b>
                        </div>
                        <div className="lx-track pb-eng"><span className="lx-fill" style={{ width: `${p.eng}%`, background: meta.color }} /></div>
                      </div>
                    </div>

                    <div className="pb-actions">
                      <button type="button" className={`lx-btn lx-btn--ghost pb-act${copied === ch ? " is-copied" : ""}`} onClick={() => copy(ch, text)}>
                        {copied === ch ? "복사됨 ✓" : "복사"}
                      </button>
                      <button type="button" className="lx-btn lx-btn--primary pb-act">
                        예약 발행
                      </button>
                    </div>
                  </article>
                );
              })}
          </div>

          {!loading && results.length === 0 && (
            <div className="pb-empty">
              <span className="pb-empty__icon" aria-hidden>✎</span>
              <p className="pb-empty__t">발행할 채널을 선택하고 변환을 눌러주세요.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

const PB_CSS = `
.pb-win { display: flex; flex-direction: column; }

/* ===== 툴바 ===== */
.pb-bar {
  background: linear-gradient(180deg, #fff, #fbfbfe);
  min-height: 56px; padding: 0 16px 0 18px;
}
.pb-brand { gap: 10px; }
.pb-brand__mark {
  display: inline-flex; align-items: center; justify-content: center;
  width: 30px; height: 30px; border-radius: 9px; font-size: 15px;
  background: var(--color-violet-soft);
}
.pb-brand__name { font-family: var(--font-geist); font-weight: 800; font-size: 15px; color: var(--color-ink); }
.pb-brand__tag {
  font-family: var(--font-geist); font-size: 10px; font-weight: 700; letter-spacing: .1em;
  color: var(--color-slate); background: var(--color-tint);
  border: 1px solid var(--color-hairline); border-radius: 20px; padding: 3px 9px;
}
.pb-bar__right { display: flex; align-items: center; gap: 12px; }
.pb-chanrow { display: inline-flex; gap: 4px; }
.pb-chandot {
  width: 20px; height: 20px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700; color: #fff; background: #d4d4e0; opacity: .35;
  transition: opacity .18s ease, transform .18s ease;
}
.pb-chandot.is-on { opacity: 1; }
.pb-live {
  display: inline-flex; align-items: center; gap: 6px;
  font-family: var(--font-geist); font-size: 11px; font-weight: 700;
  border-radius: 20px; padding: 4px 11px 4px 9px; white-space: nowrap;
}
.pb-live.is-live { color: #1f9d57; background: #e7f7ee; }
.pb-live.is-sample { color: var(--color-slate); background: var(--color-tint); }
.pb-live__dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
.pb-live.is-live .pb-live__dot { animation: pbpulse 1.6s infinite; }
@keyframes pbpulse { 0%,100% { opacity: 1; box-shadow: 0 0 0 0 rgba(31,157,87,.5);} 50% { opacity: .55; box-shadow: 0 0 0 4px rgba(31,157,87,0);} }
@media (max-width: 620px) { .pb-brand__tag, .pb-chanrow { display: none; } }

/* ===== 스튜디오 레이아웃 ===== */
.pb-studio {
  display: grid; grid-template-columns: 340px 1fr; align-items: start;
}
@media (max-width: 960px) { .pb-studio { grid-template-columns: 1fr; } }

/* ---- 컴포저 ---- */
.pb-composer {
  border-right: 1px solid var(--color-hairline);
  background: linear-gradient(180deg, #fbfbfe, #fff);
  align-self: stretch;
}
@media (max-width: 960px) { .pb-composer { border-right: none; border-bottom: 1px solid var(--color-hairline); } }
.pb-composer__inner { position: sticky; top: 52px; padding: 20px; }
@media (max-width: 960px) { .pb-composer__inner { position: static; } }

.pb-step { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.pb-step--mt { margin-top: 22px; }
.pb-step__no {
  flex: 0 0 auto; width: 19px; height: 19px; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  font-family: var(--font-geist); font-size: 11px; font-weight: 800; color: #fff;
  background: var(--color-dusk-violet);
}
.pb-step__label { font-family: var(--font-geist); font-size: 13px; font-weight: 700; color: var(--color-ink); }
.pb-step__hint { font-size: 11px; color: var(--color-slate); margin-left: auto; }

.pb-source { position: relative; }
.pb-textarea { min-height: 128px; padding-bottom: 26px; }
.pb-source__count {
  position: absolute; right: 10px; bottom: 8px; font-size: 11px; color: var(--color-slate);
  background: rgba(255,255,255,.85); padding: 1px 6px; border-radius: 6px; pointer-events: none;
}

.pb-chips { display: flex; flex-wrap: wrap; gap: 7px; }
.pb-chip { padding: 7px 13px; font-size: 12.5px; }

.pb-chanlist { display: flex; flex-direction: column; gap: 7px; }
.pb-chan {
  display: flex; align-items: center; gap: 10px; text-align: left; cursor: pointer;
  border: 1px solid var(--color-hairline-strong); border-radius: 11px; padding: 9px 11px; background: #fff;
  transition: border-color .15s ease, box-shadow .15s ease, background .15s ease;
}
.pb-chan:hover { border-color: var(--color-slate); }
.pb-chan.is-on {
  border-color: var(--pb-accent); background: #fff;
  box-shadow: inset 3px 0 0 var(--pb-accent), 0 1px 0 rgba(20,20,50,.02);
}
.pb-chan__glyph {
  flex: 0 0 auto; width: 26px; height: 26px; border-radius: 7px; color: #fff;
  display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800;
}
.pb-chan__name { font-family: var(--font-geist); font-size: 13.5px; font-weight: 700; color: var(--color-ink); }
.pb-chan__lim { margin-left: auto; font-size: 11px; color: var(--color-slate); }
.pb-chan__check { flex: 0 0 auto; width: 16px; text-align: center; font-size: 13px; font-weight: 800; color: var(--pb-accent); }
.pb-chan:not(.is-on) .pb-chan__glyph { opacity: .5; filter: grayscale(.3); }

.pb-run { width: 100%; margin-top: 20px; padding: 12px; font-size: 14px; }
.pb-run__note { margin: 8px 0 0; text-align: center; font-size: 11.5px; color: var(--color-slate); }

/* ---- 결과 ---- */
.pb-results { padding: 20px; min-width: 0; }
.pb-results__head { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; margin-bottom: 14px; }
.pb-results__title { margin: 0; font-family: var(--font-geist); font-size: 15px; font-weight: 800; color: var(--color-ink); }
.pb-results__meta { font-size: 12px; color: var(--color-slate); }

.pb-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
@media (max-width: 1180px) { .pb-grid { grid-template-columns: 1fr; } }
@media (max-width: 960px) { .pb-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 680px) { .pb-grid { grid-template-columns: 1fr; } }

.pb-card {
  display: flex; flex-direction: column; padding: 0; overflow: hidden;
  border-radius: 14px; transition: box-shadow .18s ease, transform .18s ease, border-color .18s ease;
}
.pb-card::before { content: ""; display: block; height: 3px; background: var(--pb-accent); }
.pb-card:not(.pb-card--skel):hover { box-shadow: 0 14px 34px -22px rgba(20,20,50,.4); transform: translateY(-2px); border-color: var(--color-hairline-strong); }

.pb-card__top { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 13px 14px 10px; }
.pb-card__id { display: flex; align-items: center; gap: 9px; }
.pb-card__glyph {
  width: 28px; height: 28px; border-radius: 8px; color: #fff;
  display: inline-flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800;
}
.pb-card__name { font-family: var(--font-geist); font-size: 14px; color: var(--color-ink); }
.pb-count { font-variant-numeric: tabular-nums; }

.pb-card__body { position: relative; padding: 0 14px; flex: 1; }
.pb-copy {
  margin: 0; white-space: pre-wrap; word-break: break-word;
  font-family: var(--font-dm-sans); font-size: 13px; line-height: 1.62; color: var(--color-ink);
  max-height: 220px; overflow-y: auto; padding-right: 4px;
}
.pb-copy::-webkit-scrollbar { width: 6px; }
.pb-copy::-webkit-scrollbar-thumb { background: var(--color-hairline-strong); border-radius: 6px; }
.pb-card__len { position: absolute; left: 14px; bottom: -1px; height: 2px; border-radius: 2px; opacity: .35; }

.pb-metrics {
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px 14px;
  padding: 14px; margin-top: 12px; background: var(--color-tint);
  border-top: 1px solid var(--color-hairline);
}
.pb-metric { display: flex; flex-direction: column; gap: 3px; }
.pb-metric--eng { grid-column: 1 / -1; gap: 6px; }
.pb-metric__engtop { display: flex; align-items: center; justify-content: space-between; }
.pb-metric__label { font-size: 11px; color: var(--color-slate); }
.pb-metric__val { font-family: var(--font-geist); font-size: 13.5px; font-weight: 700; color: var(--color-ink); }
.pb-eng { height: 7px; }

.pb-actions { display: flex; gap: 8px; padding: 0 14px 14px; }
.pb-act { flex: 1; padding: 9px 12px; font-size: 13px; }
.pb-act.is-copied { color: #1f9d57; border-color: #bfe6cf; background: #f2fbf6; }

/* ---- 빈 상태 ---- */
.pb-empty { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 60px 20px; }
.pb-empty__icon {
  width: 48px; height: 48px; border-radius: 14px; display: inline-flex; align-items: center; justify-content: center;
  font-size: 22px; color: var(--color-slate); background: var(--color-tint); border: 1px solid var(--color-hairline);
}
.pb-empty__t { margin: 0; font-size: 13px; color: var(--color-slate); }
`;
