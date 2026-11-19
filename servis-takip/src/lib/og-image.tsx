import { ogFontBase64 } from "@/lib/og-fonts";

export const ogSize = { width: 1200, height: 630 };

function decodeFont(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

export async function loadOgFonts() {
  const regular = decodeFont(ogFontBase64.latinRegular);
  const bold = decodeFont(ogFontBase64.latinBold);
  const regularExt = decodeFont(ogFontBase64.extRegular);
  const boldExt = decodeFont(ogFontBase64.extBold);

  return [
    { name: "Inter", data: regular, weight: 400 as const, style: "normal" as const },
    { name: "Inter", data: bold, weight: 700 as const, style: "normal" as const },
    { name: "Inter", data: regularExt, weight: 400 as const, style: "normal" as const },
    { name: "Inter", data: boldExt, weight: 700 as const, style: "normal" as const },
  ];
}

export function OgLogo({ size = 96 }: { size?: number }) {
  const badge = Math.round(size * 0.36);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.22),
        background: "#4f46e5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div
          style={{
            width: Math.round(size * 0.54),
            height: Math.round(size * 0.12),
            borderRadius: 4,
            background: "white",
            marginBottom: Math.round(size * 0.06),
          }}
        />
        <div
          style={{
            width: Math.round(size * 0.22),
            height: Math.round(size * 0.38),
            borderRadius: 4,
            background: "white",
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          right: Math.round(size * -0.08),
          bottom: Math.round(size * -0.08),
          width: badge,
          height: badge,
          borderRadius: badge,
          background: "#22c55e",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: Math.round(badge * 0.42),
            height: Math.round(badge * 0.24),
            borderLeft: "3px solid white",
            borderBottom: "3px solid white",
            transform: "rotate(-45deg)",
            marginTop: Math.round(badge * -0.08),
          }}
        />
      </div>
    </div>
  );
}

export function Wordmark({ size = 64 }: { size?: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        fontSize: size,
        letterSpacing: -1.5,
        fontFamily: "Inter",
      }}
    >
      <div style={{ fontWeight: 700, color: "#111827" }}>tamir</div>
      <div style={{ fontWeight: 400, color: "#4f46e5" }}>takip</div>
    </div>
  );
}
