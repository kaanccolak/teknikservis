"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function DemoBanner() {
  const [isDemo, setIsDemo] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showUnlock, setShowUnlock] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void fetch("/api/shop")
      .then((r) => r.json())
      .then((d) => {
        setIsDemo(d.isDemo === true);
        setIsUnlocked(
          typeof document !== "undefined" &&
            document.cookie.includes("demo_unlocked=true"),
        );
      })
      .catch(() => {});
  }, []);

  async function handleUnlock() {
    if (!password.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/demo/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setIsUnlocked(true);
        setShowUnlock(false);
        setPassword("");
        toast.success("Demo modu devre dışı bırakıldı!");
        window.location.reload();
      } else {
        setError("Yanlış şifre");
      }
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setLoading(false);
    }
  }

  async function handleLock() {
    await fetch("/api/demo/lock", { method: "POST" });
    setIsUnlocked(false);
    toast.success("Demo moduna geçildi");
    window.location.reload();
  }

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
          background: isUnlocked ? "#16a34a" : "#f59e0b",
          color: "white",
          padding: "8px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "13px",
          fontWeight: 500,
          gap: "8px",
        }}
      >
        <span>
          {isUnlocked
            ? "✅ Demo modu devre dışı — Tüm işlemler aktif"
            : "🔍 Demo hesap — Sadece görüntüleme modu"}
        </span>
        <div style={{ display: "flex", gap: "8px" }}>
          {isUnlocked ? (
            <button
              type="button"
              onClick={() => void handleLock()}
              style={{
                background: "white",
                color: "#16a34a",
                border: "none",
                borderRadius: "6px",
                padding: "4px 12px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Salt Okunur Moda Geç
            </button>
          ) : (
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
          )}
        </div>
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
            padding: "16px",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "32px",
              width: "100%",
              maxWidth: "380px",
            }}
          >
            <h2
              style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}
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
              onKeyDown={(e) => e.key === "Enter" && void handleUnlock()}
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
              <p
                style={{ fontSize: "12px", color: "#dc2626", marginBottom: "8px" }}
              >
                {error}
              </p>
            ) : null}
            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
              <button
                type="button"
                onClick={() => void handleUnlock()}
                disabled={loading}
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
                {loading ? "Kontrol ediliyor..." : "Giriş Yap"}
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
