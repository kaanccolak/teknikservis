"use client";

import { useEffect, useState } from "react";

export default function DemoBanner() {
  const [isDemo, setIsDemo] = useState(false);
  const [showUnlock, setShowUnlock] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void fetch("/api/shop")
      .then((r) => r.json())
      .then((d) => setIsDemo(d.isDemo === true))
      .catch(() => {});
  }, []);

  function handleUnlock() {
    if (password === "Kaanky316293!") {
      localStorage.setItem("demo_unlocked", "1");
      window.location.reload();
    } else {
      setError("Yanlış şifre");
    }
  }

  if (typeof window !== "undefined" && localStorage.getItem("demo_unlocked") === "1")
    return null;
  if (!isDemo) return null;

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          background: "#f59e0b",
          color: "white",
          padding: "8px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "13px",
          fontWeight: 500,
        }}
      >
        <span>
          🔍 Demo hesap — Sadece görüntüleme modu. Değişiklik yapılamaz.
        </span>
        <button
          type="button"
          onClick={() => setShowUnlock(true)}
          style={{
            background: "white",
            color: "#f59e0b",
            border: "none",
            borderRadius: "6px",
            padding: "4px 12px",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Demo Modundan Çık
        </button>
      </div>

      <div style={{ height: "40px" }} />

      {showUnlock ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "32px",
              width: "100%",
              maxWidth: "380px",
              margin: "0 16px",
            }}
          >
            <h2
              style={{
                fontSize: "18px",
                fontWeight: 600,
                marginBottom: "8px",
              }}
            >
              Demo Modundan Çık
            </h2>
            <p
              style={{
                fontSize: "13px",
                color: "#6b7280",
                marginBottom: "20px",
              }}
            >
              Yönetici şifresini girin
            </p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
              placeholder="Şifre"
              style={{
                width: "100%",
                padding: "10px 12px",
                border: error ? "1px solid #fca5a5" : "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
                marginBottom: "8px",
              }}
              autoFocus
            />
            {error ? (
              <p style={{ fontSize: "12px", color: "#dc2626", marginBottom: "8px" }}>
                {error}
              </p>
            ) : null}
            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
              <button
                type="button"
                onClick={handleUnlock}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "#111827",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Giriş Yap
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUnlock(false);
                  setError("");
                  setPassword("");
                }}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "white",
                  color: "#374151",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
