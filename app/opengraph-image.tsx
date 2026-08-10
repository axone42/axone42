import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "에이엑스원(AXONE) — 기업의 AX를 설계하고 실행합니다";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background:
            "linear-gradient(120deg, #0a0a0a 0%, #14121f 55%, #1a1730 100%)",
          color: "#ffffff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "linear-gradient(135deg, #e6a05f, #c85c68, #6b62f2, #3a6bd6)",
            }}
          />
          <div style={{ fontSize: 34, fontWeight: 600, letterSpacing: 1 }}>AXONE</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.1 }}>
            AI Transformation
          </div>
          <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.1 }}>
            Partner for Business
          </div>
          <div style={{ fontSize: 30, color: "#c2c2c2", marginTop: 12 }}>
            Automation · Consulting · Development · Education
          </div>
        </div>

        <div style={{ fontSize: 24, color: "#8a8a8a" }}>axone.kr</div>
      </div>
    ),
    { ...size }
  );
}
