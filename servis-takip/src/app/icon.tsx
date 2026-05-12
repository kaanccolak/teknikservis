import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 7,
          background: "#4f46e5",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <div
          style={{
            width: 20,
            height: 5,
            borderRadius: 2,
            background: "white",
            marginBottom: 2,
          }}
        />
        <div
          style={{
            width: 10,
            height: 12,
            borderRadius: 2,
            background: "white",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -2,
            right: -2,
            width: 13,
            height: 13,
            borderRadius: "50%",
            background: "#22c55e",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ color: "white", fontSize: 8, fontWeight: 700 }}>✓</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
