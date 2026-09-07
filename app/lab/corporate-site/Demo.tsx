"use client";

import { useEffect, useState } from "react";
import "./site.css";

type PageKey = "work" | "studio" | "services" | "contact";

const WORDMARK = "freshman";
const YEAR = "2025";

const NAV: { key: PageKey; label: string }[] = [
  { key: "work", label: "WORK" },
  { key: "studio", label: "STUDIO" },
  { key: "services", label: "SERVICES" },
  { key: "contact", label: "CONTACT" },
];

/* full catalogue of cinematic work — wire to /lab-img/corporate/pN.png (fallback = CSS duotone) */
const PROJECTS = [
  { slug: "p1", name: "NOCTURNE", cat: "SHORT FILM", year: "2025" },
  { slug: "p2", name: "CONCRETE", cat: "TITLE SEQUENCE", year: "2024" },
  { slug: "p3", name: "RAINFALL", cat: "MUSIC VIDEO", year: "2024" },
  { slug: "p4", name: "NEON DINER", cat: "BRAND FILM", year: "2025" },
  { slug: "p5", name: "AGAINST LIGHT", cat: "CAMPAIGN", year: "2023" },
  { slug: "p6", name: "COASTLINE", cat: "DOCUMENTARY", year: "2025" },
  { slug: "p7", name: "SODIUM", cat: "SHORT FILM", year: "2024" },
  { slug: "p8", name: "WHITE ROOM", cat: "FASHION FILM", year: "2023" },
  { slug: "p9", name: "DUST LINE", cat: "CAMPAIGN", year: "2025" },
  { slug: "p10", name: "RED CURTAIN", cat: "TITLE SEQUENCE", year: "2024" },
  { slug: "p11", name: "CELLULOID", cat: "BRAND FILM", year: "2023" },
  { slug: "p12", name: "FIRST FROST", cat: "DOCUMENTARY", year: "2025" },
];

const WORK_CATS = ["ALL", "FILM", "TITLES", "BRAND", "CAMPAIGN"];
/* map each project to a filter bucket */
const CAT_BUCKET: Record<string, string> = {
  "SHORT FILM": "FILM",
  DOCUMENTARY: "FILM",
  "MUSIC VIDEO": "FILM",
  "FASHION FILM": "FILM",
  "TITLE SEQUENCE": "TITLES",
  "BRAND FILM": "BRAND",
  CAMPAIGN: "CAMPAIGN",
};

const CLIENTS = [
  "A24", "MUBI", "KINFOLK", "AESOP", "SSENSE", "NOWNESS",
  "COS", "DAZED", "APARTAMENTO", "FRAME", "MONOCLE", "BLACKBOOK",
];

const SERVICES = [
  {
    name: "Brand",
    desc: "Identity systems built like title cards — a wordmark, a voice, and the restraint to leave the rest black.",
    deliver: ["Logotype & wordmark", "Type & colour system", "Brand guidelines", "Art direction"],
  },
  {
    name: "Film / Motion",
    desc: "Concept-to-screen direction for film, campaign and title work. Cinematic motion, not SaaS animation.",
    deliver: ["Direction & concept", "Title sequences", "Editorial animation", "Post & colour grade"],
  },
  {
    name: "Digital",
    desc: "Editorial websites and interfaces that carry the frame — flat, fast, and quietly interactive.",
    deliver: ["Site design & build", "Interaction design", "CMS & handoff", "Performance"],
  },
  {
    name: "Strategy",
    desc: "The thinking before the shooting. Positioning, narrative and the single idea a brand can own.",
    deliver: ["Positioning", "Narrative & messaging", "Naming", "Launch strategy"],
  },
];

const PROCESS = [
  { k: "Discover", p: "We read the room before we light it — research, references, the one idea worth keeping." },
  { k: "Design", p: "Frames, type and system. We show one strong direction, not a deck of safe ones." },
  { k: "Build", p: "Shoot, edit, grade, code. Craft is the whole job; nothing ships half-lit." },
  { k: "Launch", p: "Roll-out, motion kit, and the handoff that lets the work keep moving without us." },
];

const TIMELINE = [
  { y: "2018", t: "Founded", p: "Three directors and one dark room. First title sequence screens at a regional festival." },
  { y: "2020", t: "First Retainer", p: "A fashion house signs on for seasonal films — the monochrome grade becomes a signature." },
  { y: "2022", t: "Awards Cycle", p: "Two shorts selected internationally; the studio doubles to eight." },
  { y: "2024", t: "Digital Arm", p: "We start building the editorial websites that carry our films — flat, fast, black." },
  { y: "2025", t: "Now", p: "A small crew, worldwide, still treating every frame like a title card." },
];

const TEAM = [
  { slug: "t1", name: "Mara Vance", role: "Creative Director" },
  { slug: "t2", name: "Ilya Sørensen", role: "Editor" },
  { slug: "t3", name: "Noor Haddad", role: "Motion Designer" },
  { slug: "t4", name: "June Park", role: "Producer" },
  { slug: "t5", name: "Léo Marchetti", role: "Director of Photography" },
  { slug: "t6", name: "Sasha Kline", role: "Brand Strategist" },
];

const AWARDS = [
  { y: "2025", t: "Vimeo Staff Pick — NOCTURNE" },
  { y: "2024", t: "D&AD Wood Pencil — CONCRETE titles" },
  { y: "2024", t: "SXSW Official Selection — SODIUM" },
  { y: "2023", t: "AICP Next Award, Cinematography" },
  { y: "2023", t: "It's Nice That, Studio of the Week" },
];

const OFFICES = [
  { city: "SEOUL", lines: ["4F, 12 Yeonhui-ro", "Seodaemun-gu", "Seoul 03698"] },
  { city: "BERLIN", lines: ["Oranienstraße 40", "Kreuzberg", "10999 Berlin"] },
  { city: "LOS ANGELES", lines: ["728 N Virgil Ave", "Silver Lake", "CA 90029"] },
];

const STATS = [
  { k: "Founded", v: "2018" },
  { k: "Projects", v: "140+" },
  { k: "Awards", v: "17" },
  { k: "Clients", v: "60" },
];

/* reusable Photo: duotone CSS sample by default; swaps to the real image only
   after it actually loads (avoids broken-image icons on the static-prerendered page). */
function Photo({ slug, variant }: { slug: string; variant: number }) {
  const src = `/lab-img/corporate/${slug}.png`;
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let alive = true;
    const img = new window.Image();
    img.onload = () => { if (alive) setLoaded(true); };
    img.onerror = () => { if (alive) setLoaded(false); };
    img.src = src;
    return () => { alive = false; };
  }, [src]);
  if (loaded) {
    return <img className="fr-photo" src={src} alt="" />;
  }
  return (
    <div className={`fr-photo-css fr-photo-css--${variant % 6}`} aria-hidden>
      <div className="fr-photo-css__grain" />
    </div>
  );
}

export default function Demo() {
  const [page, setPage] = useState<PageKey>("work");
  const [menuOpen, setMenuOpen] = useState(false);
  const [cookieOpen, setCookieOpen] = useState(true);
  // 히어로 영상: 기본은 CSS 모션(샘플). 실제 mp4가 존재할 때만 <video>를 표시.
  const [videoOk, setVideoOk] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch("/lab-img/corporate/hero.mp4", { method: "HEAD" })
      .then((r) => { if (alive && r.ok) setVideoOk(true); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);
  const [news, setNews] = useState("");
  const [newsOk, setNewsOk] = useState(false);

  const go = (key: PageKey) => {
    setPage(key);
    setMenuOpen(false);
    // scroll the stage back to top on page change
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const canSend = form.email.trim() !== "" && form.message.trim() !== "";
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSend) setSent(true);
  };
  const submitNews = (e: React.FormEvent) => {
    e.preventDefault();
    if (news.trim() !== "") setNewsOk(true);
  };

  return (
    <div className="fr-root">
      {/* top bar: hash glyph left, + MENU right — bare type, no chrome */}
      <div className="fr-topbar">
        <button className="fr-glyph" onClick={() => go("work")} aria-label="Home">
          #⧉
        </button>
        <button className="fr-menu-trigger" onClick={() => setMenuOpen(true)}>
          + MENU
        </button>
      </div>

      {/* full-screen MENU overlay */}
      {menuOpen && (
        <div className="fr-overlay" role="dialog" aria-modal="true">
          <div className="fr-overlay__top">
            <span className="fr-glyph">#⧉</span>
            <button className="fr-overlay__close" onClick={() => setMenuOpen(false)}>
              × CLOSE
            </button>
          </div>
          <nav className="fr-overlay__nav">
            {NAV.map((n, i) => (
              <button
                key={n.key}
                className={`fr-overlay__item${page === n.key ? " is-active" : ""}`}
                onClick={() => go(n.key)}
              >
                <span className="fr-overlay__index">{String(i + 1).padStart(2, "0")}</span>
                <span className="fr-overlay__label">{n.label}</span>
              </button>
            ))}
          </nav>
          <div className="fr-overlay__foot">
            <span>{WORDMARK}®</span>
            <span>{YEAR} — MENU &amp; REEL ARE THE NAVIGATION</span>
          </div>
        </div>
      )}

      {/* page body */}
      <main className="fr-page" key={page}>
        {page === "work" && (
          <HomePage videoOk={videoOk} setVideoOk={setVideoOk} go={go} />
        )}
        {page === "studio" && <StudioPage />}
        {page === "services" && <ServicesPage go={go} />}
        {page === "contact" && (
          <ContactPage
            form={form}
            setForm={setForm}
            sent={sent}
            setSent={setSent}
            submit={submit}
            canSend={canSend}
          />
        )}

        {/* full footer — shared across all pages */}
        <Footer
          go={go}
          news={news}
          setNews={setNews}
          newsOk={newsOk}
          submitNews={submitNews}
        />
      </main>

      {/* cookie consent strip — bottom-right, #101010 + 1px white border */}
      {cookieOpen && (
        <div className="fr-cookie">
          <span className="fr-cookie__txt">
            This site uses cookies for a smoother reel.
          </span>
          <button className="fr-cookie__ok" onClick={() => setCookieOpen(false)}>
            OK
          </button>
        </div>
      )}

      {/* project reel ticker pinned to bottom — the nav spine, now an infinite credit roll */}
      <div className="fr-reel" aria-label="Project reel">
        <div className="fr-reel__track">
          {/* duplicate the set twice for a seamless -50% marquee loop */}
          {[0, 1].map((dup) => (
            <div className="fr-reel__group" key={dup} aria-hidden={dup === 1}>
              {PROJECTS.map((p, i) => (
                <button
                  key={`${dup}-${p.slug}`}
                  className="fr-reel__item"
                  onClick={() => go("work")}
                  tabIndex={dup === 1 ? -1 : 0}
                >
                  <span className="fr-reel__thumb">
                    <Photo slug={p.slug} variant={i} />
                  </span>
                  <span className="fr-reel__meta">
                    <span className="fr-reel__name">{p.name}</span>
                    <span className="fr-reel__sub">{p.cat} · {p.year}</span>
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================ shared: infinite marquees ============================ */

function ShowreelMarquee() {
  return (
    <div className="fr-showreel" aria-label="Showreel">
      <div className="fr-showreel__track">
        {[0, 1].map((dup) => (
          <div className="fr-showreel__group" key={dup} aria-hidden={dup === 1}>
            {PROJECTS.map((p, i) => (
              <div className="fr-showreel__cell" key={`${dup}-${p.slug}`}>
                <Photo slug={p.slug} variant={i} />
                <span className="fr-showreel__cap">
                  <span className="fr-showreel__name">{p.name}</span>
                  <span className="fr-showreel__sub">{p.cat} · {p.year}</span>
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function ClientMarquee() {
  return (
    <div className="fr-clients" aria-label="Selected clients">
      <div className="fr-clients__track">
        {[0, 1].map((dup) => (
          <div className="fr-clients__group" key={dup} aria-hidden={dup === 1}>
            {CLIENTS.map((c, i) => (
              <span className="fr-clients__item" key={`${dup}-${c}`}>
                {c}
                {i < CLIENTS.length - 1 && <span className="fr-clients__dot">✱</span>}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================= HOME (WORK key = landing) ============================= */
function HomePage({
  videoOk,
  setVideoOk,
  go,
}: {
  videoOk: boolean;
  setVideoOk: (v: boolean) => void;
  go: (k: PageKey) => void;
}) {
  return (
    <>
      <header className="fr-hero">
        <div className="fr-hero__media" aria-hidden>
          {/* cinematic video slot — plays if the file exists, else CSS motion */}
          {videoOk && (
            <video
              className="fr-hero__video"
              src="/lab-img/corporate/hero.mp4"
              autoPlay
              muted
              loop
              playsInline
              onError={() => setVideoOk(false)}
            />
          )}
          {/* CSS motion sample (the actual "video" for now) */}
          <div className="fr-hero__motion" />
          <div className="fr-hero__sweep" />
          <div className="fr-scanlines" />
          <div className="fr-grain" />
          <div className="fr-hero__vignette" />
        </div>

        <div className="fr-hero__inner">
          <h1 className="fr-wordmark">
            {WORDMARK}
            <span className="fr-wordmark__reg">®</span>
          </h1>
          <p className="fr-hero__tag">
            A small creative studio making films, titles and moving images that
            behave like cinema — white type, black room, one red note.
            <span className="fr-hero__hand">
              <span className="fr-bracket">[</span> we make things move{" "}
              <span className="fr-bracket">]</span>
            </span>
          </p>
          <div className="fr-year">{YEAR}</div>
        </div>
        <span className="fr-hero__scroll" aria-hidden>SCROLL ↓</span>
      </header>

      {/* infinite showreel strip */}
      <ShowreelMarquee />

      <hr className="fr-hairline" />

      {/* editorial capabilities intro */}
      <section className="fr-section">
        <div className="fr-wrap fr-intro">
          <p className="fr-eyebrow">What we do</p>
          <p className="fr-lead">
            We don&apos;t decorate. Every project is a title card first and a
            deliverable second. From brand systems to film, motion and the
            editorial web — the palette stays monochrome and the idea stays
            singular.
          </p>
          <p className="fr-hand-line">[ shot on black ]</p>
        </div>
      </section>

      {/* big stats row */}
      <section className="fr-statband">
        <div className="fr-wrap fr-stats">
          {STATS.map((s) => (
            <div key={s.k} className="fr-stat">
              <span className="fr-stat__v">{s.v}</span>
              <span className="fr-stat__k">{s.k}</span>
            </div>
          ))}
        </div>
      </section>

      <hr className="fr-hairline" />

      {/* full filterable work grid */}
      <WorkGrid />

      {/* client logo marquee */}
      <section className="fr-section fr-section--tight">
        <div className="fr-wrap">
          <p className="fr-eyebrow fr-eyebrow--center">Trusted by</p>
        </div>
        <ClientMarquee />
      </section>

      <hr className="fr-hairline" />

      {/* CTA band */}
      <section className="fr-cta">
        <div className="fr-wrap fr-cta__inner">
          <p className="fr-eyebrow">Let&apos;s make something</p>
          <h2 className="fr-cta__h">
            got a frame<br />worth moving?
          </h2>
          <button className="fr-cta__btn" onClick={() => go("contact")}>
            START A PROJECT →
          </button>
          <p className="fr-hand-line">[ we reply in a day ]</p>
        </div>
      </section>
    </>
  );
}

/* ============================= WORK (full filterable grid) ============================= */
function WorkGrid() {
  const [cat, setCat] = useState("ALL");
  const shown =
    cat === "ALL"
      ? PROJECTS
      : PROJECTS.filter((p) => CAT_BUCKET[p.cat] === cat);
  return (
    <section className="fr-section" id="fr-work">
      <div className="fr-wrap">
        <div className="fr-sec-head">
          <p className="fr-eyebrow">Selected Work</p>
          <span className="fr-count">{shown.length} / {PROJECTS.length}</span>
        </div>
        <div className="fr-chips">
          {WORK_CATS.map((c) => (
            <button
              key={c}
              className={`fr-chip${cat === c ? " is-active" : ""}`}
              onClick={() => setCat(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="fr-worklist">
          {shown.map((p, i) => (
            <div key={p.slug} className="fr-worktile">
              <Photo slug={p.slug} variant={PROJECTS.indexOf(p)} />
              <span className="fr-worktile__idx">{String(i + 1).padStart(2, "0")}</span>
              <span className="fr-worktile__cap">
                <span className="fr-worktile__name">{p.name}</span>
                <span className="fr-worktile__sub">{p.cat} · {p.year}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================= STUDIO ============================= */
function StudioPage() {
  return (
    <>
      <section className="fr-section" style={{ paddingTop: 56 }}>
        <div className="fr-wrap">
          <p className="fr-eyebrow">Studio</p>
          <h2 className="fr-display-h">a dark room,<br />a lot of light</h2>
          <div className="fr-manifesto">
            <p className="fr-body fr-body--dim">
              Freshman is a director-led studio working at the seam of film and
              design. We keep the crew small, the palette monochrome, and the
              output cinematic. The wordmark is the brand; the work is the proof.
            </p>
            <p className="fr-body fr-body--dim">
              We believe restraint is a strategy, not a look. One idea, one
              light, one red note — held long enough to mean something. That is
              the whole philosophy, and it fits on a title card.
            </p>
          </div>
          <p className="fr-hand-line">[ founded on restraint ]</p>
        </div>
      </section>

      {/* numbered timeline / 연혁 */}
      <section className="fr-section fr-section--tight">
        <div className="fr-wrap">
          <p className="fr-eyebrow">History</p>
          <div className="fr-timeline">
            {TIMELINE.map((t, i) => (
              <div key={t.y} className="fr-tl">
                <span className="fr-tl__idx">{String(i + 1).padStart(2, "0")}</span>
                <span className="fr-tl__year">{t.y}</span>
                <div className="fr-tl__body">
                  <h3 className="fr-tl__title">{t.t}</h3>
                  <p className="fr-tl__p">{t.p}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="fr-hairline" />

      {/* team grid */}
      <section className="fr-section">
        <div className="fr-wrap">
          <p className="fr-eyebrow">The Crew</p>
          <div className="fr-team">
            {TEAM.map((m, i) => (
              <div key={m.slug} className="fr-member">
                <div className="fr-member__photo">
                  <Photo slug={m.slug} variant={i + 1} />
                </div>
                <span className="fr-member__name">{m.name}</span>
                <span className="fr-member__role">{m.role}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="fr-hairline" />

      {/* awards / press */}
      <section className="fr-section fr-section--tight">
        <div className="fr-wrap">
          <p className="fr-eyebrow">Awards &amp; Press</p>
          <ul className="fr-awards">
            {AWARDS.map((a) => (
              <li key={a.t} className="fr-award">
                <span className="fr-award__y">{a.y}</span>
                <span className="fr-award__t">{a.t}</span>
              </li>
            ))}
          </ul>
          <p className="fr-hand-line">[ quietly, mostly ]</p>
        </div>
      </section>
    </>
  );
}

/* ============================= SERVICES ============================= */
function ServicesPage({ go }: { go: (k: PageKey) => void }) {
  return (
    <>
      <section className="fr-section" style={{ paddingTop: 56 }}>
        <div className="fr-wrap">
          <p className="fr-eyebrow">Services</p>
          <h2 className="fr-display-h">what we do,<br />quietly</h2>
          <p className="fr-body fr-body--dim" style={{ marginTop: 8 }}>
            Four capabilities, one sensibility. We can take a single frame or the
            whole system — the grade stays the same.
          </p>

          <div className="fr-svcs">
            {SERVICES.map((s, i) => (
              <div key={s.name} className="fr-svc">
                <span className="fr-svc__idx">{String(i + 1).padStart(2, "0")}</span>
                <div className="fr-svc__main">
                  <h3 className="fr-svc__name">{s.name}</h3>
                  <p className="fr-svc__desc">{s.desc}</p>
                </div>
                <ul className="fr-svc__deliver">
                  {s.deliver.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="fr-hand-line">[ no decks, just frames ]</p>
        </div>
      </section>

      <hr className="fr-hairline" />

      {/* numbered process */}
      <section className="fr-section">
        <div className="fr-wrap">
          <p className="fr-eyebrow">Process</p>
          <div className="fr-proc">
            {PROCESS.map((p, i) => (
              <div key={p.k} className="fr-proc__step">
                <span className="fr-proc__num">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="fr-proc__k">{p.k}</h3>
                <p className="fr-proc__p">{p.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="fr-hairline" />

      <section className="fr-cta">
        <div className="fr-wrap fr-cta__inner">
          <p className="fr-eyebrow">Ready when you are</p>
          <h2 className="fr-cta__h">let&apos;s light<br />the first frame</h2>
          <button className="fr-cta__btn" onClick={() => go("contact")}>
            START A PROJECT →
          </button>
        </div>
      </section>
    </>
  );
}

/* ============================= CONTACT ============================= */
function ContactPage({
  form,
  setForm,
  sent,
  setSent,
  submit,
  canSend,
}: {
  form: { name: string; email: string; message: string };
  setForm: (f: { name: string; email: string; message: string }) => void;
  sent: boolean;
  setSent: (v: boolean) => void;
  submit: (e: React.FormEvent) => void;
  canSend: boolean;
}) {
  return (
    <section className="fr-section" style={{ paddingTop: 56 }}>
      <div className="fr-wrap">
        <p className="fr-eyebrow">Contact</p>
        <h2 className="fr-display-h">start a frame</h2>

        <div className="fr-contact">
          <div className="fr-contact__aside">
            <p className="fr-body fr-body--dim">
              Tell us what you&apos;re trying to move. We reply within one
              working day — no forms in triplicate.
            </p>
            <ul className="fr-contact__list">
              <li>hello@freshman.studio</li>
              <li>+82 2 000 0000</li>
              <li>New business — Mon–Fri</li>
            </ul>
            <p className="fr-hand-line">[ we make things move ]</p>
          </div>

          {sent ? (
            <div className="fr-sent">
              <p className="fr-sent__mark">✱</p>
              <h4>received</h4>
              <p>Your note landed in the dark room. We&apos;ll be in touch shortly.</p>
              <button
                className="fr-relink"
                onClick={() => {
                  setSent(false);
                  setForm({ name: "", email: "", message: "" });
                }}
              >
                Write another
              </button>
            </div>
          ) : (
            <form className="fr-form" onSubmit={submit}>
              <div className="fr-field">
                <label className="fr-label" htmlFor="fr-name">
                  Name
                </label>
                <input
                  id="fr-name"
                  className="fr-input"
                  type="text"
                  placeholder="Your name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="fr-field">
                <label className="fr-label" htmlFor="fr-email">
                  Email
                </label>
                <input
                  id="fr-email"
                  className="fr-input"
                  type="email"
                  placeholder="you@studio.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="fr-field">
                <label className="fr-label" htmlFor="fr-msg">
                  Message
                </label>
                <textarea
                  id="fr-msg"
                  className="fr-textarea"
                  placeholder="What do you want to move?"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                />
              </div>
              <button className="fr-submit" type="submit" disabled={!canSend}>
                SEND
              </button>
            </form>
          )}
        </div>

        {/* offices */}
        <div className="fr-offices">
          {OFFICES.map((o) => (
            <div key={o.city} className="fr-office">
              <h3 className="fr-office__city">{o.city}</h3>
              <address className="fr-office__addr">
                {o.lines.map((l) => (
                  <span key={l}>{l}</span>
                ))}
              </address>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================= FOOTER (shared) ============================= */
function Footer({
  go,
  news,
  setNews,
  newsOk,
  submitNews,
}: {
  go: (k: PageKey) => void;
  news: string;
  setNews: (v: string) => void;
  newsOk: boolean;
  submitNews: (e: React.FormEvent) => void;
}) {
  return (
    <footer className="fr-footer">
      <hr className="fr-hairline" />
      <div className="fr-wrap">
        <div className="fr-footer__cols">
          {/* sitemap */}
          <div className="fr-fcol">
            <p className="fr-fcol__h">Sitemap</p>
            <ul className="fr-fcol__list">
              {NAV.map((n) => (
                <li key={n.key}>
                  <button className="fr-flink" onClick={() => go(n.key)}>
                    {n.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* offices */}
          <div className="fr-fcol">
            <p className="fr-fcol__h">Offices</p>
            <ul className="fr-fcol__list">
              {OFFICES.map((o) => (
                <li key={o.city}>{o.city}</li>
              ))}
            </ul>
          </div>

          {/* socials */}
          <div className="fr-fcol">
            <p className="fr-fcol__h">Social</p>
            <ul className="fr-fcol__list">
              <li><span className="fr-flink" role="link">INSTAGRAM</span></li>
              <li><span className="fr-flink" role="link">VIMEO</span></li>
              <li><span className="fr-flink" role="link">LINKEDIN</span></li>
            </ul>
          </div>

          {/* newsletter */}
          <div className="fr-fcol fr-fcol--news">
            <p className="fr-fcol__h">Newsletter</p>
            {newsOk ? (
              <p className="fr-news__ok">
                <span className="fr-news__star">✱</span> You&apos;re on the roll.
              </p>
            ) : (
              <form className="fr-news" onSubmit={submitNews}>
                <input
                  className="fr-news__input"
                  type="email"
                  placeholder="your email"
                  value={news}
                  onChange={(e) => setNews(e.target.value)}
                  aria-label="Newsletter email"
                />
                <button className="fr-news__btn" type="submit" aria-label="Subscribe">
                  →
                </button>
              </form>
            )}
            <p className="fr-fcol__note">
              One quiet dispatch a month. No noise.
            </p>
          </div>
        </div>

        {/* big wordmark */}
        <div className="fr-footer__mark" aria-hidden>{WORDMARK}</div>

        <div className="fr-footer__legal">
          <span>© {YEAR} {WORDMARK}® studio. All frames reserved.</span>
          <span>
            Made in a dark room <span className="fr-footer__note">[ black canvas, one red note ]</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
