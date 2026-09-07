import Link from "next/link";
import { caseStudies } from "@/lib/showcase";
export default function CaseStudies() {
  return <div className="demo-grid">{caseStudies.map((cs) => <article className="demo-card" key={cs.id}>
    <div className={`demo-preview demo-preview--${cs.id}`}>
      <span className="demo-label">자체 제작 · 화면 시연</span>
      <div className="demo-flow">{cs.flow.map((step,i) => <div key={step}><span>{String(i+1).padStart(2,"0")}</span><b>{step}</b></div>)}</div>
    </div>
    <div className="demo-card__body"><p className="eyebrow">{cs.industry}</p><h3>{cs.title}</h3><p>{cs.summary}</p><p className="demo-scope">{cs.scope}</p><Link className="card__link" href={cs.href}>데모 직접 사용하기 →</Link></div>
  </article>)}</div>;
}
