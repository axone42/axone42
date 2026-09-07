"use client";

import { useEffect, useMemo, useState } from "react";
import {
  projects as seedProjects,
  PROJECT_CATEGORIES,
  type Project,
  type ProjectStatus,
} from "@/lib/projects";

const STATUSES: ProjectStatus[] = ["공개", "진행 중", "예정"];

// 태그로 선택할 수 있는 마스터 기술 스택 목록
const MASTER_STACK: string[] = [
  "n8n", "OpenAI", "GPT", "Claude", "LangGraph", "LangChain", "RAG", "Whisper", "OCR",
  "Python", "TypeScript", "JavaScript", "Node.js",
  "Next.js", "React", "Tailwind CSS", "Vite",
  "PostgreSQL", "Supabase", "Redis", "MongoDB", "Prisma", "DB", "Vector DB",
  "AWS", "Vercel", "Railway", "Cloudflare", "Docker", "Nginx",
  "GitHub", "Git", "Cursor", "Notion", "Slack", "Figma", "Stripe",
  "Telegram", "Gmail", "Google Sheets", "Sheets", "Meta Ads", "LinkedIn API", "Threads",
  "스크래핑", "Webhook", "HWPX", "Chart", "WebSocket", "증권 API", "News API", "backtest", "pandas",
];

const STORAGE_KEY = "axone_admin_projects";

function loadProjects(): Project[] {
  if (typeof window === "undefined") return seedProjects;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Project[];
  } catch {}
  return seedProjects;
}

export default function AdminProjectsPage() {
  const [list, setList] = useState<Project[]>(seedProjects);
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    setList(loadProjects());
    setLoaded(true);
  }, []);

  // 변경 시 자동 저장
  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {}
  }, [list, loaded]);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2000);
  };

  const update = (i: number, patch: Partial<Project>) =>
    setList((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));

  const toggleTag = (i: number, tag: string) =>
    setList((prev) =>
      prev.map((p, idx) => {
        if (idx !== i) return p;
        const has = p.stack.includes(tag);
        return { ...p, stack: has ? p.stack.filter((t) => t !== tag) : [...p.stack, tag] };
      })
    );

  const addCustomTag = (i: number, tag: string) => {
    const t = tag.trim();
    if (!t) return;
    setList((prev) =>
      prev.map((p, idx) => (idx === i && !p.stack.includes(t) ? { ...p, stack: [...p.stack, t] } : p))
    );
  };

  const remove = (i: number) => {
    if (!window.confirm("이 프로젝트를 삭제할까요?")) return;
    setList((prev) => prev.filter((_, idx) => idx !== i));
  };

  const addNew = () => {
    const p: Project = {
      id: `new-${list.length + 1}`,
      title: "새 프로젝트",
      en: "New Project",
      category: PROJECT_CATEGORIES[0],
      status: "예정",
      summary: "",
      highlights: [],
      stack: [],
    };
    setList((prev) => [p, ...prev]);
  };

  const resetDefaults = () => {
    if (!window.confirm("기본값(코드에 저장된 상태)으로 되돌릴까요? 편집 내용이 사라집니다.")) return;
    setList(seedProjects);
    flash("기본값으로 초기화했습니다");
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  };

  const tsCode = useMemo(() => toTsLiteral(list), [list]);

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      flash(`${label} 복사됨`);
    } catch {
      flash("복사 실패 — 브라우저 권한을 확인해 주세요");
    }
  };

  if (!loaded) return null;

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 80, maxWidth: 900 }}>
      <p className="eyebrow">Admin</p>
      <a href="/admin/inquiries" className="btn btn--ghost" style={{ marginBottom: 16 }}>상담 접수함으로 이동</a>
      <h1 className="page-hero__title" style={{ fontSize: 40, margin: "8px 0 12px" }}>자체 프로젝트 관리</h1>
      <div className="admin-banner">
        편집 내용은 이 브라우저에 자동 저장됩니다. <b>라이브 사이트에 반영하려면</b> 아래
        <b> ‘코드 복사’</b>를 눌러 담당자에게 전달하거나 <code>lib/projects.ts</code>에 붙여넣어 배포하세요.
      </div>

      <div className="admin-actions">
        <button className="btn btn--primary" onClick={addNew}>+ 새 프로젝트</button>
        <button className="btn btn--ghost" onClick={() => copy(tsCode, "TypeScript 코드")}>코드 복사 (TS)</button>
        <button className="btn btn--ghost" onClick={() => copy(JSON.stringify(list, null, 2), "JSON")}>JSON 복사</button>
        <button className="btn btn--ghost" onClick={resetDefaults}>기본값 복원</button>
        <button className="btn btn--ghost" onClick={logout} style={{ marginLeft: "auto" }}>로그아웃</button>
        {toast && <span className="admin-toast">✓ {toast}</span>}
      </div>

      <div className="admin-list">
        {list.map((p, i) => (
          <div className="admin-card" key={i}>
            <div className="admin-row2">
              <label className="field"><span>프로젝트명</span>
                <input value={p.title} onChange={(e) => update(i, { title: e.target.value })} />
              </label>
              <label className="field"><span>영문명 (en)</span>
                <input value={p.en} onChange={(e) => update(i, { en: e.target.value })} />
              </label>
            </div>

            <div className="admin-row3">
              <label className="field"><span>카테고리</span>
                <select value={p.category} onChange={(e) => update(i, { category: e.target.value as Project["category"] })}>
                  {PROJECT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <label className="field"><span>상태</span>
                <select value={p.status} onChange={(e) => update(i, { status: e.target.value as ProjectStatus })}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <label className="field admin-check">
                <input type="checkbox" checked={!!p.recommended} onChange={(e) => update(i, { recommended: e.target.checked })} />
                <span>★ 추천/공개 상단 노출</span>
              </label>
            </div>

            <label className="field"><span>요약 (카드 문구)</span>
              <textarea value={p.summary} onChange={(e) => update(i, { summary: e.target.value })} style={{ minHeight: 60 }} />
            </label>
            <label className="field"><span>상세 설명 (모달)</span>
              <textarea value={p.detail ?? ""} onChange={(e) => update(i, { detail: e.target.value })} style={{ minHeight: 80 }} />
            </label>
            <label className="field"><span>핵심 기능 (줄바꿈으로 구분)</span>
              <textarea
                value={p.highlights.join("\n")}
                onChange={(e) => update(i, { highlights: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })}
                style={{ minHeight: 80 }}
              />
            </label>

            {/* 기술 스택 태그 토글 */}
            <div className="field">
              <span>사용 기술 스택 — 태그를 눌러 선택/해제</span>
              <div className="filterbar" style={{ marginTop: 8 }}>
                {MASTER_STACK.map((tag) => {
                  const on = p.stack.includes(tag);
                  return (
                    <button
                      type="button"
                      key={tag}
                      className={`filter-chip${on ? " is-active" : ""}`}
                      onClick={() => toggleTag(i, tag)}
                    >
                      {on ? "✓ " : ""}{tag}
                    </button>
                  );
                })}
              </div>
              <CustomTagInput onAdd={(t) => addCustomTag(i, t)} />
              {p.stack.some((t) => !MASTER_STACK.includes(t)) && (
                <p className="admin-hint">직접 추가한 태그: {p.stack.filter((t) => !MASTER_STACK.includes(t)).join(", ")}</p>
              )}
            </div>

            <div className="admin-row2">
              <label className="field"><span>GitHub 저장소 URL</span>
                <input value={p.repoUrl ?? ""} placeholder="https://github.com/..." onChange={(e) => update(i, { repoUrl: e.target.value || undefined })} />
              </label>
              <label className="field"><span>데모 사이트 URL</span>
                <input value={p.demoUrl ?? ""} placeholder="https://..." onChange={(e) => update(i, { demoUrl: e.target.value || undefined })} />
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
              <span className="admin-hint">id: {p.id} · 스택 {p.stack.length}개</span>
              <button className="btn btn--ghost" style={{ color: "#d64545", borderColor: "rgba(214,69,69,.4)" }} onClick={() => remove(i)}>삭제</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CustomTagInput({ onAdd }: { onAdd: (t: string) => void }) {
  const [v, setV] = useState("");
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
      <input
        className="admin-input"
        placeholder="목록에 없는 기술 직접 추가"
        value={v}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); onAdd(v); setV(""); }
        }}
      />
      <button type="button" className="btn btn--ghost" onClick={() => { onAdd(v); setV(""); }}>추가</button>
    </div>
  );
}

// projects 배열을 lib/projects.ts에 붙여넣을 수 있는 TS 리터럴로 직렬화
function toTsLiteral(list: Project[]): string {
  const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const body = list
    .map((p) => {
      const lines: string[] = [];
      lines.push(`  {`);
      lines.push(`    id: "${esc(p.id)}",`);
      lines.push(`    title: "${esc(p.title)}",`);
      lines.push(`    en: "${esc(p.en)}",`);
      lines.push(`    category: "${esc(p.category)}",`);
      lines.push(`    status: "${esc(p.status)}",`);
      if (p.recommended) lines.push(`    recommended: true,`);
      lines.push(`    summary: "${esc(p.summary)}",`);
      if (p.detail) lines.push(`    detail: "${esc(p.detail)}",`);
      lines.push(`    highlights: [${p.highlights.map((h) => `"${esc(h)}"`).join(", ")}],`);
      lines.push(`    stack: [${p.stack.map((t) => `"${esc(t)}"`).join(", ")}],`);
      if (p.repoUrl) lines.push(`    repoUrl: "${esc(p.repoUrl)}",`);
      if (p.demoUrl) lines.push(`    demoUrl: "${esc(p.demoUrl)}",`);
      lines.push(`  },`);
      return lines.join("\n");
    })
    .join("\n");
  return `export const projects: Project[] = [\n${body}\n];`;
}
