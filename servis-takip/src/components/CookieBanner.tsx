"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function CookieBanner() {
  const [goster, setGoster] = useState(false);

  useEffect(() => {
    const onay = localStorage.getItem("cerez-onay");
    if (!onay) setGoster(true);
  }, []);

  function kabul() {
    localStorage.setItem("cerez-onay", "kabul");
    setGoster(false);
  }

  function reddet() {
    localStorage.setItem("cerez-onay", "reddet");
    setGoster(false);
  }

  if (!goster) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: "24px",
      left: "50%",
      transform: "translateX(-50%)",
      width: "calc(100% - 48px)",
      maxWidth: "680px",
      background: "#111827",
      color: "white",
      borderRadius: "16px",
      padding: "20px 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "16px",
      boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      zIndex: 9999,
      flexWrap: "wrap",
    }}>
      <p style={{ fontSize: "13px", color: "#d1d5db", lineHeight: "1.6", margin: 0, flex: 1, minWidth: "200px" }}>
        🍪 Bu site, hizmet kalitesini artırmak için zorunlu çerezler kullanmaktadır.{" "}
        <Link href="/kvkk" style={{ color: "#818cf8", textDecoration: "underline" }}>
          KVKK Aydınlatma Metni
        </Link>
        {" "}ve{" "}
        <Link href="/gizlilik-politikasi" style={{ color: "#818cf8", textDecoration: "underline" }}>
          Gizlilik Politikası
        </Link>
      </p>
      <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
        <button
          type="button"
          onClick={reddet}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            border: "1px solid #374151",
            background: "transparent",
            color: "#9ca3af",
            fontSize: "13px",
            cursor: "pointer",
          }}
        >
          Reddet
        </button>
        <button
          type="button"
          onClick={kabul}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            border: "none",
            background: "#4f46e5",
            color: "white",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Kabul Et
        </button>
      </div>
    </div>
  );
}
