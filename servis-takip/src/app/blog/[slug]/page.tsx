import Link from "next/link";
import { blogPosts } from "../data";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) return {};
  return {
    title: `${post.title} | TamirTakip Blog`,
    description: post.description,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) notFound();

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
            href="/blog"
            style={{ fontSize: "14px", color: "#6b7280", textDecoration: "none" }}
          >
            Blog
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

      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "48px 24px" }}>
        <Link
          href="/blog"
          style={{
            fontSize: "14px",
            color: "#4f46e5",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            marginBottom: "32px",
          }}
        >
          ← Blog&apos;a dön
        </Link>

        <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
          <span style={{ fontSize: "13px", color: "#6b7280" }}>{post.date}</span>
          <span style={{ fontSize: "13px", color: "#6b7280" }}>·</span>
          <span style={{ fontSize: "13px", color: "#6b7280" }}>
            {post.readTime}
          </span>
        </div>

        <h1
          style={{
            fontSize: "28px",
            fontWeight: 800,
            color: "#111827",
            marginBottom: "16px",
            lineHeight: 1.3,
          }}
        >
          {post.title}
        </h1>
        <p
          style={{
            fontSize: "16px",
            color: "#6b7280",
            marginBottom: "40px",
            lineHeight: 1.6,
          }}
        >
          {post.description}
        </p>

        <div
          className="blog-content"
          style={{ fontSize: "15px", lineHeight: 1.8, color: "#374151" }}
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* CTA */}
        <div
          style={{
            marginTop: "48px",
            background: "#f0f0ff",
            borderRadius: "12px",
            padding: "32px",
            textAlign: "center",
          }}
        >
          <h3
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "#111827",
              marginBottom: "8px",
            }}
          >
            TamirTakip&apos;i Ücretsiz Deneyin
          </h3>
          <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "20px" }}>
            30 gün ücretsiz, kredi kartı gerekmez.
          </p>
          <Link
            href="/login?register=true"
            style={{
              background: "#4f46e5",
              color: "white",
              padding: "12px 24px",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: "14px",
            }}
          >
            Hemen Başla →
          </Link>
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
