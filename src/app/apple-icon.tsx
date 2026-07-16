import { ImageResponse } from "next/og";

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
          background: "#1f6b3a",
          borderRadius: 36,
        }}
      >
        <div
          style={{
            width: 118,
            height: 118,
            borderRadius: 999,
            background: "#f7faf7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 64,
          }}
        >
          ⚽
        </div>
      </div>
    ),
    { ...size },
  );
}
