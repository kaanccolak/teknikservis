import Link from "next/link";
import { blogPosts } from "./data";

export const metadata = {
  title: "Blog | TamirTakip",
  description:
    "Teknik servis yönetimi, cihaz takibi ve servis yazılımı hakkında faydalı yazılar.",
};

export default function BlogPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb" }}>
      {/* Navbar */}
      <nav
        style={{
          background: "white",
          borderBottom: "1px solid #e5e7eb",
          padding: "16px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Link
          href="/landing"
          style={{
            fontSize: "20px",
            fontWeight: 800,
            color: "#4f46e5",
            textDecoration: "none",
          }}
        >
          TamirTakip
        </Link>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <Link
            href="/landing#fiyatlandirma"
            style={{ fontSize: "14px", color: "#6b7280", textDecoration: "none" }}
          >
            Fiyatlar
          </Link>
          <Link
            href="/login"
            style={{
              fontSize: "14px",
              background: "#4f46e5",
              color: "white",
              padding: "8px 16px",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Giriş Yap
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "48px 24px" }}>
        <h1
          style={{
            fontSize: "32px",
            fontWeight: 800,
            color: "#111827",
            marginBottom: "8px",
          }}
        >
          Blog
        </h1>
        <p style={{ fontSize: "16px", color: "#6b7280", marginBottom: "48px" }}>
          Teknik servis yönetimi hakkında faydalı yazılar
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {blogPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              style={{ textDecoration: "none" }}
            >
              <div
                className="transition-shadow hover:shadow-md"
                style={{
                  background: "white",
                  borderRadius: "12px",
                  padding: "24px",
                  border: "1px solid #e5e7eb",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", gap: "12px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "12px", color: "#6b7280" }}>
                    {post.date}
                  </span>
                  <span style={{ fontSize: "12px", color: "#6b7280" }}>·</span>
                  <span style={{ fontSize: "12px", color: "#6b7280" }}>
                    {post.readTime}
                  </span>
                </div>
                <h2
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "#111827",
                    marginBottom: "8px",
                  }}
                >
                  {post.title}
                </h2>
                <p style={{ fontSize: "14px", color: "#6b7280", lineHeight: 1.6 }}>
                  {post.description}
                </p>
                <span
                  style={{
                    fontSize: "13px",
                    color: "#4f46e5",
                    fontWeight: 600,
                    marginTop: "12px",
                    display: "inline-block",
                  }}
                >
                  Devamını oku →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <footer
        style={{
          textAlign: "center",
          padding: "24px",
          borderTop: "1px solid #e5e7eb",
          marginTop: "48px",
        }}
      >
        <p style={{ fontSize: "13px", color: "#9ca3af" }}>
          © 2026 TamirTakip ·{" "}
          <Link href="/landing" style={{ color: "#4f46e5" }}>
            Ana Sayfa
          </Link>
        </p>
      </footer>
    </div>
  );
}
