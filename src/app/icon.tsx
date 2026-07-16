import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: 8,
        }}
      >
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 999,
            background: "#f7faf7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#1f6b3a",
            fontSize: 11,
            fontWeight: 800,
          }}
        >
          ⚽
        </div>
      </div>
    ),
    { ...size },
  );
}
