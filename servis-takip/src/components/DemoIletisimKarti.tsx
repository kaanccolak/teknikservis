"use client";

import { useEffect, useState } from "react";

export default function DemoIletisimKarti() {
  const [isDemo, setIsDemo] = useState(false);
  const [hover, setHover] = useState(false);
  const [locked, setLocked] = useState(false);
  const open = hover || locked;

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
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "fixed",
        right: "24px",
        bottom: "78px",
        zIndex: 9996,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: "8px",
        maxWidth: "calc(100vw - 48px)",
      }}
    >
      {open ? (
        <div
          style={{
            width: "220px",
            maxWidth: "100%",
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "14px",
            boxShadow: "0 8px 24px rgba(15, 23, 42, 0.12)",
            padding: "12px",
          }}
        >
          <a
            href="tel:+905377664248"
            style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "14px",
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
              height: "32px",
              borderRadius: "8px",
              background: "#22c55e",
              color: "white",
              fontSize: "12px",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            WhatsApp&apos;tan Yaz
          </a>
        </div>
      ) : null}
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setLocked((value) => !value)}
        style={{
          height: "46px",
          borderRadius: "23px",
          background: "white",
          color: "#4f46e5",
          border: "1px solid #e5e7eb",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "0 16px",
          boxShadow: "0 4px 16px rgba(15, 23, 42, 0.12)",
          fontSize: "13px",
          fontWeight: 600,
          whiteSpace: "nowrap",
        }}
      >
        <span aria-hidden="true">📞</span>
        Bizi Arayın
      </button>
    </div>
  );
}
