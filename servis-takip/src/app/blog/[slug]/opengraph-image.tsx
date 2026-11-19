import { ImageResponse } from "next/og";
import { blogPosts } from "@/app/blog/data";
import { OgLogo, Wordmark, loadOgFonts, ogSize } from "@/lib/og-image";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const alt = "TamirTakip blog yazısı";
export const size = ogSize;
export const contentType = "image/png";

export default async function BlogOpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}) {
  const { slug } = await params;
  const post = blogPosts.find((item) => item.slug === slug);
  const title = post?.title ?? "TamirTakip Blog";
  const titleSize = title.length > 58 ? 46 : 54;
  const fonts = await loadOgFonts();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f8fafc",
          padding: "64px 80px",
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
          <OgLogo size={72} />
          <div style={{ width: 22, display: "flex" }} />
          <Wordmark size={42} />
        </div>
        <div
          style={{
            display: "flex",
            fontSize: titleSize,
            fontWeight: 700,
            color: "#111827",
            lineHeight: 1.25,
            letterSpacing: -1,
            maxWidth: 1000,
          }}
        >
          {title}
        </div>
        <div style={{ display: "flex", fontSize: 24, fontWeight: 700, color: "#4f46e5" }}>
          Blog
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
