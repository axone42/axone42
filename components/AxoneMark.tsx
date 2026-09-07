// AXONE 로고 마크 (그라디언트 A) — 인라인 SVG, 재사용용
export default function AxoneMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden role="img">
      <defs>
        <linearGradient id={`axm-${size}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f0a868" />
          <stop offset="0.35" stopColor="#c85c68" />
          <stop offset="0.7" stopColor="#6b62f2" />
          <stop offset="1" stopColor="#3a6bd6" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="16" fill={`url(#axm-${size})`} />
      <text
        x="32"
        y="34"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="27"
        fontWeight="800"
        letterSpacing="-1.5"
        fontFamily="var(--font-geist), ui-sans-serif, system-ui, sans-serif"
        fill="#fff"
      >
        AX
      </text>
    </svg>
  );
}
