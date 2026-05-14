"use client";

import { useState } from "react";
import { toast } from "sonner";

export default function OneriModal() {
  const [open, setOpen] = useState(false);
  const [kategori, setKategori] = useState<"oneri" | "hata" | "diger">("oneri");
  const [mesaj, setMesaj] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleGonder() {
    if (!mesaj.trim()) {
      toast.error("Lütfen bir mesaj yazın");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/oneri", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kategori, mesaj }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Gönderilemedi");
        return;
      }
      toast.success("Teşekkürler! Öneriniz alındı 🙏");
      setMesaj("");
      setKategori("oneri");
      setOpen(false);
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          width: "100%",
          padding: "10px 16px",
          background: "none",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontSize: "14px",
          color: "#6b7280",
          textAlign: "left",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#f3f4f6";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "none";
        }}
      >
        <span style={{ fontSize: "16px" }}>💡</span>
        Öneri Gönder
      </button>

      {open ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "460px",
              overflow: "hidden",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "20px 24px",
                background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <p style={{ fontSize: "16px", fontWeight: 700, color: "white", margin: 0 }}>
                  💡 Öneri & Geri Bildirim
                </p>
                <p
                  style={{
                    fontSize: "12px",
                    color: "rgba(255,255,255,0.75)",
                    margin: "3px 0 0 0",
                  }}
                >
                  Görüşleriniz uygulamayı geliştirmemize yardımcı olur
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  border: "none",
                  borderRadius: "8px",
                  padding: "6px 10px",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "16px",
                }}
              >
                ×
              </button>
            </div>

            {/* İçerik */}
            <div style={{ padding: "24px" }}>
              {/* Kategori */}
              <p style={{ fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "10px" }}>
                Kategori
              </p>
              <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
                {[
                  { id: "oneri", label: "💡 Öneri", color: "#2563eb", bg: "#eff6ff" },
                  { id: "hata", label: "🐛 Hata Bildirimi", color: "#dc2626", bg: "#fef2f2" },
                  { id: "diger", label: "💬 Diğer", color: "#374151", bg: "#f9fafb" },
                ].map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => setKategori(k.id as typeof kategori)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "20px",
                      border: "2px solid",
                      borderColor: kategori === k.id ? k.color : "#e5e7eb",
                      background: kategori === k.id ? k.bg : "white",
                      color: kategori === k.id ? k.color : "#6b7280",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {k.label}
                  </button>
                ))}
              </div>

              {/* Mesaj */}
              <p style={{ fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "8px" }}>
                {kategori === "hata" ? "Hatayı açıklayın" : "Önerinizi yazın"}
              </p>
              <textarea
                value={mesaj}
                onChange={(e) => setMesaj(e.target.value)}
                rows={5}
                placeholder={
                  kategori === "hata"
                    ? "Hangi sayfada, ne yapınca hata oluştu? Mümkünse adım adım anlatın..."
                    : kategori === "oneri"
                      ? "Hangi özelliğin eklenmesini istersiniz? Nasıl çalışmasını hayal ediyorsunuz?..."
                      : "Mesajınızı buraya yazın..."
                }
                style={{
                  width: "100%",
                  border: "1px solid #d1d5db",
                  borderRadius: "10px",
                  padding: "12px",
                  fontSize: "13px",
                  resize: "vertical",
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                  lineHeight: "1.6",
                  minHeight: "120px",
                }}
              />
              <p style={{ fontSize: "11px", color: "#9ca3af", marginTop: "6px" }}>
                Dükkan adınız ve e-posta adresiniz otomatik eklenecek.
              </p>

              {/* Butonlar */}
              <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
                <button
                  type="button"
                  onClick={() => void handleGonder()}
                  disabled={loading || !mesaj.trim()}
                  style={{
                    flex: 1,
                    padding: "11px",
                    background:
                      loading || !mesaj.trim() ? "#e5e7eb" : "linear-gradient(135deg, #4f46e5, #7c3aed)",
                    color: loading || !mesaj.trim() ? "#9ca3af" : "white",
                    border: "none",
                    borderRadius: "10px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: loading || !mesaj.trim() ? "not-allowed" : "pointer",
                  }}
                >
                  {loading ? "Gönderiliyor..." : "Gönder"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  style={{
                    padding: "11px 20px",
                    background: "white",
                    color: "#374151",
                    border: "1px solid #e5e7eb",
                    borderRadius: "10px",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
