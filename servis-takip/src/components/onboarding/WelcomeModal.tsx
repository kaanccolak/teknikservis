"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function WelcomeModal() {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetch("/api/settings")
      .then((r) => r.json())
      .then((data: Record<string, string>) => {
        if (!data.onboarding_welcome_shown) setOpen(true);
      })
      .catch(() => null);
  }, []);

  async function close() {
    setSaving(true);
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboarding_welcome_shown: "1" }),
      });
    } catch { /* empty */ } finally {
      setSaving(false);
    }
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 9999, padding: "16px", overflowY: "auto" }}>
      <div style={{ background: "white", borderRadius: "16px", padding: "28px 24px", width: "100%", maxWidth: "560px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", margin: "auto", maxHeight: "calc(100vh - 32px)", overflowY: "auto" }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎉</div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#111827", marginBottom: "8px" }}>Hoş geldiniz!</h1>
          <p style={{ fontSize: "15px", color: "#6b7280" }}>Teknik servis yönetim paneliniz hazır</p>
        </div>
        <div style={{ display: "grid", gap: "12px", marginBottom: "28px" }}>
          {[
            { icon: "⚡", title: "Hızlı Kurulum ile Başlayın", desc: "Şirketim → Tanımlar sekmesinde 'Hızlı Kurulum' butonuna tıklayın, servis türünüzü seçin. Cihaz türleri, markalar ve modeller otomatik yüklensin." },
            { icon: "📋", title: "Cihaz Kayıt ve Takip", desc: "Müşteri cihazlarını kaydedin, otomatik kayıt numarası alın ve durumlarını tek ekrandan takip edin. Servis giriş fişi ve teslim fişi otomatik oluşur." },
            { icon: "💬", title: "WhatsApp Bildirimleri", desc: "Cihaz durumu değiştiğinde müşteriye otomatik WhatsApp mesajı gönderin. Şirketim → WhatsApp sekmesinden numaranızı bağlayın." },
            { icon: "📦", title: "Stok ve Parça Yönetimi", desc: "Yedek parça stoğunuzu takip edin, servis kaydına parça ekleyince stok otomatik düşer." },
            { icon: "📊", title: "Raporlar ve Ciro", desc: "Günlük, haftalık ve aylık ciro takibi yapın. Hangi cihaz türünden ne kadar gelir elde ettiğinizi görün." },
            { icon: "🔑", title: "Güvenlik", desc: "Şirket ayarlarınızı korumak için sağ üstteki 'Şirket parolası oluştur' seçeneğiyle bir parola belirleyin." },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "12px", background: "#f9fafb", borderRadius: "10px" }}>
              <span style={{ fontSize: "20px", flexShrink: 0 }}>{item.icon}</span>
              <div>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "#111827", marginBottom: "2px" }}>{item.title}</p>
                <p style={{ fontSize: "12px", color: "#6b7280", lineHeight: "1.5" }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div style={{ background: "#eff6ff", borderRadius: "10px", padding: "14px 16px", marginBottom: "24px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
          <span style={{ fontSize: "18px" }}>💡</span>
          <p style={{ fontSize: "13px", color: "#1d4ed8", lineHeight: "1.5" }}>
            <strong>İlk yapmanız gereken:</strong> Şirket bilgilerinizi doldurun, ardından <strong>Tanımlar → Hızlı Kurulum</strong> ile servis türünüzü seçerek cihaz tanımlarınızı otomatik yükleyin.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <Link
            href="/sirketim"
            onClick={() => void close()}
            style={{ flex: 1, padding: "12px", background: "#4f46e5", color: "white", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 600, textAlign: "center", textDecoration: "none", display: "block" }}
          >
            Şirketim&apos;e Git →
          </Link>
          <button
            type="button"
            onClick={() => void close()}
            disabled={saving}
            style={{ flex: 1, padding: "12px", background: "white", color: "#374151", border: "1px solid #e5e7eb", borderRadius: "10px", fontSize: "14px", cursor: "pointer" }}
          >
            Paneli Keşfet
          </button>
        </div>
      </div>
    </div>
  );
}
