"use client";
import { useRouter } from "next/navigation";

export default function OdemeBasarisizPage() {
  const router = useRouter();

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "white", borderRadius: "16px", padding: "48px 40px", maxWidth: "480px", width: "100%", textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <div style={{ fontSize: "56px", marginBottom: "16px" }}>😔</div>
        <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#111827", marginBottom: "12px" }}>
          Ödeme Başarısız
        </h1>
        <p style={{ fontSize: "15px", color: "#6b7280", marginBottom: "8px" }}>
          Ödeme işlemi tamamlanamadı. Lütfen tekrar deneyin.
        </p>
        <p style={{ fontSize: "13px", color: "#9ca3af", marginBottom: "32px" }}>
          Sorun devam ederse destek@tamirtakip.com.tr adresine yazabilirsiniz.
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <button
            type="button"
            onClick={() => router.push("/paket-sec")}
            style={{
              background: "#4f46e5",
              color: "white",
              border: "none",
              borderRadius: "10px",
              padding: "12px 24px",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Tekrar Dene
          </button>
          <button
            type="button"
            onClick={() => router.push("/")}
            style={{
              background: "none",
              color: "#6b7280",
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
              padding: "12px 24px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Ana Sayfa
          </button>
        </div>
      </div>
    </div>
  );
}
