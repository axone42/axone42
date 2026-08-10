"use client";

import { useState } from "react";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        const params = new URLSearchParams(window.location.search);
        const from = params.get("from") || "/admin/projects";
        window.location.href = from.startsWith("/admin") ? from : "/admin/projects";
      } else {
        setError(json.error ?? "로그인에 실패했습니다.");
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login">
      <form className="admin-login__card" onSubmit={handleSubmit}>
        <span className="nav__logo" aria-hidden style={{ width: 40, height: 40, borderRadius: 12 }} />
        <h1 className="admin-login__title">관리자 로그인</h1>
        <p className="admin-login__sub">에이엑스원(AXONE) 프로젝트 관리</p>
        <div className="field" style={{ marginTop: 8 }}>
          <label htmlFor="pw">비밀번호</label>
          <input
            id="pw"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="관리자 비밀번호"
            autoComplete="current-password"
            autoFocus
            required
          />
        </div>
        {error && <p className="form-status form-status--err" style={{ marginTop: 10 }}>⚠ {error}</p>}
        <button type="submit" className="btn btn--primary" style={{ width: "100%", justifyContent: "center", marginTop: 16 }} disabled={loading}>
          {loading ? "확인 중…" : "로그인"}
        </button>
      </form>
    </div>
  );
}
