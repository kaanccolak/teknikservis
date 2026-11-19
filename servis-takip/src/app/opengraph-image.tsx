import { ImageResponse } from "next/og";
import { OgLogo, Wordmark, loadOgFonts, ogSize } from "@/lib/og-image";

export const runtime = "edge";
export const alt = "TamirTakip — Teknik Servis Takip Programı";
export const size = ogSize;
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const fonts = await loadOgFonts();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#f8fafc",
          padding: "80px 88px",
          fontFamily: "Inter",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 14,
            background: "#4f46e5",
            display: "flex",
          }}
        />
        <div style={{ display: "flex", alignItems: "center" }}>
          <OgLogo />
          <div style={{ width: 28, display: "flex" }} />
          <Wordmark />
        </div>
        <div
          style={{
            marginTop: 42,
            fontSize: 52,
            fontWeight: 700,
            color: "#111827",
            letterSpacing: -1,
          }}
        >
          Teknik Servis Takip Programı
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
