import { tools } from "@/lib/stack";

export default function TechStack() {
  // 무한 루프를 위해 두 번 렌더
  const items = [...tools, ...tools];
  return (
    <div className="marquee" aria-label="우리가 사용하는 기술 스택">
      <div className="marquee__track">
        {items.map((t, i) => (
          <div className="tool-chip" key={i} aria-hidden={i >= tools.length}>
            <span
              className="tool-icon"
              style={{
                background: t.bg,
                color: t.fg ?? "#ffffff",
                boxShadow: t.border ? "inset 0 0 0 1px rgba(255,255,255,0.18)" : "none",
              }}
            >
              {t.mark}
            </span>
            <span className="tool-name">{t.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
