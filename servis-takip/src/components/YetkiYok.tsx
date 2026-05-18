"use client";

import { useRouter } from "next/navigation";

export default function YetkiYok() {
  const router = useRouter();
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        gap: "16px",
        textAlign: "center",
        padding: "24px",
      }}
    >
      <motion.div style={{ fontSize: "48px" }}>??</motion.div>
      <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#111827", margin: 0 }}>
        Bu sayfaya eri?im yetkiniz yok
      </h1>
      <p style={{ fontSize: "14px", color: "#6b7280", margin: 0, maxWidth: "400px" }}>
        Bu sayfay? görüntülemek için gerekli yetkiniz bulunmuyor. Yöneticinizle ileti?ime geçin.
      </p>
      <button
        type="button"
        onClick={() => router.push("/")}
        style={{
          padding: "10px 24px",
          background: "#111827",
          color: "white",
          border: "none",
          borderRadius: "8px",
          fontSize: "14px",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Gösterge Paneline Dön
      </button>
    </div>
  );
}
