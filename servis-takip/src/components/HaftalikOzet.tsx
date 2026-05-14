"use client";

import { useEffect, useState } from "react";

type OzetData = {
  hafta: string;
  yeniKayit: number;
  teslimEdilen: number;
  ciro: string;
  enCokCihazlar: string;
  ortTamirSuresi: string;
  bekleyenEskiKayit: number;
  enKarliIs: string;
  aiYorum: string;
};

export default function HaftalikOzet() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<OzetData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchOzet() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai-haftalik-ozet", { method: "POST" });
      const json = (await res.json()) as OzetData & { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Yüklenemedi");
        return;
      }
      setData(json);
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open && !data) void fetchOzet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div style={{ marginBottom: "16px" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 16px",
          borderRadius: "10px",
          border: "1px solid #e5e7eb",
          background: open ? "#f5f3ff" : "white",
          cursor: "pointer",
          fontSize: "13px",
          fontWeight: 600,
          color: "#4f46e5",
        }}
      >
        📊 Geçen Hafta Performans Özeti
        <span style={{ fontSize: "11px", fontWeight: 400, color: "#9ca3af" }}>
          {open ? "▲ Kapat" : "▼ Göster"}
        </span>
      </button>

      {open ? (
        <div
          style={{
            marginTop: "12px",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            background: "white",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "14px 20px",
              background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <p style={{ fontSize: "14px", fontWeight: 700, color: "white", margin: 0 }}>
                📊 Haftalık Performans Özeti
              </p>
              {data ? (
                <p
                  style={{
                    fontSize: "11px",
                    color: "rgba(255,255,255,0.7)",
                    margin: "2px 0 0 0",
                  }}
                >
                  {data.hafta}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => void fetchOzet()}
              disabled={loading}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "none",
                borderRadius: "8px",
                padding: "6px 12px",
                color: "white",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              {loading ? "⏳" : "🔄 Yenile"}
            </button>
          </div>

          {loading ? (
            <div style={{ padding: "32px", textAlign: "center", color: "#6b7280", fontSize: "13px" }}>
              ⏳ Özet hazırlanıyor...
            </div>
          ) : error ? (
            <div style={{ padding: "20px", textAlign: "center", color: "#dc2626", fontSize: "13px" }}>
              {error}
            </div>
          ) : data ? (
            <div style={{ padding: "16px 20px" }}>
              {/* Stat kartları */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "10px",
                  marginBottom: "16px",
                }}
              >
                {[
                  { label: "Yeni Kayıt", value: data.yeniKayit, icon: "📋", color: "#3b82f6" },
                  { label: "Teslim Edilen", value: data.teslimEdilen, icon: "✅", color: "#10b981" },
                  { label: "Ciro", value: data.ciro, icon: "💰", color: "#f59e0b" },
                  { label: "Ort. Tamir Süresi", value: data.ortTamirSuresi, icon: "⏱️", color: "#6366f1" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    style={{
                      padding: "12px",
                      borderRadius: "10px",
                      background: "#f9fafb",
                      border: `1px solid ${stat.color}30`,
                      textAlign: "center",
                    }}
                  >
                    <p style={{ fontSize: "18px", margin: "0 0 4px 0" }}>{stat.icon}</p>
                    <p
                      style={{
                        fontSize: "16px",
                        fontWeight: 700,
                        color: stat.color,
                        margin: "0 0 2px 0",
                      }}
                    >
                      {stat.value}
                    </p>
                    <p style={{ fontSize: "10px", color: "#9ca3af", margin: 0 }}>{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Detaylar */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                  marginBottom: "16px",
                }}
              >
                <div style={{ padding: "10px 12px", background: "#f9fafb", borderRadius: "8px" }}>
                  <p style={{ fontSize: "10px", color: "#9ca3af", margin: "0 0 3px 0" }}>
                    En Çok Gelen Cihazlar
                  </p>
                  <p style={{ fontSize: "12px", fontWeight: 500, color: "#374151", margin: 0 }}>
                    {data.enCokCihazlar}
                  </p>
                </div>
                <div style={{ padding: "10px 12px", background: "#f9fafb", borderRadius: "8px" }}>
                  <p style={{ fontSize: "10px", color: "#9ca3af", margin: "0 0 3px 0" }}>En Karlı İş</p>
                  <p style={{ fontSize: "12px", fontWeight: 500, color: "#374151", margin: 0 }}>
                    {data.enKarliIs}
                  </p>
                </div>
              </div>

              {data.bekleyenEskiKayit > 0 ? (
                <div
                  style={{
                    padding: "10px 14px",
                    background: "#fef9c3",
                    borderRadius: "8px",
                    marginBottom: "12px",
                    display: "flex",
                    gap: "8px",
                    alignItems: "center",
                  }}
                >
                  <span>⚠️</span>
                  <p style={{ fontSize: "12px", color: "#854d0e", margin: 0 }}>
                    Önceki haftalardan <strong>{data.bekleyenEskiKayit}</strong> kayıt hâlâ teslim
                    edilmedi.
                  </p>
                </div>
              ) : null}

              {/* AI Yorum */}
              {data.aiYorum ? (
                <div
                  style={{
                    padding: "14px 16px",
                    background: "linear-gradient(135deg, #eff6ff, #f5f3ff)",
                    border: "1px solid #c7d2fe",
                    borderRadius: "10px",
                  }}
                >
                  <p
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#4f46e5",
                      margin: "0 0 6px 0",
                    }}
                  >
                    🤖 AI Değerlendirmesi
                  </p>
                  <p style={{ fontSize: "12px", color: "#374151", lineHeight: "1.6", margin: 0 }}>
                    {data.aiYorum}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
