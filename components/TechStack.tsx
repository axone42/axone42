import * as simpleIcons from "simple-icons";
import { tools } from "@/lib/stack";

type SimpleIcon = { path: string; hex: string; title: string };

export default function TechStack() {
  // 무한 루프를 위해 두 번 렌더
  const items = [...tools, ...tools];
  const registry = simpleIcons as unknown as Record<string, SimpleIcon>;

  return (
    <div className="marquee" aria-label="우리가 사용하는 기술 스택">
      <div className="marquee__track">
        {items.map((t, i) => {
          const icon = t.slug ? registry[t.slug] : null;
          return (
            <div className="tool-chip" key={i} aria-hidden={i >= tools.length}>
              <span className="tool-icon">
                {icon ? (
                  <svg viewBox="0 0 24 24" role="img" aria-label={t.name} fill={t.color}>
                    <path d={icon.path} />
                  </svg>
                ) : (
                  <span className="mono" style={{ color: t.color }}>{t.mark}</span>
                )}
              </span>
              <span className="tool-name">{t.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
