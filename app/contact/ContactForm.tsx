"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { resolveIntent, selectedItems, serviceIntents, estimateText } from "@/lib/pricing";
import { validateContact, type ContactErrors } from "@/lib/contact-validation";
import { site } from "@/lib/site";
import ServicePicker from "@/components/ServicePicker";
import EstimateSummary from "@/components/EstimateSummary";
import { inquiryProject } from "@/lib/project-inquiry";
import { trackConversion } from "@/lib/analytics";

function formatPhone(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.startsWith("02")) {
    if (d.length < 3) return d;
    if (d.length < 6) return `${d.slice(0, 2)}-${d.slice(2)}`;
    if (d.length < 10) return `${d.slice(0, 2)}-${d.slice(2, d.length - 4)}-${d.slice(d.length - 4)}`;
    return `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6, 10)}`;
  }
  if (d.length < 4) return d;
  if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`;
  if (d.length < 11) return `${d.slice(0, 3)}-${d.slice(3, d.length - 4)}-${d.slice(d.length - 4)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7, 11)}`;
}

export default function ContactForm({ mailAvailable = true }: { mailAvailable?: boolean }) {
  const params = useSearchParams();
  const [ids, setIds] = useState<string[]>([]);
  const [topic, setTopic] = useState("");
  const [projectId, setProjectId] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<ContactErrors>({});
  const [status, setStatus] = useState<{state:"idle"|"loading"|"ok"|"error"|"draft"; message?:string}>({state:"idle"});
  const [emailDraft, setEmailDraft] = useState("");
  const submitting = useRef(false);
  const started = useRef(false);
  useEffect(() => {
    const intent = resolveIntent(new URLSearchParams(params.toString()));
    setIds(intent.ids); setTopic(intent.topic);
    setProjectId(inquiryProject(params.get("project"))?.id ?? "");
    setEmailDraft(""); setStatus({state:"idle"});
  }, [params]);
  const toggle = (id: string) => {
    setEmailDraft(""); setStatus({state:"idle"});
    trackConversion(ids.includes(id) ? "service_deselect" : "service_select", { service_id: id, source: "contact" });
    const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
    setIds(next);
    const intent = Object.values(serviceIntents).find((s) => s.title === topic);
    if (intent && !next.includes(intent.item)) setTopic("");
  };
  const chosen = selectedItems(ids);
  const project = inquiryProject(projectId);
  const analyticsContext = {
    project_id: projectId || undefined,
    service_id: Object.entries(serviceIntents).find(([, intent]) => intent.title === topic)?.[0] || (ids.length === 1 ? ids[0] : ids.length ? "multiple" : "undecided"),
  };
  const errorFor = (field: keyof ContactErrors) => errors[field] && <p className="field-error" id={`${field}-error`}>{errors[field]}</p>;
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting.current) return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      name: String(fd.get("name") ?? ""), email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? ""), company: String(fd.get("company") ?? ""),
      message: String(fd.get("message") ?? ""), agree: fd.get("agree") === "on",
      items: ids, topic, project: projectId, company_website: String(fd.get("company_website") ?? ""),
    };
    const nextErrors = validateContact(payload);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      trackConversion("contact_error", { reason: "validation" });
      setStatus({state:"error",message:"입력 내용을 확인해 주세요."});
      (form.elements.namedItem(Object.keys(nextErrors)[0]) as HTMLElement | null)?.focus();
      return;
    }
    const emailBody = [
      `이름: ${payload.name}`, `이메일: ${payload.email}`, `연락처: ${payload.phone || "-"}`, `회사/소속: ${payload.company || "-"}`,
      `관심 서비스: ${[topic, ...chosen.map(p => p.name)].filter(Boolean).join(" · ") || "무료 상담 · 서비스 미정"}`,
      `관심 프로젝트: ${project?.title || "-"}`, `예상 비용: ${estimateText(ids) || "상담 후 안내"}`, "", "문의 내용:", payload.message,
    ].join("\n");
    setEmailDraft(`mailto:${site.email}?subject=${encodeURIComponent(`[AXONE 상담] ${project?.title || topic || "무료 상담"}`)}&body=${encodeURIComponent(emailBody)}`);
    if (!mailAvailable) {
      trackConversion("email_draft", analyticsContext);
      setStatus({state:"draft",message:"문의 내용을 이메일로 정리했습니다. 아래 버튼으로 메일 앱을 열고 전송을 완료해 주세요. 아직 상담이 접수된 상태는 아닙니다."});
      return;
    }
    submitting.current = true;
    trackConversion("contact_submit", analyticsContext);
    setStatus({state:"loading"});
    try {
      const res = await fetch("/api/contact", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      const json = await res.json();
      if (res.ok && json.ok) {
        if (json.ticketId !== "AX-OK") trackConversion("generate_lead", analyticsContext);
        started.current = false;
        setStatus({state:"ok",message:`${json.message} (접수번호 ${json.ticketId})`});
        form.reset(); setPhone(""); setIds([]); setTopic(""); setProjectId("");
      } else {
        trackConversion("contact_error", { reason: "server" });
        setErrors(json.fieldErrors ?? {});
        setStatus({state:"error",message:json.error ?? "접수하지 못했습니다. 입력 내용은 유지됩니다. 잠시 후 다시 시도해 주세요."});
      }
    } catch { trackConversion("contact_error", { reason: "network" }); setStatus({state:"error",message:"연결이 원활하지 않아 접수 여부를 확인하지 못했습니다. 잠시 후 다시 시도하거나 이메일로 문의해 주세요."}); }
    finally { submitting.current = false; }
  }
  return <div className="contact-layout">
    <form onSubmit={handleSubmit} onChangeCapture={() => { setEmailDraft(""); if (status.state === "draft") setStatus({state:"idle"}); if (!started.current) { started.current = true; trackConversion("contact_start", analyticsContext); } }} noValidate className="contact-main">
      <fieldset disabled={status.state === "loading"} className="contact-fields">
        <div className="contact-interest">
          <h2>어떤 도움이 필요하신가요?</h2>
          {project && <div className="contact-project"><span>관심 프로젝트: <strong>{project.title}</strong></span><button type="button" className="text-button" onClick={() => { setProjectId(""); setEmailDraft(""); setStatus({state:"idle"}); }}>프로젝트 선택 해제</button><small>어떤 부분을 업무에 적용하고 싶은지 아래에 적어 주세요.</small></div>}
          <p>{topic || (chosen.length ? chosen.map((p) => p.name).join(" · ") : "아직 잘 모르겠어요 · 업무 상황만 알려주세요.")}</p>
          <details className="contact-choice"><summary>{chosen.length ? "선택 서비스 수정" : "서비스를 직접 선택하고 싶어요"}</summary>
            <button type="button" className="text-button" onClick={() => { setIds([]); setTopic(""); setEmailDraft(""); setStatus({state:"idle"}); }}>아직 잘 모르겠어요 · 선택 해제</button>
            <ServicePicker ids={ids} onToggle={toggle} />
          </details>
          {chosen.length > 0 && <details className="contact-choice"><summary>예상 비용 확인 · 초기비와 월비</summary><EstimateSummary ids={ids} /></details>}
        </div>
        {!mailAvailable && <p className="form-note">현재 이메일로 상담을 받고 있습니다. 아래 내용을 작성하면 메일에 담을 내용을 정리해 드립니다. 메일 앱에서 보내기를 눌러 접수를 완료해 주세요.</p>}
        <div className="form-grid">
          <div className="field"><label htmlFor="name">이름 *</label><input id="name" name="name" autoComplete="name" placeholder="홍길동" maxLength={100} required aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-error" : undefined} />{errorFor("name")}</div>
          <div className="field"><label htmlFor="email">이메일 *</label><input id="email" name="email" type="email" autoComplete="email" placeholder="you@company.com" maxLength={254} required aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-error" : undefined} />{errorFor("email")}</div>
          <div className="field"><label htmlFor="phone">연락처 (선택)</label><input id="phone" name="phone" type="tel" inputMode="numeric" autoComplete="tel" placeholder="010-0000-0000" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} /></div>
          <div className="field"><label htmlFor="company">회사 / 소속 (선택)</label><input id="company" name="company" autoComplete="organization" maxLength={200} placeholder="회사 또는 팀 이름" /></div>
          <div className="field field--full"><label htmlFor="message">문의 내용 *</label><textarea id="message" name="message" placeholder="예: 매일 주문 정보를 엑셀에 옮기고 있습니다. 지금 쓰는 도구와 줄이고 싶은 업무를 알려주세요." maxLength={5000} required aria-invalid={!!errors.message} aria-describedby={errors.message ? "message-error" : undefined} />{errorFor("message")}</div>
        </div>
        <div aria-hidden style={{position:"absolute",left:"-9999px",width:1,height:1,overflow:"hidden"}}><label htmlFor="company_website">Company Website</label><input id="company_website" name="company_website" tabIndex={-1} autoComplete="off" /></div>
        <label className="consent"><input id="agree" type="checkbox" name="agree" required aria-invalid={!!errors.agree} aria-describedby={errors.agree ? "agree-error" : undefined} /><span><Link href="/privacy" target="_blank" className="consent__link">개인정보 수집·이용</Link>에 동의합니다. (상담 목적, 이름·연락처·이메일·문의 내용, 3년 보관) *</span></label>
        {errorFor("agree")}
        <button type="submit" className="btn btn--primary contact-submit">{status.state === "loading" ? "접수 중…" : mailAvailable ? "무료 상담 신청" : "이메일 상담 내용 정리하기"}</button>
      </fieldset>
      {status.state === "error" && <div className="form-feedback form-feedback--error" role="alert"><p>{status.message}</p><a href={emailDraft || `mailto:${site.email}`}>이메일로 문의하기 →</a></div>}
      {status.state === "draft" && <div className="form-feedback" role="status"><p>{status.message}</p><a className="btn btn--primary" href={emailDraft}>이메일 작성 화면 열기 →</a><p>메일 앱을 사용하지 않는다면 위 내용을 복사해 {site.email}으로 보내 주세요.</p></div>}
      {status.state === "ok" && <div className="form-feedback" role="status">{status.message}</div>}
      <p className="form-note">상담 신청만으로 비용이 발생하지 않습니다. 유료 작업은 범위와 견적에 동의하신 후 시작합니다.</p>
    </form>
    <aside className="contact-aside">
      <p className="eyebrow">다음 단계</p><h2>상담은 이렇게 진행됩니다</h2>
      <ol className="flowsteps"><li>남겨주신 업무와 문의 내용을 확인합니다.</li><li>영업일 기준 1~2일 내 이메일 또는 연락처로 답변드립니다.</li><li>필요한 범위·예상 일정·비용을 함께 정합니다.</li></ol>
      <hr /><h3>직접 연락하기</h3><a className="contact-email" href={`mailto:${site.email}`}>{site.email}</a>
      <p>에이엑스원 · 대표 {site.ceo}</p><p>{site.address}</p>
    </aside>
  </div>;
}
