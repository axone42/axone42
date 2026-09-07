"use client";

import { useEffect, useRef, useState } from "react";
import { csvCell, downloadText } from "@/lib/download";

type DocKey = "receipt" | "tax" | "card";

type Field = {
  key: string;
  label: string;
  value: string;
  conf: number; // 신뢰도 %
};

type LineItem = { name: string; qty: number; price: number; amount: number };

// 문서 위에 그릴 감지 박스 (문서 컨테이너 기준 % 좌표)
type Box = { top: number; left: number; width: number; height: number; color: string };

type DocData = {
  key: DocKey;
  tab: string;
  title: string; // 문서 헤더 상호명
  meta: string; // 부제
  fields: Field[];
  items: LineItem[] | null;
  boxes: Box[];
};

const won = (n: number) => n.toLocaleString("ko-KR") + "원";

const RECEIPT: DocData = {
  key: "receipt",
  tab: "영수증",
  title: "카페 모먼트",
  meta: "신용카드 매출전표",
  fields: [
    { key: "store", label: "상호", value: "카페 모먼트", conf: 99 },
    { key: "biz", label: "사업자번호", value: "214-88-01234", conf: 97 },
    { key: "date", label: "거래일자", value: "2026-08-13 14:22", conf: 98 },
    { key: "supply", label: "공급가액", value: "10,000원", conf: 96 },
    { key: "vat", label: "부가세", value: "1,000원", conf: 95 },
    { key: "total", label: "합계", value: "11,000원", conf: 99 },
    { key: "pay", label: "결제수단", value: "신용카드 (일시불)", conf: 94 },
  ],
  items: [
    { name: "아메리카노(ICE)", qty: 2, price: 3000, amount: 6000 },
    { name: "카페라떼", qty: 1, price: 4000, amount: 4000 },
  ],
  boxes: [
    { top: 5.5, left: 22, width: 56, height: 8, color: "#6b62f2" },
    { top: 20, left: 8, width: 62, height: 5, color: "#e08a2b" },
    { top: 26, left: 8, width: 70, height: 5, color: "#e08a2b" },
    { top: 44, left: 6, width: 88, height: 20, color: "#2f9d57" },
    { top: 74, left: 42, width: 52, height: 6, color: "#d64545" },
  ],
};

const TAX: DocData = {
  key: "tax",
  tab: "세금계산서",
  title: "(주)에이엑스원",
  meta: "전자세금계산서",
  fields: [
    { key: "store", label: "상호", value: "(주)에이엑스원", conf: 98 },
    { key: "biz", label: "사업자번호", value: "125-81-77042", conf: 99 },
    { key: "date", label: "작성일자", value: "2026-08-10", conf: 97 },
    { key: "supply", label: "공급가액", value: "3,000,000원", conf: 98 },
    { key: "vat", label: "부가세", value: "300,000원", conf: 98 },
    { key: "total", label: "합계", value: "3,300,000원", conf: 99 },
    { key: "pay", label: "결제수단", value: "계좌이체 (외상)", conf: 93 },
  ],
  items: [
    { name: "업무 자동화 구축", qty: 1, price: 2000000, amount: 2000000 },
    { name: "유지보수(월)", qty: 1, price: 1000000, amount: 1000000 },
  ],
  boxes: [
    { top: 4.5, left: 20, width: 60, height: 8, color: "#6b62f2" },
    { top: 20, left: 8, width: 60, height: 5, color: "#e08a2b" },
    { top: 26, left: 8, width: 66, height: 5, color: "#e08a2b" },
    { top: 44, left: 6, width: 88, height: 20, color: "#2f9d57" },
    { top: 76, left: 40, width: 54, height: 6, color: "#d64545" },
  ],
};

const CARD: DocData = {
  key: "card",
  tab: "명함",
  title: "김한별",
  meta: "AXONE · 솔루션 컨설턴트",
  fields: [
    { key: "name", label: "이름", value: "김한별", conf: 99 },
    { key: "company", label: "회사", value: "에이엑스원(AXONE)", conf: 98 },
    { key: "title", label: "직함", value: "솔루션 컨설턴트", conf: 96 },
    { key: "phone", label: "휴대전화", value: "010-2345-6789", conf: 97 },
    { key: "email", label: "이메일", value: "star@axone.io", conf: 95 },
    { key: "addr", label: "주소", value: "서울 강남구 테헤란로 123", conf: 92 },
  ],
  items: null,
  boxes: [
    { top: 20, left: 8, width: 40, height: 12, color: "#6b62f2" },
    { top: 36, left: 8, width: 56, height: 6, color: "#e08a2b" },
    { top: 58, left: 8, width: 50, height: 6, color: "#2f9d57" },
    { top: 68, left: 8, width: 46, height: 6, color: "#2f9d57" },
    { top: 78, left: 8, width: 62, height: 6, color: "#d64545" },
  ],
};

const DOCS: Record<DocKey, DocData> = { receipt: RECEIPT, tax: TAX, card: CARD };
const TABS: DocKey[] = ["receipt", "tax", "card"];

function confPill(conf: number) {
  if (conf >= 97) return "lx-pill lx-pill--ok";
  if (conf >= 94) return "lx-pill lx-pill--info";
  return "lx-pill lx-pill--warn";
}

// 신뢰도 막대 색 (구조적 표현용, 데이터/로직 불변)
function confColor(conf: number) {
  if (conf >= 97) return "#1f9d57";
  if (conf >= 94) return "#2f6bd6";
  return "#c98a12";
}

/* ---------- CSS로 그린 문서 (외부 이미지 없음) ---------- */
function ReceiptPaper({ doc }: { doc: DocData }) {
  const rowStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 12,
    padding: "3px 0",
    color: "#333",
  };
  return (
    <div
      style={{
        fontFamily: "var(--font-geist)",
        color: "#222",
        background: "#fff",
        padding: "18px 20px",
        borderRadius: 6,
        border: "1px solid #e6e6ec",
        lineHeight: 1.5,
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: "0.04em" }}>{doc.title}</div>
        <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{doc.meta}</div>
      </div>
      <div style={{ borderTop: "1px dashed #ccc", paddingTop: 8, fontSize: 12, color: "#555" }}>
        <div>사업자번호 : {doc.key === "tax" ? "125-81-77042" : "214-88-01234"}</div>
        <div>거래일자 : {doc.fields.find((f) => f.key === "date")?.value}</div>
      </div>
      <div style={{ borderTop: "1px dashed #ccc", borderBottom: "1px dashed #ccc", margin: "10px 0", padding: "8px 0" }}>
        {(doc.items || []).map((it, i) => (
          <div key={i} style={rowStyle}>
            <span>
              {it.name} <span style={{ color: "#999" }}>x{it.qty}</span>
            </span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>{won(it.amount)}</span>
          </div>
        ))}
      </div>
      <div style={{ ...rowStyle, color: "#555" }}>
        <span>공급가액</span>
        <span>{doc.fields.find((f) => f.key === "supply")?.value}</span>
      </div>
      <div style={{ ...rowStyle, color: "#555" }}>
        <span>부가세</span>
        <span>{doc.fields.find((f) => f.key === "vat")?.value}</span>
      </div>
      <div style={{ ...rowStyle, fontWeight: 800, fontSize: 14, borderTop: "1px solid #ddd", marginTop: 4, paddingTop: 6 }}>
        <span>합계</span>
        <span>{doc.fields.find((f) => f.key === "total")?.value}</span>
      </div>
      <div style={{ textAlign: "center", marginTop: 12, fontSize: 11, color: "#888" }}>
        결제 : {doc.fields.find((f) => f.key === "pay")?.value}
      </div>
    </div>
  );
}

function CardPaper({ doc }: { doc: DocData }) {
  return (
    <div
      style={{
        fontFamily: "var(--font-geist)",
        background: "linear-gradient(135deg,#ffffff,#f4f4fb)",
        border: "1px solid #e6e6ec",
        borderRadius: 10,
        padding: "26px 22px",
        minHeight: 210,
        position: "relative",
      }}
    >
      <div style={{ position: "absolute", top: 18, right: 20, width: 34, height: 34, borderRadius: 8, background: "var(--color-dusk-violet)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14 }}>
        AX
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: "#1a1a2a" }}>{doc.title}</div>
      <div style={{ fontSize: 12.5, color: "#6b62f2", fontWeight: 700, marginTop: 4 }}>{doc.meta}</div>
      <div style={{ borderTop: "1px solid #e2e2ea", margin: "16px 0 12px" }} />
      <div style={{ fontSize: 12.5, color: "#444", lineHeight: 1.9 }}>
        <div>📞 {doc.fields.find((f) => f.key === "phone")?.value}</div>
        <div>✉️ {doc.fields.find((f) => f.key === "email")?.value}</div>
        <div>📍 {doc.fields.find((f) => f.key === "addr")?.value}</div>
      </div>
    </div>
  );
}

export default function Demo() {
  const [activeDoc, setActiveDoc] = useState<DocKey>("receipt");
  const [status, setStatus] = useState<"idle" | "scanning" | "done">("idle");
  const [progress, setProgress] = useState(0);
  const [exported, setExported] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);

  const doc = DOCS[activeDoc];

  const clearAll = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (interval.current) {
      clearInterval(interval.current);
      interval.current = null;
    }
  };

  useEffect(() => clearAll, []);

  const switchDoc = (k: DocKey) => {
    if (k === activeDoc) return;
    clearAll();
    setActiveDoc(k);
    setStatus("idle");
    setProgress(0);
    setExported(false);
  };

  const run = () => {
    clearAll();
    setExported(false);
    setStatus("scanning");
    setProgress(0);
    interval.current = setInterval(() => {
      setProgress((p) => (p >= 100 ? 100 : p + 8));
    }, 70);
    timers.current.push(
      setTimeout(() => {
        clearAll();
        setProgress(100);
        setStatus("done");
      }, 1000)
    );
  };

  const exportSheet = () => {
    const rows: unknown[][] = [["샘플 데이터", doc.tab], ["항목", "값"], ...doc.fields.map((field) => [field.label, field.value])];
    if (doc.items) rows.push([], ["품목", "수량", "단가", "금액"], ...doc.items.map((item) => [item.name, item.qty, item.price, item.amount]));
    downloadText(`샘플-${doc.tab}.csv`, rows.map((row) => row.map(csvCell).join(",")).join("\r\n"), "text/csv;charset=utf-8");
    setExported(true);
    timers.current.push(setTimeout(() => setExported(false), 2200));
  };

  const scanning = status === "scanning";
  const done = status === "done";

  const statusLabel = scanning ? "스캔 중…" : done ? "인식 완료" : "대기";
  const statusPill = scanning ? "lx-pill--info" : done ? "lx-pill--ok" : "lx-pill--muted";

  return (
    <div className="lx-win ocrx">
      {/* 앱 툴바 */}
      <div className="lx-win__bar ocrx__bar">
        <div className="lx-win__title ocrx__brand">
          <span className="ocrx__logo" aria-hidden>
            🧾
          </span>
          <span className="ocrx__brand-text">
            <b>OCR 추출기</b>
            <small>Document Intelligence</small>
          </span>
        </div>

        <div className="ocrx__bar-right">
          <div className="ocrx__seg" role="tablist" aria-label="문서 종류">
            {TABS.map((k) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={activeDoc === k}
                className={`ocrx__seg-btn${activeDoc === k ? " is-active" : ""}`}
                onClick={() => switchDoc(k)}
              >
                {DOCS[k].tab}
              </button>
            ))}
          </div>
          <span className={`lx-pill ${statusPill} ocrx__status`}>
            <i className={`ocrx__dot ocrx__dot--${status}`} aria-hidden />
            {statusLabel}
          </span>
        </div>
      </div>

      <div className="lx-win__body">
        <div className="ocrx__grid">
          {/* LEFT: 문서 뷰어 (스캐너 프리뷰) */}
          <section className="ocrx__viewer">
            <div className="ocrx__viewer-head">
              <span className="ocrx__viewer-title">📄 원본 문서</span>
              <span className="ocrx__viewer-meta lx-mono">{doc.tab} · 1 페이지</span>
            </div>

            <div className="ocrx__scanner">
              {/* 스캐너 코너 마커 */}
              <span className="ocrx__corner ocrx__corner--tl" aria-hidden />
              <span className="ocrx__corner ocrx__corner--tr" aria-hidden />
              <span className="ocrx__corner ocrx__corner--bl" aria-hidden />
              <span className="ocrx__corner ocrx__corner--br" aria-hidden />

              <div className="ocrx__paper-wrap">
                {doc.key === "card" ? <CardPaper doc={doc} /> : <ReceiptPaper doc={doc} />}

                {/* 감지 바운딩 박스 (스캔/완료 시 표시) */}
                {(scanning || done) &&
                  doc.boxes.map((b, i) => (
                    <div
                      key={i}
                      style={{
                        position: "absolute",
                        top: `${b.top}%`,
                        left: `${b.left}%`,
                        width: `${b.width}%`,
                        height: `${b.height}%`,
                        border: `2px solid ${b.color}`,
                        borderRadius: 4,
                        background: `${b.color}18`,
                        boxShadow: `0 0 0 1px ${b.color}22`,
                        opacity: 0,
                        animation: `ocrBox .4s ease forwards`,
                        animationDelay: `${i * 0.12}s`,
                        pointerEvents: "none",
                      }}
                    />
                  ))}

                {/* 스캔 라인 */}
                {scanning && (
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      height: 3,
                      background: "linear-gradient(90deg, transparent, var(--color-dusk-violet), transparent)",
                      boxShadow: "0 0 14px 3px rgba(107,98,242,0.5)",
                      animation: "ocrScan 1s linear infinite",
                      pointerEvents: "none",
                    }}
                  />
                )}
              </div>
            </div>

            <div className="ocrx__runbar">
              {scanning && (
                <div className="ocrx__progress">
                  <div className="ocrx__progress-head">
                    <span className="lx-muted">필드 인식 중…</span>
                    <b className="lx-mono">{Math.min(progress, 100)}%</b>
                  </div>
                  <div className="lx-track">
                    <span className="lx-fill" style={{ width: `${Math.min(progress, 100)}%` }} />
                  </div>
                </div>
              )}
              <button
                type="button"
                className="lx-btn lx-btn--primary ocrx__run"
                onClick={run}
                disabled={scanning}
              >
                {scanning ? "추출 중…" : "✦ OCR 추출 실행"}
              </button>
            </div>
          </section>

          {/* RIGHT: 추출 결과 */}
          <aside className="ocrx__result">
            <div className="ocrx__result-head">
              <span className="ocrx__viewer-title">🔎 추출 데이터</span>
              {done && <span className="lx-pill lx-pill--ok">신뢰도 평균 96%</span>}
            </div>

            <div className="ocrx__result-body">
              {status === "idle" && (
                <div className="ocrx__empty">
                  <div className="ocrx__empty-icon" aria-hidden>
                    ⌁
                  </div>
                  <p className="ocrx__empty-title">추출 대기 중</p>
                  <p className="ocrx__empty-sub">
                    왼쪽에서 <b>OCR 추출 실행</b>을 누르면
                    <br />
                    문서 항목이 구조화 데이터로 채워집니다.
                  </p>
                </div>
              )}

              {scanning && (
                <div className="ocrx__skel-list">
                  {doc.fields.map((f) => (
                    <div key={f.key} className="ocrx__skel-row">
                      <div className="lx-skel" style={{ height: 14, width: "34%" }} />
                      <div className="lx-skel" style={{ height: 14, flex: 1 }} />
                    </div>
                  ))}
                </div>
              )}

              {done && (
                <>
                  {/* key-value 필드 */}
                  <div className="ocrx__fields">
                    {doc.fields.map((f) => (
                      <div key={f.key} className="ocrx__field">
                        <div className="ocrx__field-top">
                          <span className="ocrx__field-label">{f.label}</span>
                          <span className="ocrx__field-value">{f.value}</span>
                          <span className={`${confPill(f.conf)} ocrx__field-pill`}>{f.conf}%</span>
                        </div>
                        <div className="ocrx__confbar" aria-hidden>
                          <span
                            className="ocrx__confbar-fill"
                            style={{ width: `${f.conf}%`, background: confColor(f.conf) }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 품목 테이블 */}
                  {doc.items && (
                    <div className="ocrx__table-wrap">
                      <div className="ocrx__section-label">품목 명세</div>
                      <div style={{ overflowX: "auto" }}>
                        <table className="lx-table ocrx__table">
                          <thead>
                            <tr>
                              <th>품목</th>
                              <th style={{ textAlign: "right" }}>수량</th>
                              <th style={{ textAlign: "right" }}>단가</th>
                              <th style={{ textAlign: "right" }}>금액</th>
                            </tr>
                          </thead>
                          <tbody>
                            {doc.items.map((it, i) => (
                              <tr key={i}>
                                <td className="lx-strong">{it.name}</td>
                                <td style={{ textAlign: "right" }} className="lx-mono">
                                  {it.qty}
                                </td>
                                <td style={{ textAlign: "right" }} className="lx-mono">
                                  {won(it.price)}
                                </td>
                                <td style={{ textAlign: "right" }} className="lx-mono">
                                  {won(it.amount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {done && (
              <div className="ocrx__export">
                <button
                  type="button"
                  className={`lx-btn ${exported ? "lx-btn--ghost" : "lx-btn--primary"} ocrx__export-btn`}
                  onClick={exportSheet}
                >
                  {exported ? "CSV 다운로드 요청됨" : "📥 샘플 CSV 다운로드"}
                </button>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* 컴포넌트 로컬 스타일 + keyframes */}
      <style>{`
        .ocrx { display: flex; flex-direction: column; }

        /* ── 앱 툴바 ── */
        .ocrx__bar { flex-wrap: wrap; row-gap: 8px; padding: 8px 18px; }
        .ocrx__brand { gap: 10px; }
        .ocrx__logo {
          display: inline-flex; align-items: center; justify-content: center;
          width: 34px; height: 34px; border-radius: 9px; font-size: 17px;
          background: var(--color-violet-soft); border: 1px solid rgba(107,98,242,0.28);
        }
        .ocrx__brand-text { display: flex; flex-direction: column; line-height: 1.1; }
        .ocrx__brand-text b { font-size: 14px; font-weight: 800; color: var(--color-ink); }
        .ocrx__brand-text small { font-size: 10.5px; font-weight: 600; letter-spacing: 0.06em; color: var(--color-slate); text-transform: uppercase; }
        .ocrx__bar-right { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }

        .ocrx__seg { display: flex; gap: 2px; background: var(--color-tint); border: 1px solid var(--color-hairline); border-radius: 10px; padding: 3px; }
        .ocrx__seg-btn {
          font-family: var(--font-geist); font-size: 12.5px; font-weight: 700; color: var(--color-slate);
          border: none; background: transparent; border-radius: 7px; padding: 6px 13px; cursor: pointer;
          transition: all .15s ease;
        }
        .ocrx__seg-btn:hover { color: var(--color-ash); }
        .ocrx__seg-btn.is-active { background: #fff; color: var(--color-dusk-violet); box-shadow: var(--shadow-soft); }

        .ocrx__status { display: inline-flex; align-items: center; gap: 6px; }
        .ocrx__dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
        .ocrx__dot--scanning { animation: ocrPulse 1s ease-in-out infinite; }

        /* ── 본문 그리드 ── */
        .ocrx__grid {
          display: grid; grid-template-columns: 1.35fr 1fr; gap: 0;
          min-height: 560px;
        }
        .ocrx__viewer {
          display: flex; flex-direction: column; padding: 20px;
          background:
            linear-gradient(180deg, rgba(107,98,242,0.03), transparent 220px),
            var(--color-tint);
          border-right: 1px solid var(--color-hairline);
        }
        .ocrx__result { display: flex; flex-direction: column; padding: 20px; background: #fff; min-width: 0; }

        .ocrx__viewer-head, .ocrx__result-head {
          display: flex; align-items: center; justify-content: space-between; gap: 10px;
          margin-bottom: 14px;
        }
        .ocrx__viewer-title { font-family: var(--font-geist); font-size: 14px; font-weight: 700; color: var(--color-ink); }
        .ocrx__viewer-meta { font-size: 11.5px; color: var(--color-slate); }

        /* ── 스캐너 프리뷰 ── */
        .ocrx__scanner {
          position: relative; flex: 1; display: flex; align-items: flex-start; justify-content: center;
          padding: 26px; border-radius: 14px;
          background:
            radial-gradient(120% 80% at 50% 0%, rgba(107,98,242,0.06), transparent 60%),
            #f7f7fc;
          border: 1px solid var(--color-hairline);
          box-shadow: inset 0 1px 3px rgba(20,20,50,0.05);
        }
        .ocrx__paper-wrap {
          position: relative; width: 100%; max-width: 380px; overflow: hidden; border-radius: 8px;
          box-shadow: 0 18px 40px -22px rgba(20,20,50,0.35);
        }
        .ocrx__corner { position: absolute; width: 18px; height: 18px; border: 2px solid rgba(107,98,242,0.55); pointer-events: none; }
        .ocrx__corner--tl { top: 12px; left: 12px; border-right: none; border-bottom: none; border-radius: 5px 0 0 0; }
        .ocrx__corner--tr { top: 12px; right: 12px; border-left: none; border-bottom: none; border-radius: 0 5px 0 0; }
        .ocrx__corner--bl { bottom: 12px; left: 12px; border-right: none; border-top: none; border-radius: 0 0 0 5px; }
        .ocrx__corner--br { bottom: 12px; right: 12px; border-left: none; border-top: none; border-radius: 0 0 5px 0; }

        /* ── 실행 바 ── */
        .ocrx__runbar { margin-top: 16px; }
        .ocrx__progress { margin-bottom: 12px; }
        .ocrx__progress-head { display: flex; justify-content: space-between; font-size: 11.5px; margin-bottom: 5px; }
        .ocrx__run { width: 100%; }

        /* ── 결과 패널 ── */
        .ocrx__result-body { flex: 1; }

        .ocrx__empty {
          display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;
          gap: 6px; min-height: 320px; padding: 24px;
          border: 1px dashed var(--color-hairline-strong); border-radius: 14px; background: var(--color-tint);
        }
        .ocrx__empty-icon {
          width: 52px; height: 52px; display: flex; align-items: center; justify-content: center;
          font-size: 26px; color: var(--color-dusk-violet);
          background: var(--color-violet-soft); border-radius: 14px; margin-bottom: 4px;
        }
        .ocrx__empty-title { font-family: var(--font-geist); font-size: 15px; font-weight: 700; color: var(--color-ink); margin: 0; }
        .ocrx__empty-sub { font-size: 12.5px; color: var(--color-slate); margin: 0; line-height: 1.6; }

        .ocrx__skel-list { display: flex; flex-direction: column; gap: 14px; padding-top: 4px; }
        .ocrx__skel-row { display: flex; justify-content: space-between; gap: 10px; }

        /* key-value 필드 (신뢰도 막대 포함) */
        .ocrx__fields { display: flex; flex-direction: column; gap: 2px; }
        .ocrx__field { padding: 10px 0; border-bottom: 1px solid var(--color-tint); animation: ocrFieldIn .35s ease both; }
        .ocrx__field-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .ocrx__field-label { font-size: 12px; color: var(--color-slate); min-width: 84px; }
        .ocrx__field-value {
          flex: 1; text-align: right; font-size: 13.5px; font-weight: 600; color: var(--color-ink);
          font-family: var(--font-geist);
        }
        .ocrx__field-pill { min-width: 44px; text-align: center; }
        .ocrx__confbar { height: 3px; border-radius: 3px; background: var(--color-tint); margin-top: 7px; overflow: hidden; }
        .ocrx__confbar-fill { display: block; height: 100%; border-radius: 3px; animation: ocrBarGrow .5s ease both; }

        /* 품목 테이블 */
        .ocrx__table-wrap { margin-top: 18px; }
        .ocrx__section-label {
          font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
          color: var(--color-slate); margin-bottom: 8px;
        }
        .ocrx__table { border: 1px solid var(--color-hairline); border-radius: 10px; overflow: hidden; }

        /* 내보내기 */
        .ocrx__export { margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--color-hairline); }
        .ocrx__export-btn { width: 100%; }

        /* ── 반응형 ── */
        @media (max-width: 860px) {
          .ocrx__grid { grid-template-columns: 1fr; min-height: 0; }
          .ocrx__viewer { border-right: none; border-bottom: 1px solid var(--color-hairline); }
          .ocrx__paper-wrap { max-width: 320px; }
        }
        @media (max-width: 520px) {
          .ocrx__bar-right { width: 100%; justify-content: space-between; }
          .ocrx__seg { flex: 1; }
          .ocrx__seg-btn { flex: 1; }
        }

        /* ── keyframes ── */
        @keyframes ocrScan {
          0% { top: 4%; }
          100% { top: 92%; }
        }
        @keyframes ocrBox {
          0% { opacity: 0; transform: scale(0.96); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes ocrPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }
        @keyframes ocrFieldIn {
          0% { opacity: 0; transform: translateY(4px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes ocrBarGrow {
          0% { width: 0 !important; }
        }
      `}</style>
    </div>
  );
}
