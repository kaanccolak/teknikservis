"use client";

import { useEffect, useState } from "react";

export default function DemoIletisimKarti() {
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    void fetch("/api/shop")
      .then((response) => response.json())
      .then((data: { isDemo?: boolean }) => {
        setIsDemo(data.isDemo === true);
      })
      .catch(() => {});
  }, []);

  if (!isDemo) return null;

  return (
    <aside
      style={{
        position: "fixed",
        right: "24px",
        bottom: "82px",
        zIndex: 9996,
        width: "240px",
        maxWidth: "calc(100vw - 48px)",
        background: "white",
        border: "1px solid #e5e7eb",
        borderRadius: "16px",
        boxShadow: "0 8px 28px rgba(15, 23, 42, 0.12)",
        padding: "14px 16px",
      }}
    >
      <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#111827" }}>
        📞 Sorularınız mı var?
      </p>
      <p style={{ margin: "8px 0 2px", fontSize: "12px", color: "#6b7280" }}>
        Hemen arayın:
      </p>
      <a
        href="tel:+905377664248"
        style={{
          display: "inline-block",
          marginBottom: "12px",
          fontSize: "15px",
          fontWeight: 700,
          color: "#4f46e5",
          textDecoration: "none",
        }}
      >
        +90 537 766 42 48
      </a>
      <a
        href="https://wa.me/905377664248"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "36px",
          borderRadius: "10px",
          background: "#22c55e",
          color: "white",
          fontSize: "13px",
          fontWeight: 700,
          textDecoration: "none",
        }}
      >
        WhatsApp&apos;tan Yaz
      </a>
    </aside>
  );
}
