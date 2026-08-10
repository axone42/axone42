import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #f0a868, #c85c68 35%, #6b62f2 70%, #3a6bd6)",
          color: "#ffffff",
          fontSize: 112,
          fontWeight: 700,
        }}
      >
        A
      </div>
    ),
    { ...size }
  );
}
