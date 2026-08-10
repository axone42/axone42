import { clients } from "@/lib/showcase";

// 카드 로고 마크에 쓸 그라디언트 팔레트 (인덱스로 순환 — 랜덤 미사용)
const GRADIENTS: [string, string][] = [
  ["#e6a05f", "#c85c68"],
  ["#6b62f2", "#3a6bd6"],
  ["#3a6bd6", "#6b62f2"],
  ["#c85c68", "#6b62f2"],
  ["#5aa9a0", "#3a6bd6"],
  ["#e0a95f", "#6b62f2"],
  ["#8a6bf2", "#c85c68"],
];

function BlurHead({ name }: { name: string }) {
  return (
    <>
      <span className="logo-blur">{name.slice(0, 2)}</span>
      {name.slice(2)}
    </>
  );
}

function LogoCard({ name, idx }: { name: string; idx: number }) {
  const [a, b] = GRADIENTS[idx % GRADIENTS.length];
  return (
    <div className="logo-card">
      <span
        className="logo-card__mark"
        style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}
        aria-hidden
      />
      <span className="logo-card__name">
        <BlurHead name={name} />
      </span>
    </div>
  );
}

export default function ClientMarquee() {
  // 무한 루프를 위해 리스트를 두 번 렌더 (translateX -50%로 이음새 없이 순환)
  const items = [...clients, ...clients];
  return (
    <div className="marquee" aria-label="함께한 고객사">
      <div className="marquee__track">
        {items.map((c, i) => (
          <LogoCard key={i} name={c} idx={i % clients.length} />
        ))}
      </div>
    </div>
  );
}
