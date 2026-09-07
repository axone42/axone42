import Link from "next/link";
import Reveal from "@/components/Reveal";
import { WorkflowMockup, DashboardMockup, ChatMockup } from "@/components/Mockup";
import TechStack from "@/components/TechStack";
import CaseStudies from "@/components/CaseStudies";
import Faq from "@/components/Faq";
import ServiceIcon from "@/components/ServiceIcon";
import { site, stats } from "@/lib/site";
import { services } from "@/lib/services";

const heroBullets = [
  "AX 전략 컨설팅 · 프로젝트 수행",
  "기업형 챗봇 제작",
  "AI 자동화 운영",
  "홈페이지·프로그램 제작",
  "바이브코딩 · AI 자동화 강의",
];

const handles = [
  { name: "반복 업무 자동화", desc: "수집·분류·응답·리포트까지 사람 손을 떠나게 합니다." },
  { name: "AI 도입 전략 수립", desc: "어디에, 어떻게 AI를 넣을지 우선순위와 ROI로 설계합니다." },
  { name: "맞춤형 워크플로우 구축", desc: "현업에 딱 맞는 n8n 워크플로우를 설계·구축·운영합니다." },
  { name: "홈페이지 · 프로그램 제작", desc: "기획부터 개발, 배포까지 실제 제품으로 완성합니다." },
  { name: "사내 AI 역량 내재화", desc: "바이브코딩·자동화 강의로 팀이 스스로 만들게 합니다." },
  { name: "운영 · 모니터링", desc: "구축 후에도 안정적으로 돌아가도록 함께 관리합니다." },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-content">
            <span className="hero__badge">✦ AI Transformation Partner</span>
            <h1 className="hero__title">
              기업의 AX를<br />설계하고 실행합니다
            </h1>
            <p className="hero__sub">
              에이엑스원(AXONE)은 AX 컨설팅을 중심으로 AI 자동화 운영, 홈페이지·프로그램 제작,
              실무 교육까지 한 곳에서 제공하는 AI 트랜스포메이션 파트너입니다.
            </p>
            <ul className="hero__bullets">
              {heroBullets.map((b) => (
                <li key={b} className="hero__bullet">
                  <span className="dot">✓</span>
                  {b}
                </li>
              ))}
            </ul>
            <div className="hero__actions">
              <Link href="/contact" className="btn btn--light">
                무료 상담 신청
              </Link>
              <Link href="/services" className="btn btn--ghost">
                서비스 살펴보기
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="section--tight">
        <div className="container">
          <Reveal className="stats">
            {stats.map((s) => (
              <div key={s.label} className="stat">
                <div className="stat__num">{s.num}</div>
                <div className="stat__label">{s.label}</div>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Clients */}
      <section className="section--tight">
        <div className="container">
          <Reveal>
            <p className="eyebrow" style={{ textAlign: "center", marginBottom: 24 }}>
              우리가 사용하는 기술 스택
            </p>
          </Reveal>
          <TechStack />
        </div>
      </section>

      {/* Services overview */}
      <section className="section" id="services">
        <div className="container">
          <Reveal>
            <p className="eyebrow">Services</p>
            <h2 className="section-title">핵심 서비스 라인업</h2>
            <p className="section-lead">
              전략·자동화부터 쇼핑몰·챗봇·시스템 개발, 교육까지.
              <br />
              AX 여정의 모든 단계를 함께합니다.
            </p>
          </Reveal>

          <div className="cards" style={{ marginTop: 40 }}>
            {services.map((svc, i) => (
              <Reveal key={svc.id} delay={i * 60}>
                <Link href={`/services#${svc.id}`} className="card" style={{ height: "100%" }}>
                  {svc.tags && (
                    <div className="card__tags">
                      {svc.tags.slice(0, 4).map((t) => (
                        <span key={t} className="minitag">{t}</span>
                      ))}
                    </div>
                  )}
                  <span className="card__icon"><ServiceIcon id={svc.id} /></span>
                  <h3 className="card__title">{svc.title}</h3>
                  <p className="card__body">{svc.summary}</p>
                  <span className="card__link">자세히 보기</span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Product reveal — 전환 사례 + 결과물 화면 */}
      <section className="section">
        <div className="container">
          <Reveal>
            <p className="eyebrow">How it works</p>
            <h2 className="section-title">눈으로 보는 결과물</h2>
            <p className="section-lead">
              실제 AX 전환 사례와 결과물 화면을 함께 확인하세요.
            </p>
          </Reveal>

          {/* AX 전환 사례 (결과물 화면 위) */}
          <Reveal><h3 className="showcase__subtitle">AX 전환 사례</h3></Reveal>
          <div style={{ marginTop: 20 }}>
            <CaseStudies />
          </div>
          <p className="sample-note">* 표기된 고객사·성과·평가는 예시(샘플) 데이터입니다. 각 카드를 누르면 구현 방식과 평가를 볼 수 있습니다.</p>

          {/* 결과물 화면 */}
          <Reveal><h3 className="showcase__subtitle" style={{ marginTop: 52 }}>결과물 화면</h3></Reveal>
          <div className="showcase">
            <Reveal><WorkflowMockup /></Reveal>
            <div className="showcase__split">
              <Reveal delay={80}><DashboardMockup /></Reveal>
              <Reveal delay={160}><ChatMockup /></Reveal>
            </div>
          </div>
        </div>
      </section>

      <div className="container">
        <div className="glow-strip" />
      </div>

      {/* What we handle */}
      <section className="section">
        <div className="container">
          <Reveal>
            <p className="eyebrow">What we handle</p>
            <h2 className="section-title">AXONE가 대신 해결합니다</h2>
          </Reveal>

          <div className="numbered" style={{ marginTop: 32 }}>
            {handles.map((h, i) => (
              <Reveal key={h.name} as="div" className="numbered__row" delay={i * 40}>
                <div>
                  <div className="numbered__name">{h.name}</div>
                  <div className="numbered__desc">{h.desc}</div>
                </div>
                <div className="numbered__num">{String(i + 1).padStart(2, "0")}</div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section">
        <div className="container">
          <Reveal>
            <p className="eyebrow">FAQ</p>
            <h2 className="section-title">자주 묻는 질문</h2>
            <p className="section-lead">비용·기간부터 연동·운영까지, 자주 받는 질문을 모았습니다.</p>
          </Reveal>
          <div style={{ marginTop: 32 }}>
            <Faq />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="container">
          <Reveal className="cta-band">
            <h2 className="cta-band__title">지금, AI 자동화를 시작할 때</h2>
            <p className="cta-band__sub">
              현재 업무를 알려주시면 어디서부터 자동화할 수 있는지 무료로 진단해 드립니다.
            </p>
            <div className="cta-band__actions">
              <Link href="/contact" className="btn btn--primary">무료 상담 신청</Link>
              <Link href="/services" className="btn btn--ghost">서비스 전체 보기</Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
