import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sayfa bulunamadı | TamirTakip",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f9fafb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
      }}
    >
      <div style={{ maxWidth: "440px", textAlign: "center" }}>
        <p
          style={{
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: "#4f46e5",
            marginBottom: "12px",
          }}
        >
          404
        </p>
        <h1
          style={{
            fontSize: "32px",
            fontWeight: 800,
            color: "#111827",
            marginBottom: "12px",
          }}
        >
          Sayfa bulunamadı
        </h1>
        <p
          style={{
            fontSize: "16px",
            color: "#6b7280",
            lineHeight: 1.6,
            marginBottom: "28px",
          }}
        >
          Aradığınız sayfa mevcut değil veya taşınmış olabilir.
        </p>
        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/"
            style={{
              fontSize: "14px",
              fontWeight: 600,
              background: "#4f46e5",
              color: "white",
              padding: "10px 16px",
              borderRadius: "8px",
              textDecoration: "none",
            }}
          >
            Ana sayfa
          </Link>
          <Link
            href="/blog"
            style={{
              fontSize: "14px",
              fontWeight: 600,
              background: "white",
              color: "#4f46e5",
              padding: "10px 16px",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              textDecoration: "none",
            }}
          >
            Blog
          </Link>
        </div>
      </div>
    </div>
  );
}
