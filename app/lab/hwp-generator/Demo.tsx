"use client";

import { useState } from "react";
import { downloadText } from "@/lib/download";

/* ------------------------------------------------------------------ *
 * 템플릿 정의
 * ------------------------------------------------------------------ */
type TemplateKey = "official" | "proposal" | "weekly";

const TEMPLATES: { key: TemplateKey; name: string; glyph: string; org: string }[] = [
  { key: "official", name: "공문", glyph: "🏛️", org: "에이엑스원 주식회사" },
  { key: "proposal", name: "사업 제안서", glyph: "📈", org: "에이엑스원 주식회사" },
  { key: "weekly", name: "주간 보고서", glyph: "🗒️", org: "AX전환팀" },
];

/* 각 템플릿의 필드값 형태 */
type FormState = {
  title: string;
  receiver: string; // 수신
  sender: string; // 발신 / 부서
  docNo: string; // 문서번호
  date: string; // 날짜 (고정 시드 — 하이드레이션 안전)
  writer: string; // 작성자 / 담당
  // 본문 항목
  body1: string;
  body2: string;
  body3: string;
};

/* 첫 페인트용 고정 시드 (Math.random / new Date 금지) */
const SEED: Record<TemplateKey, FormState> = {
  official: {
    title: "AI 업무 자동화 도입 협조 요청",
    receiver: "각 부서장",
    sender: "경영지원본부 디지털혁신팀",
    docNo: "AXONE-2026-0142",
    date: "2026. 08. 13.",
    writer: "김도현 팀장",
    body1: "당 팀에서 추진 중인 반복 업무 자동화 사업과 관련하여 아래와 같이 협조를 요청합니다.",
    body2: "대상 업무 조사표를 8월 22일(금)까지 회신하여 주시기 바랍니다.",
    body3: "본 사업은 부서별 처리 시간 단축 및 응대 품질 향상을 목표로 합니다.",
  },
  proposal: {
    title: "업무 자동화 플랫폼 구축 제안",
    receiver: "(주)미래상사 구매팀",
    sender: "에이엑스원 사업개발본부",
    docNo: "AXONE-PRP-2026-088",
    date: "2026. 08. 13.",
    writer: "이서준 수석",
    body1: "귀사의 반복 수작업을 워크플로우로 전환하여 담당자가 판단 업무에만 집중하도록 지원합니다.",
    body2: "데이터 수집→분류→응답→리포트까지 무인 처리하며, 도입 4주 만에 처리량 3배를 달성합니다.",
    body3: "총 구축 비용 및 유지보수 조건은 별첨 견적서를 참고하여 주시기 바랍니다.",
  },
  weekly: {
    title: "AX전환팀 주간 업무 보고",
    receiver: "본부장",
    sender: "AX전환팀",
    docNo: "WR-2026-W33",
    date: "2026. 08. 13.",
    writer: "박하은 대리",
    body1: "이번 주 문서 자동화 파이프라인 1차 버전 배포를 완료했습니다.",
    body2: "다음 주 공문·제안서 템플릿 2종을 추가하고 사내 파일럿을 시작할 예정입니다.",
    body3: "특이사항: HWPX 서식 호환성 검토 중이며 큰 리스크는 없습니다.",
  },
};

/* AI 초안 (버튼 클릭 시 채워 넣을 예시 문구) */
const AI_DRAFT: Record<TemplateKey, Pick<FormState, "body1" | "body2" | "body3">> = {
  official: {
    body1: "당 팀에서는 부서별 반복 업무의 자동화를 통해 업무 효율을 제고하고자 합니다. 이에 관련 협조를 아래와 같이 요청드립니다.",
    body2: "첨부된 '자동화 대상 업무 조사표'를 작성하시어 2026년 8월 22일(금)까지 디지털혁신팀으로 회신하여 주시기 바랍니다.",
    body3: "본 사업은 부서별 평균 처리시간 40% 단축과 응대 품질 향상을 목표로 하며, 각 부서의 적극적인 협조를 부탁드립니다.",
  },
  proposal: {
    body1: "귀사의 현행 수작업 프로세스를 진단한 결과, 반복 업무 비중이 전체의 62%로 확인되었습니다. 이를 자동화하여 핵심 판단 업무에 인력을 재배치할 것을 제안합니다.",
    body2: "AXONE 자동화 플랫폼은 데이터 수집·분류·응답·리포트 생성을 무인 처리하며, 도입 4주 기준 처리량 3배·응대시간 72% 단축이라는 검증된 성과를 제공합니다.",
    body3: "1단계 파일럿(4주), 2단계 확산(8주)의 단계적 구축을 권장드리며, 세부 일정과 비용은 별첨 견적서를 참고하여 주시기 바랍니다.",
  },
  weekly: {
    body1: "[완료] 문서 자동화 파이프라인 1차 버전을 사내 스테이징 환경에 배포하였으며, 공문 템플릿 기준 생성 정확도 98%를 확인했습니다.",
    body2: "[예정] 차주 사업 제안서·주간 보고서 템플릿 2종을 추가하고, 3개 부서 대상 사내 파일럿을 착수할 예정입니다.",
    body3: "[특이사항] HWPX 서식 일부 표 병합 호환성을 검토 중이며, 대응 방안을 확보하여 일정에는 영향이 없습니다.",
  },
};

const FIELD_LABELS: Record<TemplateKey, { b1: string; b2: string; b3: string }> = {
  official: { b1: "요청 취지", b2: "요청 사항", b3: "기대 효과" },
  proposal: { b1: "제안 배경", b2: "제안 내용", b3: "기대 성과 · 비용" },
  weekly: { b1: "금주 실적", b2: "차주 계획", b3: "특이사항" },
};

export default function Demo() {
  const [tpl, setTpl] = useState<TemplateKey>("official");
  const [forms, setForms] = useState<Record<TemplateKey, FormState>>(SEED);
  const [drafting, setDrafting] = useState(false);
  const [exported, setExported] = useState(false);
  const [live, setLive] = useState(false);

  const meta = TEMPLATES.find((t) => t.key === tpl)!;
  const f = forms[tpl];
  const labels = FIELD_LABELS[tpl];

  const set = (patch: Partial<FormState>) =>
    setForms((prev) => ({ ...prev, [tpl]: { ...prev[tpl], ...patch } }));

  const runDraft = async () => {
    setDrafting(true);
    const current = forms[tpl];
    try {
      const res = await fetch("/api/lab/hwp-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docType: meta.name, fields: current }),
      });
      const data = await res.json();
      if (
        data.live &&
        data.draft &&
        typeof data.draft.body1 === "string" &&
        data.draft.body1.trim()
      ) {
        const d = data.draft as { title?: string; body1: string; body2: string; body3: string };
        set({
          ...(typeof d.title === "string" && d.title.trim() ? { title: d.title } : {}),
          body1: d.body1,
          body2: d.body2,
          body3: d.body3,
        });
        setLive(true);
      } else {
        set(AI_DRAFT[tpl]);
        setLive(false);
      }
    } catch {
      set(AI_DRAFT[tpl]);
      setLive(false);
    } finally {
      setDrafting(false);
    }
  };

  const runExport = () => {
    downloadText(`${meta.name}.txt`, [f.title, `수신: ${f.receiver}`, `발신: ${f.sender}`, `문서번호: ${f.docNo}`, `작성일: ${f.date}`, `작성자: ${f.writer}`, "", labels.b1, f.body1, "", labels.b2, f.body2, "", labels.b3, f.body3].join("\n"));
    setExported(true);
    setTimeout(() => setExported(false), 2200);
  };

  return (
    <div className="lx-win hg">
      <ScopedStyle />

      {/* ===== 앱 툴바 ===== */}
      <div className="lx-win__bar hg-bar">
        <div className="hg-bar__brand">
          <span className="hg-bar__logo">📄</span>
          <span className="hg-bar__app">한글문서 생성기</span>
          <span className="hg-bar__ver">HWPX Studio</span>
        </div>
        <div className="hg-bar__right">
          <span className="hg-bar__doc">
            <span className="hg-bar__doc-glyph">{meta.glyph}</span>
            {meta.name}
          </span>
          <span
            className={`lx-pill ${live ? "lx-pill--ok" : "lx-pill--muted"} hg-bar__pill`}
          >
            <i className={`hg-dot ${live ? "hg-dot--live" : ""}`} />
            {live ? "실시간 AI" : "샘플 생성"}
          </span>
        </div>
      </div>

      {/* ===== 편집기 본체 ===== */}
      <div className="lx-win__body hg-editor">
        {/* ---------------- 좌: 입력 패널 ---------------- */}
        <aside className="hg-side">
          <div className="hg-side__scroll">
            {/* 템플릿 선택 */}
            <div className="hg-section">
              <div className="hg-section__label">템플릿</div>
              <div className="hg-templates">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    className={`hg-tpl${tpl === t.key ? " is-active" : ""}`}
                    onClick={() => setTpl(t.key)}
                  >
                    <span className="hg-tpl__glyph">{t.glyph}</span>
                    <span className="hg-tpl__name">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 문서 정보 */}
            <div className="hg-section">
              <div className="hg-section__label">문서 정보</div>

              <div className="hg-field">
                <label className="lx-label">제목</label>
                <input
                  className="lx-input"
                  value={f.title}
                  onChange={(e) => set({ title: e.target.value })}
                  placeholder="문서 제목"
                />
              </div>

              <div className="lx-grid lx-grid-2 hg-field">
                <div>
                  <label className="lx-label">수신</label>
                  <input
                    className="lx-input"
                    value={f.receiver}
                    onChange={(e) => set({ receiver: e.target.value })}
                    placeholder="수신처"
                  />
                </div>
                <div>
                  <label className="lx-label">발신 / 부서</label>
                  <input
                    className="lx-input"
                    value={f.sender}
                    onChange={(e) => set({ sender: e.target.value })}
                    placeholder="발신 부서"
                  />
                </div>
              </div>

              <div className="lx-grid lx-grid-2 hg-field">
                <div>
                  <label className="lx-label">문서번호</label>
                  <input
                    className="lx-input"
                    value={f.docNo}
                    onChange={(e) => set({ docNo: e.target.value })}
                    placeholder="문서번호"
                  />
                </div>
                <div>
                  <label className="lx-label">작성일</label>
                  <input
                    className="lx-input"
                    value={f.date}
                    onChange={(e) => set({ date: e.target.value })}
                    placeholder="2026. 08. 13."
                  />
                </div>
              </div>

              <div className="hg-field">
                <label className="lx-label">작성자 / 담당</label>
                <input
                  className="lx-input"
                  value={f.writer}
                  onChange={(e) => set({ writer: e.target.value })}
                  placeholder="담당자"
                />
              </div>
            </div>

            {/* 본문 항목 */}
            <div className="hg-section">
              <div className="hg-section__head">
                <div className="hg-section__label" style={{ marginBottom: 0 }}>본문 항목</div>
                <button
                  type="button"
                  className="lx-btn lx-btn--primary hg-ai-btn"
                  onClick={runDraft}
                  disabled={drafting}
                >
                  {drafting ? (
                    <>
                      <span className="lx-typing"><i /><i /><i /></span>
                      작성 중…
                    </>
                  ) : (
                    "✦ AI 초안 자동 작성"
                  )}
                </button>
              </div>

              {drafting ? (
                <div className="hg-body-fields">
                  {[0, 1, 2].map((i) => (
                    <div key={i}>
                      <div className="lx-skel" style={{ height: 12, width: "30%", marginBottom: 7 }} />
                      <div className="lx-skel" style={{ height: 60 }} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="hg-body-fields">
                  <div>
                    <label className="lx-label">{labels.b1}</label>
                    <textarea
                      className="lx-textarea"
                      style={{ minHeight: 66 }}
                      value={f.body1}
                      onChange={(e) => set({ body1: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="lx-label">{labels.b2}</label>
                    <textarea
                      className="lx-textarea"
                      style={{ minHeight: 66 }}
                      value={f.body2}
                      onChange={(e) => set({ body2: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="lx-label">{labels.b3}</label>
                    <textarea
                      className="lx-textarea"
                      style={{ minHeight: 66 }}
                      value={f.body3}
                      onChange={(e) => set({ body3: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* ---------------- 우: A4 미리보기 (책상 위 종이) ---------------- */}
        <section className="hg-canvas">
          <div className="hg-canvas__toolbar">
            <div className="hg-canvas__meta">
              <span className="hg-canvas__title">미리보기</span>
              <span className="hg-canvas__sub">A4 · HWPX · 210 × 297mm</span>
            </div>
            <div className="hg-canvas__actions">
              {exported && (
                <span className="lx-pill lx-pill--ok hg-export-done">
                  텍스트 다운로드 요청됨 · {meta.name}.txt
                </span>
              )}
              <button type="button" className="lx-btn lx-btn--ghost hg-export-btn" onClick={runExport}>
                ⬇ 본문 텍스트 다운로드
              </button>
            </div>
          </div>

          <div className="hg-desk">
            <div className="hg-paper-wrap">
              <Paper tpl={tpl} meta={meta} f={f} labels={labels} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * A4 종이 미리보기 (CSS로만 렌더)
 * ------------------------------------------------------------------ */
function Paper({
  tpl,
  meta,
  f,
  labels,
}: {
  tpl: TemplateKey;
  meta: { name: string; org: string };
  f: FormState;
  labels: { b1: string; b2: string; b3: string };
}) {
  return (
    <div
      className="hg-paper"
      style={{
        background: "#fff",
        aspectRatio: "1 / 1.414",
        width: "100%",
        borderRadius: 3,
        padding: "7% 8%",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Batang', 'Apple SD Gothic Neo', 'Malgun Gothic', serif",
        color: "#1a1a22",
        overflow: "hidden",
        containerType: "inline-size",
      }}
    >
      {/* 기관명 */}
      <div
        style={{
          textAlign: "center",
          fontSize: "clamp(15px, 4.4cqi, 26px)",
          fontWeight: 800,
          letterSpacing: "0.24em",
          paddingBottom: "3%",
        }}
      >
        {meta.org}
      </div>
      <div style={{ borderTop: "2.5px solid #1a1a22", margin: "0 0 3%" }} />

      {/* 문서번호 / 날짜 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "clamp(8px, 2.4cqi, 12px)",
          color: "#3a3a46",
          marginBottom: "5%",
        }}
      >
        <span>문서번호 {f.docNo || "—"}</span>
        <span>{f.date || "—"}</span>
      </div>

      {/* 제목 */}
      <div
        style={{
          textAlign: "center",
          fontSize: "clamp(14px, 4cqi, 22px)",
          fontWeight: 800,
          marginBottom: "6%",
          lineHeight: 1.3,
        }}
      >
        {f.title || "제목을 입력하세요"}
      </div>

      {/* 수신 / 발신 */}
      <div style={{ fontSize: "clamp(9px, 2.6cqi, 13px)", lineHeight: 1.9, marginBottom: "5%" }}>
        <div>
          <b style={{ display: "inline-block", width: "4.5em" }}>수신</b>
          {f.receiver || "—"}
        </div>
        <div>
          <b style={{ display: "inline-block", width: "4.5em" }}>발신</b>
          {f.sender || "—"}
        </div>
      </div>

      {/* 본문 항목 */}
      <div style={{ fontSize: "clamp(9px, 2.5cqi, 13px)", lineHeight: 1.75, flex: 1 }}>
        <BodyItem n="1." label={labels.b1} text={f.body1} />
        <BodyItem n="2." label={labels.b2} text={f.body2} />
        <BodyItem n="3." label={labels.b3} text={f.body3} />

        {/* 주간 보고서엔 요약 표 */}
        {tpl === "weekly" && (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: "4%",
              fontSize: "clamp(8px, 2.3cqi, 12px)",
            }}
          >
            <tbody>
              {[
                ["구분", "내용", "진척"],
                ["금주", "파이프라인 1차 배포", "100%"],
                ["차주", "템플릿 2종 추가", "예정"],
              ].map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      style={{
                        border: "1px solid #9a9aa8",
                        padding: "1.6% 2.4%",
                        fontWeight: ri === 0 ? 700 : 400,
                        background: ri === 0 ? "#f0f0f6" : "#fff",
                        textAlign: ci === 0 || ci === 2 ? "center" : "left",
                        width: ci === 0 ? "18%" : ci === 2 ? "18%" : "64%",
                      }}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 결어 + 서명란 */}
      <div style={{ marginTop: "auto", paddingTop: "5%" }}>
        <div
          style={{
            textAlign: "center",
            fontSize: "clamp(11px, 3.2cqi, 17px)",
            fontWeight: 800,
            letterSpacing: "0.18em",
            marginBottom: "4%",
          }}
        >
          {meta.org}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "6%",
            fontSize: "clamp(8px, 2.4cqi, 12px)",
          }}
        >
          <span>담당 {f.writer || "—"}</span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "clamp(24px, 7cqi, 40px)",
              height: "clamp(24px, 7cqi, 40px)",
              border: "1.5px solid #c0392b",
              borderRadius: "50%",
              color: "#c0392b",
              fontSize: "clamp(6px, 1.9cqi, 10px)",
              fontWeight: 700,
              letterSpacing: "0.05em",
            }}
          >
            (인)
          </span>
        </div>
      </div>
    </div>
  );
}

function BodyItem({ n, label, text }: { n: string; label: string; text: string }) {
  return (
    <div style={{ marginBottom: "3.5%" }}>
      <div style={{ fontWeight: 700, marginBottom: "0.6%" }}>
        {n} {label}
      </div>
      <div style={{ paddingLeft: "1.4em", whiteSpace: "pre-wrap" }}>{text || "—"}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 이 데모에만 적용되는 스코프 스타일 (.hg *) — 공통 lab.css 미변경
 * ------------------------------------------------------------------ */
function ScopedStyle() {
  return (
    <style>{`
      .hg { display: flex; flex-direction: column; height: calc(100vh - 190px); min-height: 560px; }

      /* ---- 툴바 ---- */
      .hg-bar {
        background: linear-gradient(180deg, #ffffff, #fbfbfe);
        min-height: 56px;
        flex: 0 0 auto;
      }
      .hg-bar__brand { display: flex; align-items: center; gap: 9px; min-width: 0; }
      .hg-bar__logo {
        display: inline-flex; align-items: center; justify-content: center;
        width: 30px; height: 30px; border-radius: 9px; font-size: 16px;
        background: var(--color-violet-soft, #efeefe);
        border: 1px solid var(--color-hairline);
      }
      .hg-bar__app { font-family: var(--font-geist); font-size: 15px; font-weight: 800; color: var(--color-ink); }
      .hg-bar__ver {
        font-family: var(--font-geist); font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
        color: var(--color-slate); background: var(--color-tint);
        border: 1px solid var(--color-hairline); border-radius: 6px; padding: 2px 7px;
      }
      .hg-bar__right { display: flex; align-items: center; gap: 10px; flex: 0 0 auto; }
      .hg-bar__doc {
        display: inline-flex; align-items: center; gap: 6px;
        font-family: var(--font-geist); font-size: 13px; font-weight: 700; color: var(--color-ash);
        background: #fff; border: 1px solid var(--color-hairline-strong);
        border-radius: 999px; padding: 5px 12px 5px 10px;
      }
      .hg-bar__doc-glyph { font-size: 13px; }
      .hg-bar__pill { display: inline-flex; align-items: center; gap: 6px; }
      .hg-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; opacity: .5; }
      .hg-dot--live { opacity: 1; animation: hg-pulse 1.4s ease-in-out infinite; }
      @keyframes hg-pulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: .4; } }

      /* ---- 편집기 레이아웃 ---- */
      .hg-editor {
        flex: 1 1 auto; min-height: 0;
        display: grid; grid-template-columns: minmax(340px, 400px) 1fr;
      }

      /* 좌 사이드 */
      .hg-side {
        border-right: 1px solid var(--color-hairline);
        background: #fcfcfe; min-height: 0; display: flex; flex-direction: column;
      }
      .hg-side__scroll { overflow-y: auto; padding: 18px; display: flex; flex-direction: column; gap: 20px; }
      .hg-section { display: block; }
      .hg-section__label {
        font-family: var(--font-geist); font-size: 11px; font-weight: 800;
        letter-spacing: 0.1em; text-transform: uppercase; color: var(--color-slate);
        margin-bottom: 10px;
      }
      .hg-section__head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 12px; }
      .hg-field { margin-bottom: 12px; }
      .hg-field:last-child { margin-bottom: 0; }
      .hg-body-fields { display: flex; flex-direction: column; gap: 12px; }

      /* 템플릿 카드 선택 */
      .hg-templates { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
      .hg-tpl {
        display: flex; flex-direction: column; align-items: center; gap: 6px;
        padding: 12px 6px; cursor: pointer; text-align: center;
        background: #fff; border: 1px solid var(--color-hairline-strong); border-radius: 12px;
        transition: all .15s ease;
      }
      .hg-tpl:hover { border-color: rgba(107,98,242,0.45); background: #fbfbff; }
      .hg-tpl__glyph { font-size: 20px; line-height: 1; }
      .hg-tpl__name { font-family: var(--font-geist); font-size: 12px; font-weight: 700; color: var(--color-ash); }
      .hg-tpl.is-active {
        background: var(--color-violet-soft, #efeefe);
        border-color: var(--color-dusk-violet);
        box-shadow: 0 0 0 3px rgba(107,98,242,0.12);
      }
      .hg-tpl.is-active .hg-tpl__name { color: var(--color-dusk-violet); }

      .hg-ai-btn { padding: 7px 13px; font-size: 12.5px; }

      /* ---- 우 캔버스 (책상) ---- */
      .hg-canvas { min-height: 0; display: flex; flex-direction: column; }
      .hg-canvas__toolbar {
        flex: 0 0 auto;
        display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
        padding: 11px 18px; border-bottom: 1px solid var(--color-hairline);
        background: #fff;
      }
      .hg-canvas__meta { display: flex; align-items: baseline; gap: 9px; min-width: 0; }
      .hg-canvas__title { font-family: var(--font-geist); font-size: 14px; font-weight: 700; color: var(--color-ink); }
      .hg-canvas__sub { font-size: 12px; color: var(--color-slate); }
      .hg-canvas__actions { display: flex; align-items: center; gap: 10px; }
      .hg-export-btn { padding: 8px 15px; font-size: 13px; }
      .hg-export-done { font-size: 12.5px; }

      .hg-desk {
        flex: 1 1 auto; min-height: 0; overflow-y: auto;
        display: flex; justify-content: center; align-items: flex-start;
        padding: 28px;
        background:
          radial-gradient(120% 80% at 50% 0%, rgba(107,98,242,0.06), transparent 60%),
          repeating-linear-gradient(45deg, #eceaf3 0 2px, transparent 2px 22px),
          #e9e8f0;
      }
      .hg-paper-wrap { width: 100%; max-width: 560px; }
      .hg-paper {
        box-shadow:
          0 1px 1px rgba(20,20,50,0.10),
          0 28px 60px -24px rgba(20,20,50,0.45),
          0 6px 18px -10px rgba(20,20,50,0.28);
      }

      /* ---- 반응형: 모바일에서 세로 스택 ---- */
      @media (max-width: 860px) {
        .hg { height: auto; min-height: 0; }
        .hg-editor { grid-template-columns: 1fr; }
        .hg-side { border-right: none; border-bottom: 1px solid var(--color-hairline); }
        .hg-side__scroll { overflow: visible; }
        .hg-desk { overflow: visible; padding: 20px 16px; }
      }
      @media (max-width: 560px) {
        .hg-templates { grid-template-columns: repeat(3, 1fr); }
        .hg-bar__ver, .hg-bar__doc { display: none; }
        .hg-canvas__actions { width: 100%; justify-content: space-between; }
      }
    `}</style>
  );
}
