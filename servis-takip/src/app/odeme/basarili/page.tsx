"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OdemeBasariliPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/");
    }, 5000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "white", borderRadius: "16px", padding: "48px 40px", maxWidth: "480px", width: "100%", textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <div style={{ fontSize: "56px", marginBottom: "16px" }}>🎉</div>
        <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#111827", marginBottom: "12px" }}>
          Ödeme Başarılı!
        </h1>
        <p style={{ fontSize: "15px", color: "#6b7280", marginBottom: "8px" }}>
          Aboneliğiniz aktif edildi. TamirTakip&apos;e hoş geldiniz.
        </p>
        <p style={{ fontSize: "13px", color: "#9ca3af", marginBottom: "32px" }}>
          5 saniye içinde ana sayfaya yönlendirileceksiniz...
        </p>
        <button
          type="button"
          onClick={() => router.push("/")}
          style={{
            background: "#4f46e5",
            color: "white",
            border: "none",
            borderRadius: "10px",
            padding: "12px 32px",
            fontSize: "14px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Hemen Git
        </button>
      </div>
    </div>
  );
}
