"use client";

import Link from "next/link";
import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

function EmailDogrulamaContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) return;
    const supabase = createClient();
    void supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (!error) {
        void supabase.auth.signOut();
      }
    });
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f9fafb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, sans-serif",
        padding: "16px",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "16px",
          padding: "48px 40px",
          maxWidth: "420px",
          width: "100%",
          border: "1px solid #e5e7eb",
          textAlign: "center",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎉</div>
        <h1
          style={{
            fontSize: "22px",
            fontWeight: 700,
            color: "#111827",
            marginBottom: "12px",
          }}
        >
          E-posta Adresiniz Doğrulandı!
        </h1>
        <p
          style={{
            fontSize: "15px",
            color: "#6b7280",
            lineHeight: "1.6",
            marginBottom: "32px",
          }}
        >
          Hesabınız başarıyla aktifleştirildi. Şimdi giriş yapabilirsiniz.
        </p>
        <Link
          href="/login"
          style={{
            display: "block",
            background: "#4f46e5",
            color: "white",
            padding: "12px 24px",
            borderRadius: "8px",
            fontSize: "15px",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Giriş Yap →
        </Link>
        <div style={{ marginTop: "24px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "6px",
                background: "#4f46e5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{ color: "white", fontWeight: 800, fontSize: "14px" }}
              >
                T
              </span>
            </div>
            <span style={{ fontSize: "16px", fontWeight: 800, color: "#111827" }}>
              tamir
              <span style={{ fontWeight: 300, color: "#4f46e5" }}>takip</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EmailDogrulamaPage() {
  return (
    <Suspense>
      <EmailDogrulamaContent />
    </Suspense>
  );
}
